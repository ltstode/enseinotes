import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SchoolYear, ClassRoom, PedagogicalUnit, Evaluation, Grade, Student } from '@/types/enseinotes';

interface AppState {
  schoolYears: SchoolYear[];
  classRooms: ClassRoom[];
  pedagogicalUnits: PedagogicalUnit[];
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
  calculateAverage: (studentId: string, unitId: string) => number | null;
  isUnitSaved: (unitId: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substring(2, 15);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    schoolYears: [],
    classRooms: [],
    pedagogicalUnits: [],
    evaluations: [],
    grades: [],
    activeYearId: null,
  });

  // Track which units have been saved
  const [savedUnits, setSavedUnits] = useState<Set<string>>(new Set());

  const addSchoolYear = (year: Omit<SchoolYear, 'id' | 'createdAt'>) => {
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
  };

  const addClassRoom = (classRoom: Omit<ClassRoom, 'id' | 'createdAt'>) => {
    const newClass: ClassRoom = {
      ...classRoom,
      id: generateId(),
      createdAt: new Date(),
    };
    setState(prev => ({
      ...prev,
      classRooms: [...prev.classRooms, newClass],
    }));
  };

  const updateClassRoom = (classRoomId: string, updates: Partial<Pick<ClassRoom, 'name'>>) => {
    setState(prev => ({
      ...prev,
      classRooms: prev.classRooms.map(c =>
        c.id === classRoomId ? { ...c, ...updates } : c
      ),
    }));
  };

  const deleteClassRoom = (classRoomId: string) => {
    setState(prev => ({
      ...prev,
      classRooms: prev.classRooms.filter(c => c.id !== classRoomId),
      // Also delete associated units, evaluations, and grades
      pedagogicalUnits: prev.pedagogicalUnits.filter(u => u.classRoomId !== classRoomId),
      evaluations: prev.evaluations.filter(e => {
        const unit = prev.pedagogicalUnits.find(u => u.id === e.pedagogicalUnitId);
        return unit?.classRoomId !== classRoomId;
      }),
    }));
  };

  const addStudentToClass = (classRoomId: string, student: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...student,
      id: generateId(),
    };
    setState(prev => ({
      ...prev,
      classRooms: prev.classRooms.map(c => {
        if (c.id !== classRoomId) return c;
        const updatedStudents = [...c.students, newStudent].sort((a, b) => {
          const lastNameCompare = a.lastName.localeCompare(b.lastName, 'fr');
          if (lastNameCompare !== 0) return lastNameCompare;
          return a.firstName.localeCompare(b.firstName, 'fr');
        });
        return { ...c, students: updatedStudents };
      }),
    }));
  };

  const updateStudentInClass = (classRoomId: string, studentId: string, updates: Partial<Student>) => {
    setState(prev => ({
      ...prev,
      classRooms: prev.classRooms.map(c =>
        c.id === classRoomId
          ? {
              ...c,
              students: c.students.map(s =>
                s.id === studentId ? { ...s, ...updates } : s
              ),
            }
          : c
      ),
    }));
  };

  const deleteStudentFromClass = (classRoomId: string, studentId: string) => {
    setState(prev => ({
      ...prev,
      classRooms: prev.classRooms.map(c =>
        c.id === classRoomId
          ? { ...c, students: c.students.filter(s => s.id !== studentId) }
          : c
      ),
      // Also delete associated grades
      grades: prev.grades.filter(g => g.studentId !== studentId),
    }));
  };

  const addPedagogicalUnit = (unit: Omit<PedagogicalUnit, 'id' | 'createdAt'>) => {
    const newUnit: PedagogicalUnit = {
      ...unit,
      id: generateId(),
      createdAt: new Date(),
    };
    setState(prev => ({
      ...prev,
      pedagogicalUnits: [...prev.pedagogicalUnits, newUnit],
    }));
  };

  const addEvaluation = (evaluation: Omit<Evaluation, 'id'>) => {
    const newEvaluation: Evaluation = {
      ...evaluation,
      id: generateId(),
    };
    setState(prev => ({
      ...prev,
      evaluations: [...prev.evaluations, newEvaluation],
    }));
  };

  const addGrade = (grade: Omit<Grade, 'id' | 'createdAt' | 'history' | 'isLocked'>) => {
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
  };

  // Update grade value without locking (for free editing before save)
  const updateGradeValue = (gradeId: string, newValue: number) => {
    setState(prev => ({
      ...prev,
      grades: prev.grades.map(g =>
        g.id === gradeId && !g.isLocked
          ? { ...g, value: newValue }
          : g
      ),
    }));
  };

  // Lock and save grades for a unit
  const saveGrades = (unitId: string) => {
    const unitEvaluations = state.evaluations.filter(e => e.pedagogicalUnitId === unitId);
    const evaluationIds = unitEvaluations.map(e => e.id);
    
    setState(prev => ({
      ...prev,
      grades: prev.grades.map(g =>
        evaluationIds.includes(g.evaluationId)
          ? { ...g, isLocked: true }
          : g
      ),
    }));
    
    setSavedUnits(prev => new Set([...prev, unitId]));
  };

  const updateGrade = (gradeId: string, newValue: number, reason: string) => {
    setState(prev => ({
      ...prev,
      grades: prev.grades.map(g => {
        if (g.id === gradeId && g.isLocked) {
          // Only allow one modification after lock
          if (g.history.length > 0) {
            return g; // Already modified once, cannot modify again
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
  };

  const setActiveYear = (yearId: string | null) => {
    setState(prev => ({ ...prev, activeYearId: yearId }));
  };

  const getClassesByYear = (yearId: string) => {
    return state.classRooms.filter(c => c.schoolYearId === yearId);
  };

  const getUnitsByClass = (classId: string) => {
    return state.pedagogicalUnits.filter(u => u.classRoomId === classId);
  };

  const getStudentsByClass = (classId: string) => {
    const classRoom = state.classRooms.find(c => c.id === classId);
    return classRoom?.students || [];
  };

  const getEvaluationsByUnit = (unitId: string) => {
    return state.evaluations.filter(e => e.pedagogicalUnitId === unitId);
  };

  const calculateAverage = (studentId: string, unitId: string): number | null => {
    const evaluations = getEvaluationsByUnit(unitId);
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
  };

  const isUnitSaved = (unitId: string) => savedUnits.has(unitId);

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
        calculateAverage,
        isUnitSaved,
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
