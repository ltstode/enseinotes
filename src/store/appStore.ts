import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  SchoolYear, ClassRoom, PedagogicalUnit,
  Evaluation, Grade, Student, TeacherData, Period, CustomCalendarEvent,
} from '@/types/enseinotes';

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

const normalizeLastName  = (v: string) => v.trim().toUpperCase();
const normalizeFirstName = (v: string) =>
  v.trim().split(/\s+/).filter(Boolean)
   .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
   .join(' ');

const normalizeStudent = (s: Omit<Student, 'id'>): Omit<Student, 'id'> => ({
  ...s,
  lastName:  normalizeLastName(s.lastName),
  firstName: normalizeFirstName(s.firstName),
  studentId: s.studentId.trim(),
});

const sortStudentsAZ = (students: Student[]) =>
  [...students].sort((a, b) => {
    const c = a.lastName.localeCompare(b.lastName, 'fr');
    return c !== 0 ? c : a.firstName.localeCompare(b.firstName, 'fr');
  });

const getStorageKey = (teacherId: string) => `enseinotes_data_${teacherId}`;

const loadTeacherData = (teacherId: string): TeacherData | null => {
  try {
    const raw = localStorage.getItem(getStorageKey(teacherId));
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      ...p,
      schoolYears:      p.schoolYears.map((y: SchoolYear) => ({ ...y, createdAt: new Date(y.createdAt) })),
      classRooms:       p.classRooms.map((c: ClassRoom) => ({ ...c, createdAt: new Date(c.createdAt) })),
      pedagogicalUnits: p.pedagogicalUnits.map((u: PedagogicalUnit) => ({
        ...u, createdAt: new Date(u.createdAt), periodSystem: u.periodSystem || 'semester',
      })),
      periods: (p.periods || []).map((per: Period) => ({
        ...per,
        createdAt: new Date(per.createdAt),
        startDate: per.startDate ? new Date(per.startDate) : undefined,
        endDate:   per.endDate   ? new Date(per.endDate)   : undefined,
        periodType: per.periodType || 'custom',
        status: per.status || 'active',
        expectedDevoirs:  per.expectedDevoirs  ?? 2,
        expectedInterros: per.expectedInterros ?? 3,
      })),
      evaluations: p.evaluations.map((e: Evaluation) => ({ ...e, date: new Date(e.date) })),
      grades: p.grades.map((g: Grade) => ({
        ...g,
        createdAt:  new Date(g.createdAt),
        modifiedAt: g.modifiedAt ? new Date(g.modifiedAt) : undefined,
        history: g.history.map((h: { value: number; modifiedAt: string | Date; reason: string }) => ({
          ...h, modifiedAt: new Date(h.modifiedAt),
        })),
      })),
      customEvents: (p.customEvents || []).map((ev: CustomCalendarEvent) => ({
        ...ev,
        date:      new Date(ev.date),
        endDate:   ev.endDate ? new Date(ev.endDate) : undefined,
        createdAt: new Date(ev.createdAt),
      })),
    };
  } catch {
    return null;
  }
};

const saveTeacherData = (teacherId: string, data: TeacherData) =>
  localStorage.setItem(getStorageKey(teacherId), JSON.stringify(data));

// ── State shape ───────────────────────────────────────────────────────────────
interface AppData {
  schoolYears:      SchoolYear[];
  classRooms:       ClassRoom[];
  pedagogicalUnits: PedagogicalUnit[];
  periods:          Period[];
  evaluations:      Evaluation[];
  grades:           Grade[];
  customEvents:     CustomCalendarEvent[];
  activeYearId:     string | null;
}

export interface SyncStatus {
  state: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  error?: string;
}

interface AppStore extends AppData {
  // ── Meta ──────────────────────────────────────────────────────────────────
  savedUnits:   Set<string>;
  syncStatus:   SyncStatus;
  isInitialized: boolean;
  _teacherId:   string | null;
  _saveTimer:   ReturnType<typeof setTimeout> | null;

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  initForTeacher: (teacherId: string) => void;
  resetStore:     () => void;

