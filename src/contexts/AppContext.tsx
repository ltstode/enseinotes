import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode, useCallback } from 'react';
import { SchoolYear, ClassRoom, PedagogicalUnit, Evaluation, Grade, Student, TeacherData, Period, CustomCalendarEvent } from '@/types/enseinotes';
import { useAuth } from '@/contexts/AuthContext';

// ... (rest of the interface definitions and helper functions remain same)

// I will now update the AppProvider's return statement to include all required functions.
// I'll skip to the relevant part.

interface AppState {
  schoolYears: SchoolYear[];
  classRooms: ClassRoom[];
  pedagogicalUnits: PedagogicalUnit[];
  periods: Period[];
  evaluations: Evaluation[];
  grades: Grade[];
  customEvents: CustomCalendarEvent[];
  activeYearId: string | null;
}

interface AppContextType extends AppState {
  syncStatus: {
    state: 'idle' | 'saving' | 'saved' | 'error';
    lastSavedAt: Date | null;
    error?: string;
  };
  addSchoolYear: (year: Omit<SchoolYear, 'id' | 'createdAt'>) => void;
  addClassRoom: (classRoom: Omit<ClassRoom, 'id' | 'createdAt'>) => void;
  updateClassRoom: (classRoomId: string, updates: Partial<Pick<ClassRoom, 'name'>>) => void;
  deleteClassRoom: (classRoomId: string) => void;
  addStudentToClass: (classRoomId: string, student: Omit<Student, 'id'>) => void;
  updateStudentInClass: (classRoomId: string, studentId: string, updates: Partial<Student>) => void;
  deleteStudentFromClass: (classRoomId: string, studentId: string) => void;
  addPedagogicalUnit: (unit: Omit<PedagogicalUnit, 'id' | 'createdAt'>) => void;
  updatePedagogicalUnit: (unitId: string, updates: Partial<PedagogicalUnit>) => void;
  deletePedagogicalUnit: (unitId: string) => void;
  addPeriod: (period: Omit<Period, 'id' | 'createdAt'>) => void;
  updatePeriod: (periodId: string, updates: Partial<Pick<Period, 'name' | 'order' | 'status'>>) => void;
  deletePeriod: (periodId: string) => void;
  completePeriod: (periodId: string) => void;
  activatePeriod: (periodId: string) => void;
  getPeriodsByUnit: (unitId: string) => Period[];
  addEvaluation: (evaluation: Omit<Evaluation, 'id'>) => void;
  addGrade: (grade: Omit<Grade, 'id' | 'createdAt' | 'history' | 'isLocked'>) => void;
  updateGrade: (gradeId: string, newValue: number, reason: string) => void;
  saveGrades: (unitId: string) => void;
  updateGradeValue: (gradeId: string, newValue: number) => void;
  setActiveYear: (yearId: string | null) => void;
  getClassesByYear: (yearId: string) => ClassRoom[];
  getUnitsByClass: (classId: string) => PedagogicalUnit[];
  getStudentsByClass: (classId: string) => Student[];
  getEvaluationsByUnit: (unitId: string) => Evaluation[];
  getEvaluationsByPeriod: (periodId: string) => Evaluation[];
  calculateAverage: (studentId: string, unitId: string) => number | null;
  isUnitSaved: (unitId: string) => boolean;
  exportData: () => string;
  importData: (jsonData: string) => { success: boolean; error?: string };
  addCustomEvent: (event: Omit<CustomCalendarEvent, 'id' | 'createdAt'>) => void;
  deleteCustomEvent: (eventId: string) => void;
  customEvents: CustomCalendarEvent[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () => {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeLastName = (value: string) => value.trim().toUpperCase();

const normalizeFirstName = (value: string) => {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const normalizeStudent = (student: Omit<Student, 'id'>): Omit<Student, 'id'> => ({
  ...student,
  lastName: normalizeLastName(student.lastName),
  firstName: normalizeFirstName(student.firstName),
  studentId: student.studentId.trim(),
});

const sortStudentsAZ = (students: Student[]) => {
  return [...students].sort((a, b) => {
    const lastNameCompare = a.lastName.localeCompare(b.lastName, 'fr');
    if (lastNameCompare !== 0) return lastNameCompare;
    return a.firstName.localeCompare(b.firstName, 'fr');
  });
};

const getStorageKey = (teacherId: string) => `enseinotes_data_${teacherId}`;

const loadTeacherData = (teacherId: string): TeacherData | null => {
  try {
    const data = localStorage.getItem(getStorageKey(teacherId));
    if (!data) return null;
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      schoolYears: parsed.schoolYears.map((y: SchoolYear) => ({
        ...y,
        createdAt: new Date(y.createdAt),
      })),
      classRooms: parsed.classRooms.map((c: ClassRoom) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      })),
      pedagogicalUnits: parsed.pedagogicalUnits.map((u: PedagogicalUnit) => ({
        ...u,
        createdAt: new Date(u.createdAt),
        periodSystem: u.periodSystem || 'semester',
      })),
      periods: (parsed.periods || []).map((p: Period) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        startDate: p.startDate ? new Date(p.startDate) : undefined,
        endDate: p.endDate ? new Date(p.endDate) : undefined,
        periodType: p.periodType || 'custom',
        status: p.status || 'active',
        expectedDevoirs: p.expectedDevoirs ?? 2,
        expectedInterros: p.expectedInterros ?? 3,
      })),
      evaluations: parsed.evaluations.map((e: Evaluation) => ({
        ...e,
        date: new Date(e.date),
      })),
      grades: parsed.grades.map((g: Grade) => ({
        ...g,
        createdAt: new Date(g.createdAt),
        modifiedAt: g.modifiedAt ? new Date(g.modifiedAt) : undefined,
        history: g.history.map((h) => ({
          ...h,
          modifiedAt: new Date(h.modifiedAt),
        })),
      })),
      customEvents: (parsed.customEvents || []).map((e: CustomCalendarEvent) => ({
        ...e,
        date: new Date(e.date),
        endDate: e.endDate ? new Date(e.endDate) : undefined,
        createdAt: new Date(e.createdAt),
      })),
    };
  } catch {
    return null;
  }
};

