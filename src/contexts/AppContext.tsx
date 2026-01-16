import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { SchoolYear, ClassRoom, PedagogicalUnit, Evaluation, Grade, Student, TeacherData, Period } from '@/types/enseinotes';
import { useAuth } from '@/contexts/AuthContext';

interface AppState {
  schoolYears: SchoolYear[];
  classRooms: ClassRoom[];
  pedagogicalUnits: PedagogicalUnit[];
  periods: Period[];
  evaluations: Evaluation[];
  grades: Grade[];
  activeYearId: string | null;
}

interface AppContextType extends AppState {
  addSchoolYear: (year: Omit<SchoolYear, 'id' | 'createdAt'>) => void;
  addClassRoom: (classRoom: Omit<ClassRoom, 'id' | 'createdAt'>) => void;
  updateClassRoom: (classRoomId: string, updates: Partial<Pick<ClassRoom, 'name'>>) => void;
  deleteClassRoom: (classRoomId: string) => void;
  addStudentToClass: (classRoomId: string, student: Omit<Student, 'id'>) => void;
  updateStudentInClass: (classRoomId: string, studentId: string, updates: Partial<Student>) => void;
  deleteStudentFromClass: (classRoomId: string, studentId: string) => void;
  addPedagogicalUnit: (unit: Omit<PedagogicalUnit, 'id' | 'createdAt'>) => void;
  addPeriod: (period: Omit<Period, 'id' | 'createdAt'>) => void;
  updatePeriod: (periodId: string, updates: Partial<Pick<Period, 'name' | 'order'>>) => void;
  deletePeriod: (periodId: string) => void;
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
  activeYearId: null,
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { teacher, isAuthenticated } = useAuth();
  const [state, setState] = useState<AppState>(emptyState);
  const [savedUnits, setSavedUnits] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

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
          activeYearId: data.activeYearId,
        });
        setSavedUnits(new Set(data.savedUnits || []));
      } else {
        setState(emptyState);
        setSavedUnits(new Set());
      }
      setIsInitialized(true);
    } else {
      setState(emptyState);
      setSavedUnits(new Set());
      setIsInitialized(false);
    }
  }, [teacher?.id]);

  // Save data whenever state changes (debounced)
  useEffect(() => {
    if (!teacher?.id || !isInitialized) return;

    const data: TeacherData = {
      schoolYears: state.schoolYears,
      classRooms: state.classRooms,
      pedagogicalUnits: state.pedagogicalUnits,
      periods: state.periods,
      evaluations: state.evaluations,
      grades: state.grades,
      activeYearId: state.activeYearId,
      savedUnits: Array.from(savedUnits),
    };
    saveTeacherData(teacher.id, data);
  }, [teacher?.id, state, savedUnits, isInitialized]);

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

  // Period management
  const addPeriod = useCallback((period: Omit<Period, 'id' | 'createdAt'>) => {
    const newPeriod: Period = {
      ...period,
      id: generateId(),
      createdAt: new Date(),
      // Ensure defaults
      periodType: period.periodType || 'custom',
      expectedDevoirs: period.expectedDevoirs ?? 2,
      expectedInterros: period.expectedInterros ?? 3,
    };
    setState(prev => ({
      ...prev,
      periods: [...prev.periods, newPeriod],
    }));
  }, []);

  const updatePeriod = useCallback((periodId: string, updates: Partial<Pick<Period, 'name' | 'order'>>) => {
    setState(prev => ({
      ...prev,
      periods: prev.periods.map(p =>
        p.id === periodId ? { ...p, ...updates } : p
      ),
    }));
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

  const exportData = useCallback((): string => {
    const data: TeacherData = {
      schoolYears: state.schoolYears,
      classRooms: state.classRooms,
      pedagogicalUnits: state.pedagogicalUnits,
      periods: state.periods,
      evaluations: state.evaluations,
      grades: state.grades,
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
        addSchoolYear,
        addClassRoom,
        updateClassRoom,
        deleteClassRoom,
        addStudentToClass,
        updateStudentInClass,
        deleteStudentFromClass,
        addPedagogicalUnit,
        addPeriod,
        updatePeriod,
        deletePeriod,
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