  // ── Persistence ──────────────────────────────────────────────────────────
  _scheduleSave: () => void;
  _persistNow:   () => void;

  // ── SchoolYears ──────────────────────────────────────────────────────────
  addSchoolYear: (year: Omit<SchoolYear, 'id' | 'createdAt'>) => void;
  setActiveYear: (yearId: string | null) => void;

  // ── ClassRooms ───────────────────────────────────────────────────────────
  addClassRoom:    (classRoom: Omit<ClassRoom, 'id' | 'createdAt'>) => void;
  updateClassRoom: (classRoomId: string, updates: Partial<Pick<ClassRoom, 'name'>>) => void;
  deleteClassRoom: (classRoomId: string) => void;

  // ── Students ──────────────────────────────────────────────────────────────
  addStudentToClass:    (classRoomId: string, student: Omit<Student, 'id'>) => void;
  updateStudentInClass: (classRoomId: string, studentId: string, updates: Partial<Student>) => void;
  deleteStudentFromClass:(classRoomId: string, studentId: string) => void;

  // ── PedagogicalUnits ─────────────────────────────────────────────────────
  addPedagogicalUnit:    (unit: Omit<PedagogicalUnit, 'id' | 'createdAt'>) => void;
  updatePedagogicalUnit: (unitId: string, updates: Partial<PedagogicalUnit>) => void;
  deletePedagogicalUnit: (unitId: string) => void;

  // ── Periods ──────────────────────────────────────────────────────────────
  addPeriod:     (period: Omit<Period, 'id' | 'createdAt'>) => void;
  updatePeriod:  (periodId: string, updates: Partial<Pick<Period, 'name' | 'order' | 'status'>>) => void;
  deletePeriod:  (periodId: string) => void;
  completePeriod:(periodId: string) => void;
  activatePeriod:(periodId: string) => void;

  // ── Evaluations ──────────────────────────────────────────────────────────
  addEvaluation: (evaluation: Omit<Evaluation, 'id'>) => void;

  // ── Grades ────────────────────────────────────────────────────────────────
  addGrade:        (grade: Omit<Grade, 'id' | 'createdAt' | 'history' | 'isLocked'>) => void;
  updateGrade:     (gradeId: string, newValue: number, reason: string) => void;
  updateGradeValue:(gradeId: string, newValue: number) => void;
  saveGrades:      (unitId: string) => void;

  // ── Custom Events ─────────────────────────────────────────────────────────
  addCustomEvent:    (event: Omit<CustomCalendarEvent, 'id' | 'createdAt'>) => void;
  deleteCustomEvent: (eventId: string) => void;

  // ── Selectors (stable references, no recomputation unless deps change) ────
  getClassesByYear:      (yearId: string) => ClassRoom[];
  getUnitsByClass:       (classId: string) => PedagogicalUnit[];
  getStudentsByClass:    (classId: string) => Student[];
  getEvaluationsByUnit:  (unitId: string) => Evaluation[];
  getEvaluationsByPeriod:(periodId: string) => Evaluation[];
  getPeriodsByUnit:      (unitId: string) => Period[];
  isUnitSaved:           (unitId: string) => boolean;
  calculateAverage:      (studentId: string, unitId: string) => number | null;

  // ── Import / Export ──────────────────────────────────────────────────────
  exportData: () => string;
  importData: (jsonData: string) => { success: boolean; error?: string };
}

const emptyData: AppData = {
  schoolYears: [], classRooms: [], pedagogicalUnits: [],
  periods: [], evaluations: [], grades: [], customEvents: [],
  activeYearId: null,
};

