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
  addStudentToClass: (classRoomId: string, student: Omit<Student, 'id'>) => void;
  addPedagogicalUnit: (unit: Omit<PedagogicalUnit, 'id' | 'createdAt'>) => void;
  addEvaluation: (evaluation: Omit<Evaluation, 'id'>) => void;
  addGrade: (grade: Omit<Grade, 'id' | 'createdAt' | 'history' | 'isLocked'>) => void;
  updateGrade: (gradeId: string, newValue: number, reason: string) => void;
  setActiveYear: (yearId: string | null) => void;
  getClassesByYear: (yearId: string) => ClassRoom[];
  getUnitsByClass: (classId: string) => PedagogicalUnit[];
  getStudentsByClass: (classId: string) => Student[];
  getEvaluationsByUnit: (unitId: string) => Evaluation[];
  calculateAverage: (studentId: string, unitId: string) => number | null;
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

  const addStudentToClass = (classRoomId: string, student: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...student,
      id: generateId(),
    };
    setState(prev => ({
      ...prev,
      classRooms: prev.classRooms.map(c =>
        c.id === classRoomId
          ? { ...c, students: [...c.students, newStudent] }
          : c
      ),
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

  const updateGrade = (gradeId: string, newValue: number, reason: string) => {
    setState(prev => ({
      ...prev,
      grades: prev.grades.map(g => {
        if (g.id === gradeId && !g.isLocked) {
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
            isLocked: true, // Lock after first modification
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

  return (
    <AppContext.Provider
      value={{
        ...state,
        addSchoolYear,
        addClassRoom,
        addStudentToClass,
        addPedagogicalUnit,
        addEvaluation,
        addGrade,
        updateGrade,
        setActiveYear,
        getClassesByYear,
        getUnitsByClass,
        getStudentsByClass,
        getEvaluationsByUnit,
        calculateAverage,
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