const saveTeacherData = (teacherId: string, data: TeacherData) => {
  localStorage.setItem(getStorageKey(teacherId), JSON.stringify(data));
};

const emptyState: AppState = {
  schoolYears: [],
  classRooms: [],
  pedagogicalUnits: [],
  periods: [],
  evaluations: [],
  grades: [],
  customEvents: [],
  activeYearId: null,
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { teacher, isAuthenticated } = useAuth();
  const [state, setState] = useState<AppState>(emptyState);
  const [savedUnits, setSavedUnits] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  const [syncStatus, setSyncStatus] = useState<AppContextType['syncStatus']>({
    state: 'idle',
    lastSavedAt: null,
  });

  const saveTimeoutRef = useRef<number | null>(null);

  const teacherDataToPersist = useMemo<TeacherData | null>(() => {
    if (!teacher?.id || !isInitialized) return null;
    return {
      schoolYears: state.schoolYears,
      classRooms: state.classRooms,
      pedagogicalUnits: state.pedagogicalUnits,
      periods: state.periods,
      evaluations: state.evaluations,
      grades: state.grades,
      customEvents: state.customEvents,
      activeYearId: state.activeYearId,
      savedUnits: Array.from(savedUnits),
    };
  }, [teacher?.id, isInitialized, state, savedUnits]);

  const persistNow = useCallback(() => {
    if (!teacher?.id || !teacherDataToPersist) return;

    try {
      saveTeacherData(teacher.id, teacherDataToPersist);
      setSyncStatus({ state: 'saved', lastSavedAt: new Date() });
    } catch (e) {
      setSyncStatus({
        state: 'error',
        lastSavedAt: null,
        error: e instanceof Error ? e.message : 'Erreur de sauvegarde',
      });
    }
  }, [teacher?.id, teacherDataToPersist]);

  // Load data when teacher changes
  useEffect(() => {
    if (teacher?.id) {
      const data = loadTeacherData(teacher.id);
      if (data) {
        setState({
          schoolYears: data.schoolYears,
          classRooms: data.classRooms,
          pedagogicalUnits: data.pedagogicalUnits,
          periods: data.periods || [],
          evaluations: data.evaluations,
          grades: data.grades,
          customEvents: data.customEvents || [],
          activeYearId: data.activeYearId,
        });
        setSavedUnits(new Set(data.savedUnits || []));
      } else {
        setState(emptyState);
        setSavedUnits(new Set());
      }
      setIsInitialized(true);
      setSyncStatus({ state: 'idle', lastSavedAt: null });
    } else {
      setState(emptyState);
      setSavedUnits(new Set());
      setIsInitialized(false);
      setSyncStatus({ state: 'idle', lastSavedAt: null });
    }
  }, [teacher?.id]);

  // Auto-save (debounced) + sync status
  useEffect(() => {
    if (!teacher?.id || !teacherDataToPersist) return;

    setSyncStatus((prev) => ({
      state: 'saving',
      lastSavedAt: prev.lastSavedAt,
    }));

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      persistNow();
    }, 600);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [teacher?.id, teacherDataToPersist, persistNow]);

  // Flush pending save on tab close/navigation
  useEffect(() => {
    const onBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      persistNow();
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [persistNow]);

  // Migration/normalization
  useEffect(() => {
    if (!isInitialized) return;
    
    const needsFix = state.classRooms.some((c) =>
      c.students.some(
        (s) =>
          !s.id ||
          s.id.trim() === '' ||
          s.lastName !== normalizeLastName(s.lastName) ||
          s.firstName !== normalizeFirstName(s.firstName),
      ),
    );

    if (!needsFix) return;

    setState((prev) => ({
      ...prev,
      classRooms: prev.classRooms.map((c) => ({
        ...c,
        students: sortStudentsAZ(
          c.students.map((s) => ({
            ...s,
            id: s.id && s.id.trim() !== '' ? s.id : generateId(),
            lastName: normalizeLastName(s.lastName),
            firstName: normalizeFirstName(s.firstName),
          })),
        ),
      })),
    }));
  }, [state.classRooms, isInitialized]);

  const addSchoolYear = useCallback((year: Omit<SchoolYear, 'id' | 'createdAt'>) => {
    const newYear: SchoolYear = {
      ...year,
      id: generateId(),
      createdAt: new Date(),
    };
    setState(prev => ({
      ...prev,
      schoolYears: [...prev.schoolYears, newYear],
      activeYearId: newYear.id,
    }));
  }, []);

  const addClassRoom = useCallback((classRoom: Omit<ClassRoom, 'id' | 'createdAt'>) => {
    const normalizedStudents = sortStudentsAZ(
      classRoom.students.map((s) => {
        const id = s.id && s.id.trim() !== '' ? s.id : generateId();
        return { ...normalizeStudent({
          firstName: s.firstName,
          lastName: s.lastName,
          studentId: s.studentId,
          status: s.status,
        }), id };
      }),
    );

    const newClass: ClassRoom = {
      ...classRoom,
      id: generateId(),
      createdAt: new Date(),
      students: normalizedStudents,
    };
    setState(prev => ({
      ...prev,
      classRooms: [...prev.classRooms, newClass],
    }));
  }, []);

  const updateClassRoom = useCallback((classRoomId: string, updates: Partial<Pick<ClassRoom, 'name'>>) => {
    setState(prev => ({
      ...prev,
      classRooms: prev.classRooms.map(c =>
        c.id === classRoomId ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const deleteClassRoom = useCallback((classRoomId: string) => {
    setState(prev => ({
      ...prev,
      classRooms: prev.classRooms.filter(c => c.id !== classRoomId),
      pedagogicalUnits: prev.pedagogicalUnits.filter(u => u.classRoomId !== classRoomId),
      evaluations: prev.evaluations.filter(e => {
        const unit = prev.pedagogicalUnits.find(u => u.id === e.pedagogicalUnitId);
        return unit?.classRoomId !== classRoomId;
      }),
    }));
  }, []);

  const addStudentToClass = useCallback((classRoomId: string, student: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...normalizeStudent(student),
      id: generateId(),
    };
    setState(prev => ({
      ...prev,
      classRooms: prev.classRooms.map(c => {
        if (c.id !== classRoomId) return c;
        return { ...c, students: sortStudentsAZ([...c.students, newStudent]) };
      }),
    }));
  }, []);

  const updateStudentInClass = useCallback((classRoomId: string, studentId: string, updates: Partial<Student>) => {
    setState(prev => ({
      ...prev,
      classRooms: prev.classRooms.map(c => {
        if (c.id !== classRoomId) return c;

        const updated = c.students.map(s => {
          if (s.id !== studentId) return s;

          const next = { ...s, ...updates };
          return {
            ...next,
            lastName: updates.lastName !== undefined ? normalizeLastName(next.lastName) : next.lastName,
            firstName: updates.firstName !== undefined ? normalizeFirstName(next.firstName) : next.firstName,
          };
        });

        return { ...c, students: sortStudentsAZ(updated) };
      }),
    }));
  }, []);

  const deleteStudentFromClass = useCallback((classRoomId: string, studentId: string) => {
    setState(prev => ({
      ...prev,
      classRooms: prev.classRooms.map(c =>
        c.id === classRoomId
          ? { ...c, students: sortStudentsAZ(c.students.filter(s => s.id !== studentId)) }
          : c
      ),
      grades: prev.grades.filter(g => g.studentId !== studentId),
    }));
  }, []);

  const addPedagogicalUnit = useCallback((unit: Omit<PedagogicalUnit, 'id' | 'createdAt'>) => {
    const newUnit: PedagogicalUnit = {
      ...unit,
      id: generateId(),
      createdAt: new Date(),
    };
    setState(prev => ({
      ...prev,
      pedagogicalUnits: [...prev.pedagogicalUnits, newUnit],
    }));
  }, []);

  const updatePedagogicalUnit = useCallback((unitId: string, updates: Partial<PedagogicalUnit>) => {
    setState(prev => ({
      ...prev,
      pedagogicalUnits: prev.pedagogicalUnits.map(u =>
        u.id === unitId ? { ...u, ...updates } : u
      ),
    }));
  }, []);

  const deletePedagogicalUnit = useCallback((unitId: string) => {
    setState(prev => ({
      ...prev,
      pedagogicalUnits: prev.pedagogicalUnits.filter(u => u.id !== unitId),
      periods: prev.periods.filter(p => p.pedagogicalUnitId !== unitId),
      evaluations: prev.evaluations.filter(e => e.pedagogicalUnitId !== unitId),
      grades: prev.grades.filter(g => {
        const evaluation = prev.evaluations.find(e => e.id === g.evaluationId);
        return evaluation?.pedagogicalUnitId !== unitId;
      }),
    }));
  }, []);

  // Period management
  const addPeriod = useCallback((period: Omit<Period, 'id' | 'createdAt'>) => {
    const newPeriod: Period = {
      ...period,
      id: generateId(),
      createdAt: new Date(),
      status: period.status || 'locked',
      periodType: period.periodType || 'custom',
      expectedDevoirs: period.expectedDevoirs ?? 2,
      expectedInterros: period.expectedInterros ?? 3,
    };
    setState(prev => ({
      ...prev,
      periods: [...prev.periods, newPeriod],
    }));
  }, []);

  const activatePeriod = useCallback((periodId: string) => {
    setState(prev => {
      const targetPeriod = prev.periods.find(p => p.id === periodId);
      if (!targetPeriod) return prev;
      
      return {
        ...prev,
        periods: prev.periods.map(p => {
          if (p.pedagogicalUnitId === targetPeriod.pedagogicalUnitId) {
            if (p.id === periodId) return { ...p, status: 'active' };
            if (p.status === 'active') return { ...p, status: 'completed' };
          }
          return p;
        })
      };
    });
  }, []);

  const updatePeriod = useCallback((periodId: string, updates: Partial<Pick<Period, 'name' | 'order' | 'status'>>) => {
    setState(prev => ({
      ...prev,
      periods: prev.periods.map(p =>
        p.id === periodId ? { ...p, ...updates } : p
      ),
    }));
  }, []);

  const completePeriod = useCallback((periodId: string) => {
    setState(prev => {
      const currentPeriod = prev.periods.find(p => p.id === periodId);
      if (!currentPeriod) return prev;

      const unitPeriods = prev.periods
        .filter(p => p.pedagogicalUnitId === currentPeriod.pedagogicalUnitId)
        .sort((a, b) => a.order - b.order);
      
      const currentIndex = unitPeriods.findIndex(p => p.id === periodId);
      const nextPeriod = unitPeriods[currentIndex + 1];

      return {
        ...prev,
        periods: prev.periods.map(p => {
          if (p.id === periodId) {
            return { ...p, status: 'completed' };
          }
          if (nextPeriod && p.id === nextPeriod.id) {
            return { ...p, status: 'active' };
          }
          return p;
        }),
      };
    });
  }, []);

  const deletePeriod = useCallback((periodId: string) => {
    setState(prev => ({
      ...prev,
      periods: prev.periods.filter(p => p.id !== periodId),
      // Remove periodId from evaluations that used this period
      evaluations: prev.evaluations.map(e =>
        e.periodId === periodId ? { ...e, periodId: undefined } : e
      ),
    }));
  }, []);

  const getPeriodsByUnit = useCallback((unitId: string) => {
    return state.periods
      .filter(p => p.pedagogicalUnitId === unitId)
      .sort((a, b) => a.order - b.order);
  }, [state.periods]);

  const addEvaluation = useCallback((evaluation: Omit<Evaluation, 'id'>) => {
    const newEvaluation: Evaluation = {
      ...evaluation,
      id: generateId(),
    };
    setState(prev => ({
      ...prev,
      evaluations: [...prev.evaluations, newEvaluation],
    }));
  }, []);

  const addGrade = useCallback((grade: Omit<Grade, 'id' | 'createdAt' | 'history' | 'isLocked'>) => {
    const newGrade: Grade = {
      ...grade,
      id: generateId(),
      createdAt: new Date(),
      history: [],
      isLocked: false,
    };
    setState(prev => ({
      ...prev,
      grades: [...prev.grades, newGrade],
    }));
  }, []);

  const updateGradeValue = useCallback((gradeId: string, newValue: number) => {
    setState(prev => ({
      ...prev,
      grades: prev.grades.map(g =>
        g.id === gradeId && !g.isLocked
          ? { ...g, value: newValue }
          : g
      ),
    }));
  }, []);

  const saveGrades = useCallback((unitId: string) => {
    setState(prev => {
      const unitEvaluations = prev.evaluations.filter(e => e.pedagogicalUnitId === unitId);
      const evaluationIds = unitEvaluations.map(e => e.id);
      
      return {
        ...prev,
        grades: prev.grades.map(g =>
          evaluationIds.includes(g.evaluationId)
            ? { ...g, isLocked: true }
            : g
        ),
      };
    });
    
    setSavedUnits(prev => new Set([...prev, unitId]));
  }, []);

  const updateGrade = useCallback((gradeId: string, newValue: number, reason: string) => {
    setState(prev => ({
      ...prev,
      grades: prev.grades.map(g => {
        if (g.id === gradeId && g.isLocked) {
          if (g.history.length > 0) {
            return g;
          }
          const historyEntry = {
            value: g.value,
            modifiedAt: new Date(),
            reason,
          };
          return {
            ...g,
            value: newValue,
            history: [...g.history, historyEntry],
            modifiedAt: new Date(),
          };
        }
        return g;
      }),
    }));
  }, []);

  const setActiveYear = useCallback((yearId: string | null) => {
    setState(prev => ({ ...prev, activeYearId: yearId }));
  }, []);

  const getClassesByYear = useCallback((yearId: string) => {
    return state.classRooms.filter(c => c.schoolYearId === yearId);
  }, [state.classRooms]);

  const getUnitsByClass = useCallback((classId: string) => {
    return state.pedagogicalUnits.filter(u => u.classRoomId === classId);
  }, [state.pedagogicalUnits]);

  const getStudentsByClass = useCallback((classId: string) => {
    const classRoom = state.classRooms.find(c => c.id === classId);
    return classRoom?.students || [];
  }, [state.classRooms]);

  const getEvaluationsByUnit = useCallback((unitId: string) => {
    return state.evaluations.filter(e => e.pedagogicalUnitId === unitId);
  }, [state.evaluations]);

  const getEvaluationsByPeriod = useCallback((periodId: string) => {
    return state.evaluations.filter(e => e.periodId === periodId);
  }, [state.evaluations]);

  const calculateAverage = useCallback((studentId: string, unitId: string): number | null => {
    const evaluations = state.evaluations.filter(e => e.pedagogicalUnitId === unitId);
    const studentGrades = state.grades.filter(
      g => g.studentId === studentId && 
      evaluations.some(e => e.id === g.evaluationId)
    );

    if (studentGrades.length === 0) return null;

    let totalWeighted = 0;
    let totalCoefficients = 0;

    studentGrades.forEach(grade => {
      const evaluation = evaluations.find(e => e.id === grade.evaluationId);
      if (evaluation) {
        totalWeighted += (grade.value / evaluation.maxScore) * 20 * evaluation.coefficient;
        totalCoefficients += evaluation.coefficient;
      }
    });

    return totalCoefficients > 0 ? Math.round((totalWeighted / totalCoefficients) * 100) / 100 : null;
  }, [state.evaluations, state.grades]);

  const isUnitSaved = useCallback((unitId: string) => savedUnits.has(unitId), [savedUnits]);

  const addCustomEvent = useCallback((event: Omit<CustomCalendarEvent, 'id' | 'createdAt'>) => {
    const newEvent: CustomCalendarEvent = {
      ...event,
      id: generateId(),
      createdAt: new Date(),
    };
    setState(prev => ({
      ...prev,
      customEvents: [...prev.customEvents, newEvent],
    }));
  }, []);

  const deleteCustomEvent = useCallback((eventId: string) => {
    setState(prev => ({
      ...prev,
      customEvents: prev.customEvents.filter(e => e.id !== eventId),
    }));
  }, []);

  const exportData = useCallback((): string => {
    const data: TeacherData = {
      schoolYears: state.schoolYears,
      classRooms: state.classRooms,
      pedagogicalUnits: state.pedagogicalUnits,
      periods: state.periods,
      evaluations: state.evaluations,
      grades: state.grades,
      customEvents: state.customEvents,
      activeYearId: state.activeYearId,
      savedUnits: Array.from(savedUnits),
    };
    return JSON.stringify(data, null, 2);
  }, [state, savedUnits]);

  const importData = useCallback((jsonData: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonData);
      
      // Validate structure
      if (!parsed.schoolYears || !parsed.classRooms || !parsed.pedagogicalUnits || 
          !parsed.evaluations || !parsed.grades) {
        return { success: false, error: 'Structure de données invalide' };
      }

      // Parse dates
      const data: TeacherData = {
        schoolYears: parsed.schoolYears.map((y: SchoolYear) => ({
          ...y,
          createdAt: new Date(y.createdAt),
        })),
        classRooms: parsed.classRooms.map((c: ClassRoom) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        })),
        pedagogicalUnits: parsed.pedagogicalUnits.map((u: PedagogicalUnit) => ({
          ...u,
          createdAt: new Date(u.createdAt),
          periodSystem: u.periodSystem || 'semester',
        })),
        periods: (parsed.periods || []).map((p: Period) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          startDate: p.startDate ? new Date(p.startDate) : undefined,
          endDate: p.endDate ? new Date(p.endDate) : undefined,
          periodType: p.periodType || 'custom',
          expectedDevoirs: p.expectedDevoirs ?? 2,
          expectedInterros: p.expectedInterros ?? 3,
        })),
        evaluations: parsed.evaluations.map((e: Evaluation) => ({
          ...e,
          date: new Date(e.date),
        })),
        grades: parsed.grades.map((g: Grade) => ({
          ...g,
          createdAt: new Date(g.createdAt),
          modifiedAt: g.modifiedAt ? new Date(g.modifiedAt) : undefined,
          history: g.history.map((h) => ({
            ...h,
            modifiedAt: new Date(h.modifiedAt),
          })),
        })),
        customEvents: (parsed.customEvents || []).map((e: CustomCalendarEvent) => ({
          ...e,
          date: new Date(e.date),
          endDate: e.endDate ? new Date(e.endDate) : undefined,
          createdAt: new Date(e.createdAt),
        })),
        activeYearId: parsed.activeYearId,
        savedUnits: parsed.savedUnits || [],
      };

      setState({
        schoolYears: data.schoolYears,
        classRooms: data.classRooms,
        pedagogicalUnits: data.pedagogicalUnits,
        periods: data.periods,
        evaluations: data.evaluations,
        grades: data.grades,
        customEvents: data.customEvents || [],
        activeYearId: data.activeYearId,
      });
      setSavedUnits(new Set(data.savedUnits));

      return { success: true };
    } catch (e) {
      return { success: false, error: 'Fichier JSON invalide' };
    }
  }, []);

  // Don't render children until auth check is complete
  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
        ...state,
        syncStatus,
        addSchoolYear,
        addClassRoom,
        updateClassRoom,
        deleteClassRoom,
        addStudentToClass,
        updateStudentInClass,
        deleteStudentFromClass,
        addPedagogicalUnit,
        updatePedagogicalUnit,
        deletePedagogicalUnit,
        addPeriod,
        updatePeriod,
        deletePeriod,
        completePeriod,
        activatePeriod,
        getPeriodsByUnit,
        addEvaluation,
        addGrade,
        updateGrade,
        updateGradeValue,
        saveGrades,
        setActiveYear,
        getClassesByYear,
        getUnitsByClass,
        getStudentsByClass,
        getEvaluationsByUnit,
        getEvaluationsByPeriod,
        calculateAverage,
        isUnitSaved,
        exportData,
        importData,
        addCustomEvent,
        deleteCustomEvent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