// ── Store ─────────────────────────────────────────────────────────────────────
export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // ── Initial state ────────────────────────────────────────────────────────
    ...emptyData,
    savedUnits:    new Set<string>(),
    syncStatus:    { state: 'idle', lastSavedAt: null },
    isInitialized: false,
    _teacherId:    null,
    _saveTimer:    null,

    // ── Bootstrap ────────────────────────────────────────────────────────────
    initForTeacher: (teacherId) => {
      const data = loadTeacherData(teacherId);
      if (data) {
        set({
          ...data,
          customEvents: data.customEvents || [],
          periods:      data.periods      || [],
          savedUnits:   new Set(data.savedUnits || []),
          isInitialized: true,
          _teacherId:   teacherId,
          syncStatus:   { state: 'idle', lastSavedAt: null },
        });
      } else {
        set({ ...emptyData, savedUnits: new Set(), isInitialized: true, _teacherId: teacherId });
      }
    },

    resetStore: () => {
      const { _saveTimer } = get();
      if (_saveTimer) clearTimeout(_saveTimer);
      set({ ...emptyData, savedUnits: new Set(), isInitialized: false, _teacherId: null, _saveTimer: null });
    },

    // ── Persistence ──────────────────────────────────────────────────────────
    _persistNow: () => {
      const s = get();
      if (!s._teacherId || !s.isInitialized) return;
      try {
        saveTeacherData(s._teacherId, {
          schoolYears: s.schoolYears, classRooms: s.classRooms,
          pedagogicalUnits: s.pedagogicalUnits, periods: s.periods,
          evaluations: s.evaluations, grades: s.grades,
          customEvents: s.customEvents, activeYearId: s.activeYearId,
          savedUnits: Array.from(s.savedUnits),
        });
        set({ syncStatus: { state: 'saved', lastSavedAt: new Date() } });
      } catch (e) {
        set({ syncStatus: { state: 'error', lastSavedAt: null, error: e instanceof Error ? e.message : 'Erreur' } });
      }
    },

    _scheduleSave: () => {
      const { _saveTimer, _persistNow } = get();
      if (_saveTimer) clearTimeout(_saveTimer);
      set({ syncStatus: { state: 'saving', lastSavedAt: get().syncStatus.lastSavedAt } });
      const timer = setTimeout(() => { _persistNow(); }, 600);
      set({ _saveTimer: timer });
    },

    // ── SchoolYears ──────────────────────────────────────────────────────────
    addSchoolYear: (year) => {
      const newYear: SchoolYear = { ...year, id: generateId(), createdAt: new Date() };
      set(s => ({ schoolYears: [...s.schoolYears, newYear], activeYearId: newYear.id }));
      get()._scheduleSave();
    },

    setActiveYear: (yearId) => {
      set(s => ({ ...s, activeYearId: yearId }));
      get()._scheduleSave();
    },

    // ── ClassRooms ───────────────────────────────────────────────────────────
    addClassRoom: (classRoom) => {
      const students = sortStudentsAZ(
        classRoom.students.map(s => ({
          ...normalizeStudent({ firstName: s.firstName, lastName: s.lastName, studentId: s.studentId, status: s.status }),
          id: s.id && s.id.trim() !== '' ? s.id : generateId(),
        }))
      );
      const newClass: ClassRoom = { ...classRoom, id: generateId(), createdAt: new Date(), students };
      set(s => ({ classRooms: [...s.classRooms, newClass] }));
      get()._scheduleSave();
    },

    updateClassRoom: (classRoomId, updates) => {
      set(s => ({ classRooms: s.classRooms.map(c => c.id === classRoomId ? { ...c, ...updates } : c) }));
      get()._scheduleSave();
    },

    deleteClassRoom: (classRoomId) => {
      set(s => {
        const unitIds = s.pedagogicalUnits.filter(u => u.classRoomId === classRoomId).map(u => u.id);
        return {
          classRooms:       s.classRooms.filter(c => c.id !== classRoomId),
          pedagogicalUnits: s.pedagogicalUnits.filter(u => u.classRoomId !== classRoomId),
          evaluations:      s.evaluations.filter(e => !unitIds.includes(e.pedagogicalUnitId)),
          grades:           s.grades.filter(g => {
            const ev = s.evaluations.find(e => e.id === g.evaluationId);
            return !unitIds.includes(ev?.pedagogicalUnitId ?? '');
          }),
        };
      });
      get()._scheduleSave();
    },

    // ── Students ─────────────────────────────────────────────────────────────
    addStudentToClass: (classRoomId, student) => {
      const newStudent: Student = { ...normalizeStudent(student), id: generateId() };
      set(s => ({
        classRooms: s.classRooms.map(c =>
          c.id !== classRoomId ? c : { ...c, students: sortStudentsAZ([...c.students, newStudent]) }
        ),
      }));
      get()._scheduleSave();
    },

    updateStudentInClass: (classRoomId, studentId, updates) => {
      set(s => ({
        classRooms: s.classRooms.map(c => {
          if (c.id !== classRoomId) return c;
          const updated = c.students.map(st => {
            if (st.id !== studentId) return st;
            const next = { ...st, ...updates };
            return {
              ...next,
              lastName:  updates.lastName  !== undefined ? normalizeLastName(next.lastName)  : next.lastName,
              firstName: updates.firstName !== undefined ? normalizeFirstName(next.firstName) : next.firstName,
            };
          });
          return { ...c, students: sortStudentsAZ(updated) };
        }),
      }));
      get()._scheduleSave();
    },

    deleteStudentFromClass: (classRoomId, studentId) => {
      set(s => ({
        classRooms: s.classRooms.map(c =>
          c.id !== classRoomId ? c : { ...c, students: sortStudentsAZ(c.students.filter(st => st.id !== studentId)) }
        ),
        grades: s.grades.filter(g => g.studentId !== studentId),
      }));
      get()._scheduleSave();
    },

    // ── PedagogicalUnits ─────────────────────────────────────────────────────
    addPedagogicalUnit: (unit) => {
      const newUnit: PedagogicalUnit = { ...unit, id: generateId(), createdAt: new Date() };
      set(s => ({ pedagogicalUnits: [...s.pedagogicalUnits, newUnit] }));
      get()._scheduleSave();
    },

    updatePedagogicalUnit: (unitId, updates) => {
      set(s => ({ pedagogicalUnits: s.pedagogicalUnits.map(u => u.id === unitId ? { ...u, ...updates } : u) }));
      get()._scheduleSave();
    },

    deletePedagogicalUnit: (unitId) => {
      set(s => {
        const evalIds = s.evaluations.filter(e => e.pedagogicalUnitId === unitId).map(e => e.id);
        return {
          pedagogicalUnits: s.pedagogicalUnits.filter(u => u.id !== unitId),
          periods:          s.periods.filter(p => p.pedagogicalUnitId !== unitId),
          evaluations:      s.evaluations.filter(e => e.pedagogicalUnitId !== unitId),
          grades:           s.grades.filter(g => !evalIds.includes(g.evaluationId)),
        };
      });
      get()._scheduleSave();
    },

    // ── Periods ──────────────────────────────────────────────────────────────
    addPeriod: (period) => {
      const newPeriod: Period = {
        ...period, id: generateId(), createdAt: new Date(),
        status:           period.status      || 'locked',
        periodType:       period.periodType  || 'custom',
        expectedDevoirs:  period.expectedDevoirs  ?? 2,
        expectedInterros: period.expectedInterros ?? 3,
      };
      set(s => ({ periods: [...s.periods, newPeriod] }));
      get()._scheduleSave();
    },

    updatePeriod: (periodId, updates) => {
      set(s => ({ periods: s.periods.map(p => p.id === periodId ? { ...p, ...updates } : p) }));
      get()._scheduleSave();
    },

    deletePeriod: (periodId) => {
      set(s => ({
        periods:     s.periods.filter(p => p.id !== periodId),
        evaluations: s.evaluations.map(e => e.periodId === periodId ? { ...e, periodId: undefined } : e),
      }));
      get()._scheduleSave();
    },

    completePeriod: (periodId) => {
      set(s => {
        const cur = s.periods.find(p => p.id === periodId);
        if (!cur) return s;
        const unitPeriods = s.periods.filter(p => p.pedagogicalUnitId === cur.pedagogicalUnitId).sort((a, b) => a.order - b.order);
        const idx = unitPeriods.findIndex(p => p.id === periodId);
        const next = unitPeriods[idx + 1];
        return {
          periods: s.periods.map(p => {
            if (p.id === periodId) return { ...p, status: 'completed' };
            if (next && p.id === next.id) return { ...p, status: 'active' };
            return p;
          }),
        };
      });
      get()._scheduleSave();
    },

    activatePeriod: (periodId) => {
      set(s => {
        const target = s.periods.find(p => p.id === periodId);
        if (!target) return s;
        return {
          periods: s.periods.map(p => {
            if (p.pedagogicalUnitId !== target.pedagogicalUnitId) return p;
            if (p.id === periodId) return { ...p, status: 'active' };
            if (p.status === 'active') return { ...p, status: 'completed' };
            return p;
          }),
        };
      });
      get()._scheduleSave();
    },

    // ── Evaluations ──────────────────────────────────────────────────────────
    addEvaluation: (evaluation) => {
      const newEval: Evaluation = { ...evaluation, id: generateId() };
      set(s => ({ evaluations: [...s.evaluations, newEval] }));
      get()._scheduleSave();
    },

    // ── Grades ────────────────────────────────────────────────────────────────
    addGrade: (grade) => {
      const newGrade: Grade = { ...grade, id: generateId(), createdAt: new Date(), history: [], isLocked: false };
      set(s => ({ grades: [...s.grades, newGrade] }));
      get()._scheduleSave();
    },

    updateGradeValue: (gradeId, newValue) => {
      set(s => ({
        grades: s.grades.map(g => g.id === gradeId && !g.isLocked ? { ...g, value: newValue } : g),
      }));
      get()._scheduleSave();
    },

    saveGrades: (unitId) => {
      set(s => {
        const evalIds = s.evaluations.filter(e => e.pedagogicalUnitId === unitId).map(e => e.id);
        return {
          grades:     s.grades.map(g => evalIds.includes(g.evaluationId) ? { ...g, isLocked: true } : g),
          savedUnits: new Set([...s.savedUnits, unitId]),
        };
      });
      get()._scheduleSave();
    },

    updateGrade: (gradeId, newValue, reason) => {
      set(s => ({
        grades: s.grades.map(g => {
          if (g.id !== gradeId || !g.isLocked || g.history.length > 0) return g;
          return {
            ...g, value: newValue, modifiedAt: new Date(),
            history: [...g.history, { value: g.value, modifiedAt: new Date(), reason }],
          };
        }),
      }));
      get()._scheduleSave();
    },

    // ── Custom Events ─────────────────────────────────────────────────────────
    addCustomEvent: (event) => {
      const newEvent: CustomCalendarEvent = { ...event, id: generateId(), createdAt: new Date() };
      set(s => ({ customEvents: [...s.customEvents, newEvent] }));
      get()._scheduleSave();
    },

    deleteCustomEvent: (eventId) => {
      set(s => ({ customEvents: s.customEvents.filter(e => e.id !== eventId) }));
      get()._scheduleSave();
    },

    // ── Selectors ─────────────────────────────────────────────────────────────
    // Ces fonctions lisent le state courant via get() — elles sont stables
    // car elles ne sont jamais recréées (définies une seule fois dans le store).
    getClassesByYear:       (yearId)  => get().classRooms.filter(c => c.schoolYearId === yearId),
    getUnitsByClass:        (classId) => get().pedagogicalUnits.filter(u => u.classRoomId === classId),
    getStudentsByClass:     (classId) => get().classRooms.find(c => c.id === classId)?.students ?? [],
    getEvaluationsByUnit:   (unitId)  => get().evaluations.filter(e => e.pedagogicalUnitId === unitId),
    getEvaluationsByPeriod: (pid)     => get().evaluations.filter(e => e.periodId === pid),
    getPeriodsByUnit:       (unitId)  => get().periods.filter(p => p.pedagogicalUnitId === unitId).sort((a, b) => a.order - b.order),
    isUnitSaved:            (unitId)  => get().savedUnits.has(unitId),

    calculateAverage: (studentId, unitId) => {
      const { evaluations, grades } = get();
      const unitEvals = evaluations.filter(e => e.pedagogicalUnitId === unitId);
      const evalIds   = new Set(unitEvals.map(e => e.id));
      const sg        = grades.filter(g => g.studentId === studentId && evalIds.has(g.evaluationId));
      if (sg.length === 0) return null;
      let totalW = 0, totalC = 0;
      sg.forEach(g => {
        const ev = unitEvals.find(e => e.id === g.evaluationId);
        if (ev) { totalW += (g.value / ev.maxScore) * 20 * ev.coefficient; totalC += ev.coefficient; }
      });
      return totalC > 0 ? Math.round((totalW / totalC) * 100) / 100 : null;
    },

    // ── Import / Export ──────────────────────────────────────────────────────
    exportData: () => {
      const s = get();
      return JSON.stringify({
        schoolYears: s.schoolYears, classRooms: s.classRooms,
        pedagogicalUnits: s.pedagogicalUnits, periods: s.periods,
        evaluations: s.evaluations, grades: s.grades,
        customEvents: s.customEvents, activeYearId: s.activeYearId,
        savedUnits: Array.from(s.savedUnits),
      } satisfies TeacherData, null, 2);
    },

    importData: (jsonData) => {
      try {
        const p = JSON.parse(jsonData);
        if (!p.schoolYears || !p.classRooms || !p.pedagogicalUnits || !p.evaluations || !p.grades)
          return { success: false, error: 'Structure de données invalide' };

        const parsed: AppData = {
          schoolYears:      p.schoolYears.map((y: SchoolYear)      => ({ ...y, createdAt: new Date(y.createdAt) })),
          classRooms:       p.classRooms.map((c: ClassRoom)        => ({ ...c, createdAt: new Date(c.createdAt) })),
          pedagogicalUnits: p.pedagogicalUnits.map((u: PedagogicalUnit) => ({ ...u, createdAt: new Date(u.createdAt), periodSystem: u.periodSystem || 'semester' })),
          periods:          (p.periods || []).map((per: Period)    => ({ ...per, createdAt: new Date(per.createdAt), startDate: per.startDate ? new Date(per.startDate) : undefined, endDate: per.endDate ? new Date(per.endDate) : undefined, periodType: per.periodType || 'custom', expectedDevoirs: per.expectedDevoirs ?? 2, expectedInterros: per.expectedInterros ?? 3 })),
          evaluations:      p.evaluations.map((e: Evaluation)      => ({ ...e, date: new Date(e.date) })),
          grades:           p.grades.map((g: Grade)                => ({ ...g, createdAt: new Date(g.createdAt), modifiedAt: g.modifiedAt ? new Date(g.modifiedAt) : undefined, history: g.history.map((h: { value: number; modifiedAt: string | Date; reason: string }) => ({ ...h, modifiedAt: new Date(h.modifiedAt) })) })),
          customEvents:     (p.customEvents || []).map((ev: CustomCalendarEvent) => ({ ...ev, date: new Date(ev.date), endDate: ev.endDate ? new Date(ev.endDate) : undefined, createdAt: new Date(ev.createdAt) })),
          activeYearId:     p.activeYearId,
        };
        set({ ...parsed, savedUnits: new Set(p.savedUnits || []) });
        get()._scheduleSave();
        return { success: true };
      } catch {
        return { success: false, error: 'Fichier JSON invalide' };
      }
    },
  }))
);
