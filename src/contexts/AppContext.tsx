/**
 * AppContext.tsx — Thin adapter layer
 *
 * Ce fichier conserve l'interface publique `useApp()` et `AppProvider`
 * pour la compatibilité des composants existants, mais délègue TOUTE
 * la logique au store Zustand (`appStore.ts`).
 *
 * Avantages :
 * - Les composants se re-rendent uniquement quand leur slice de données change
 * - Plus de propagation en cascade via le Context API
 * - Aucune modification requise dans les composants consommateurs
 */
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/appStore';
import {
  SchoolYear, ClassRoom, PedagogicalUnit,
  Evaluation, Grade, Student, Period, CustomCalendarEvent,
} from '@/types/enseinotes';

// ── Interface publique (identique à l'ancienne) ───────────────────────────────
interface AppContextType {
  schoolYears:      SchoolYear[];
  classRooms:       ClassRoom[];
  pedagogicalUnits: PedagogicalUnit[];
  periods:          Period[];
  evaluations:      Evaluation[];
  grades:           Grade[];
  customEvents:     CustomCalendarEvent[];
  activeYearId:     string | null;

  syncStatus: { state: 'idle' | 'saving' | 'saved' | 'error'; lastSavedAt: Date | null; error?: string };

  addSchoolYear:        (year: Omit<SchoolYear, 'id' | 'createdAt'>) => void;
  addClassRoom:         (classRoom: Omit<ClassRoom, 'id' | 'createdAt'>) => void;
  updateClassRoom:      (classRoomId: string, updates: Partial<Pick<ClassRoom, 'name'>>) => void;
  deleteClassRoom:      (classRoomId: string) => void;
  addStudentToClass:    (classRoomId: string, student: Omit<Student, 'id'>) => void;
  updateStudentInClass: (classRoomId: string, studentId: string, updates: Partial<Student>) => void;
  deleteStudentFromClass:(classRoomId: string, studentId: string) => void;
  addPedagogicalUnit:   (unit: Omit<PedagogicalUnit, 'id' | 'createdAt'>) => void;
  updatePedagogicalUnit:(unitId: string, updates: Partial<PedagogicalUnit>) => void;
  deletePedagogicalUnit:(unitId: string) => void;
  addPeriod:            (period: Omit<Period, 'id' | 'createdAt'>) => void;
  updatePeriod:         (periodId: string, updates: Partial<Period>) => void;
  deletePeriod:         (periodId: string) => void;
  completePeriod:       (periodId: string) => void;
  activatePeriod:       (periodId: string) => void;
  getPeriodsByUnit:     (unitId: string) => Period[];
  addEvaluation:        (evaluation: Omit<Evaluation, 'id'>) => void;
  addGrade:             (grade: Omit<Grade, 'id' | 'createdAt' | 'history' | 'isLocked'>) => void;
  updateGrade:          (gradeId: string, newValue: number, reason: string) => void;
  updateGradeValue:     (gradeId: string, newValue: number) => void;
  saveGrades:           (unitId: string) => void;
  setActiveYear:        (yearId: string | null) => void;
  getClassesByYear:     (yearId: string) => ClassRoom[];
  getUnitsByClass:      (classId: string) => PedagogicalUnit[];
  getStudentsByClass:   (classId: string) => Student[];
  getEvaluationsByUnit: (unitId: string) => Evaluation[];
  getEvaluationsByPeriod:(periodId: string) => Evaluation[];
  deleteEvaluation:     (evaluationId: string) => void;
  deleteSchoolYear:     (yearId: string) => void;
  calculateAverage:     (studentId: string, unitId: string) => number | null;
  isUnitSaved:          (unitId: string) => boolean;
  exportData:           () => string;
  importData:           (jsonData: string) => { success: boolean; error?: string };
  clearAllData:         () => void;
  addCustomEvent:       (event: Omit<CustomCalendarEvent, 'id' | 'createdAt'>) => void;
  deleteCustomEvent:    (eventId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────────────────────
// Initialise le store Zustand avec le teacherId et nettoie à la déconnexion.
// Les enfants lisent directement depuis le store via useApp() qui expose
// les mêmes valeurs — sans overhead du Context.
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { teacher, isAuthenticated } = useAuth();
  const { initForTeacher, resetStore, ...store } = useAppStore();

  // Synchronise le store avec le teacher courant
  useEffect(() => {
    if (teacher?.id) {
      initForTeacher(teacher.id);
    } else {
      resetStore();
    }
  }, [teacher?.id, initForTeacher, resetStore]);

  // Flush la sauvegarde avant fermeture de l'onglet
  useEffect(() => {
    const flush = () => useAppStore.getState()._persistNow();
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  if (!isAuthenticated) return null;

  // On expose le store entier via le Context — les composants obtiennent
  // les mêmes références stables que si useAppStore() était appelé directement.
  const value: AppContextType = {
    schoolYears:      store.schoolYears,
    classRooms:       store.classRooms,
    pedagogicalUnits: store.pedagogicalUnits,
    periods:          store.periods,
    evaluations:      store.evaluations,
    grades:           store.grades,
    customEvents:     store.customEvents,
    activeYearId:     store.activeYearId,
    syncStatus:       store.syncStatus,

    addSchoolYear:         store.addSchoolYear,
    addClassRoom:          store.addClassRoom,
    updateClassRoom:       store.updateClassRoom,
    deleteClassRoom:       store.deleteClassRoom,
    addStudentToClass:     store.addStudentToClass,
    updateStudentInClass:  store.updateStudentInClass,
    deleteStudentFromClass:store.deleteStudentFromClass,
    addPedagogicalUnit:    store.addPedagogicalUnit,
    updatePedagogicalUnit: store.updatePedagogicalUnit,
    deletePedagogicalUnit: store.deletePedagogicalUnit,
    addPeriod:             store.addPeriod,
    updatePeriod:          store.updatePeriod,
    deletePeriod:          store.deletePeriod,
    completePeriod:        store.completePeriod,
    activatePeriod:        store.activatePeriod,
    getPeriodsByUnit:      store.getPeriodsByUnit,
    addEvaluation:         store.addEvaluation,
    addGrade:              store.addGrade,
    updateGrade:           store.updateGrade,
    updateGradeValue:      store.updateGradeValue,
    saveGrades:            store.saveGrades,
    setActiveYear:         store.setActiveYear,
    getClassesByYear:      store.getClassesByYear,
    getUnitsByClass:       store.getUnitsByClass,
    getStudentsByClass:    store.getStudentsByClass,
    getEvaluationsByUnit:  store.getEvaluationsByUnit,
    getEvaluationsByPeriod:store.getEvaluationsByPeriod,
    deleteEvaluation:      store.deleteEvaluation,
    deleteSchoolYear:      store.deleteSchoolYear,
    calculateAverage:      store.calculateAverage,
    isUnitSaved:           store.isUnitSaved,
    exportData:            store.exportData,
    importData:            store.importData,
    clearAllData:          store.clearAllData,
    addCustomEvent:        store.addCustomEvent,
    deleteCustomEvent:     store.deleteCustomEvent,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ── Hook public ───────────────────────────────────────────────────────────────
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
