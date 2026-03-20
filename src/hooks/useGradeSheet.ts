import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PedagogicalUnit, Evaluation } from '@/types/enseinotes';

interface LocalGradeState {
  [key: string]: string;
}

export const useGradeSheet = (unit: PedagogicalUnit) => {
  const { 
    getStudentsByClass, 
    getEvaluationsByUnit, 
    getPeriodsByUnit,
    deletePeriod,
    deleteEvaluation,
    completePeriod,
    activatePeriod,
    grades, 
    addGrade,
    updateGrade,
    updateGradeValue,
    saveGrades,
    isUnitSaved,
    classRooms,
    schoolYears,
    getUnitsByClass,
    periods: allPeriods,
    calculateAverage,
  } = useApp();
  
  const { teacher } = useAuth();
  const { toast } = useToast();

  const classUnits = useMemo(
    () => getUnitsByClass(unit.classRoomId),
    [getUnitsByClass, unit.classRoomId]
  );
  
  const students = useMemo(() => {
    return getStudentsByClass(unit.classRoomId)
      .filter(s => s.status === 'active')
      .sort((a, b) => {
        const lastNameCompare = a.lastName.localeCompare(b.lastName, 'fr');
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName, 'fr');
      });
  }, [getStudentsByClass, unit.classRoomId]);
  
  const evaluations = useMemo(
    () => getEvaluationsByUnit(unit.id),
    [getEvaluationsByUnit, unit.id, grades]
  );

  const periods = useMemo(
    () => getPeriodsByUnit(unit.id),
    [getPeriodsByUnit, unit.id]
  );

  const isSaved = useMemo(
    () => isUnitSaved(unit.id),
    [isUnitSaved, unit.id]
  );
  
  const [activePeriod, setActivePeriod] = useState<string>('');
  
  useEffect(() => {
    if (!activePeriod && periods.length > 0) {
      const active = periods.find(p => p.status === 'active')?.id;
      setActivePeriod(active || periods[0].id);
    }
  }, [periods, activePeriod]);

  const filteredEvaluations = useMemo(() => {
    if (!activePeriod) return [];
    return evaluations.filter(e => e.periodId === activePeriod);
  }, [evaluations, activePeriod]);
  
  const interros = useMemo(
    () => filteredEvaluations.filter(e => e.type === 'interro').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [filteredEvaluations]
  );

  const devoirs = useMemo(
    () => filteredEvaluations.filter(e => e.type === 'devoir').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [filteredEvaluations]
  );

  const [localGrades, setLocalGrades] = useState<LocalGradeState>({});
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const allTableEvals = useMemo(() => [...interros, ...devoirs], [interros, devoirs]);

  const hasGradesToSave = useMemo(
    () => Object.values(localGrades).some(v => v !== ''),
    [localGrades]
  );

  const getGrade = useCallback((studentId: string, evaluationId: string) => {
    return grades.find(g => g.studentId === studentId && g.evaluationId === evaluationId);
  }, [grades]);

  const calculateTypeAverage = useCallback((studentId: string, evals: Evaluation[]): number | null => {
    const studentGrades = evals
      .map(e => {
        const key = `${studentId}::${e.id}`;
        const localValue = localGrades[key];
        const grade = getGrade(studentId, e.id);
        let value: number | undefined;
        if (localValue !== undefined && localValue !== '') value = parseFloat(localValue);
        else if (grade?.value !== undefined) value = grade.value;
        return value !== undefined && !isNaN(value) ? { value, evaluation: e } : null;
      })
      .filter(Boolean) as { value: number; evaluation: Evaluation }[];

    if (studentGrades.length === 0) return null;

    let totalWeighted = 0;
    let totalCoefficients = 0;
    studentGrades.forEach(({ value, evaluation }) => {
      const normalized = (value / evaluation.maxScore) * 20;
      totalWeighted += normalized * evaluation.coefficient;
      totalCoefficients += evaluation.coefficient;
    });
    return totalCoefficients > 0 ? Math.round((totalWeighted / totalCoefficients) * 100) / 100 : null;
  }, [localGrades, getGrade]);

  const calculateFinalAverage = useCallback((studentId: string): number | null => {
    const moyInterros = calculateTypeAverage(studentId, interros);
    const moyDevoirs = calculateTypeAverage(studentId, devoirs);
    if (moyInterros === null && moyDevoirs === null) return null;
    const { interroWeight, devoirWeight } = unit.rules;
    if (moyInterros !== null && moyDevoirs === null) return moyInterros;
    if (moyDevoirs !== null && moyInterros === null) return moyDevoirs;
    const totalWeight = interroWeight + devoirWeight;
    const weighted = (moyInterros! * interroWeight + moyDevoirs! * devoirWeight) / totalWeight;
    return Math.round(weighted * 100) / 100;
  }, [calculateTypeAverage, interros, devoirs, unit.rules]);

  const studentRankings = useMemo(() => {
    const studentsWithAverages = students
      .map(student => ({
        studentId: student.id,
        lastName: student.lastName,
        firstName: student.firstName,
        average: calculateFinalAverage(student.id)
      }))
      .filter((s): s is typeof s & { average: number } => s.average !== null);

    const sorted = [...studentsWithAverages].sort((a, b) => {
      if (b.average !== a.average) return b.average - a.average;
      const lastCmp = a.lastName.localeCompare(b.lastName, 'fr');
      if (lastCmp !== 0) return lastCmp;
      return a.firstName.localeCompare(b.firstName, 'fr');
    });

    const rankings: Record<string, { rank: number; isExAequo: boolean } | null> = {};
    sorted.forEach((student, index) => {
      if (index > 0 && student.average === sorted[index - 1].average) {
        const prevRank = rankings[sorted[index - 1].studentId]!;
        prevRank.isExAequo = true;
        rankings[student.studentId] = { rank: prevRank.rank, isExAequo: true };
      } else {
        rankings[student.studentId] = { rank: index + 1, isExAequo: false };
      }
    });

    students.forEach(student => {
      if (!(student.id in rankings)) rankings[student.id] = null;
    });
    return rankings;
  }, [students, calculateFinalAverage]);

  const studentAverages = useMemo(() => {
    const map = new Map<string, { mi: number | null; ms: number | null; mc: number | null }>();
    students.forEach(s => {
      map.set(s.id, {
        mi: calculateTypeAverage(s.id, interros),
        ms: calculateTypeAverage(s.id, devoirs),
        mc: calculateFinalAverage(s.id),
      });
    });
    return map;
  }, [students, interros, devoirs, calculateTypeAverage, calculateFinalAverage]);

  const handleLocalGradeInput = useCallback((studentId: string, evaluationId: string, value: string) => {
    const key = `${studentId}::${evaluationId}`;
    setLocalGrades(prev => ({ ...prev, [key]: value.replace(',', '.') }));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, studentId: string, evalId: string) => {
    const studentIdx = students.findIndex(s => s.id === studentId);
    const evalIdx = allTableEvals.findIndex(ev => ev.id === evalId);

    if (studentIdx === -1 || evalIdx === -1) return;

    let targetStudentId = '';
    let targetEvalId = '';

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      if (studentIdx < students.length - 1) {
        targetStudentId = students[studentIdx + 1].id;
        targetEvalId = evalId;
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (studentIdx > 0) {
        targetStudentId = students[studentIdx - 1].id;
        targetEvalId = evalId;
      }
    } else if (e.key === 'ArrowRight') {
      if (evalIdx < allTableEvals.length - 1) {
        e.preventDefault();
        targetStudentId = studentId;
        targetEvalId = allTableEvals[evalIdx + 1].id;
      }
    } else if (e.key === 'ArrowLeft') {
      if (evalIdx > 0) {
        e.preventDefault();
        targetStudentId = studentId;
        targetEvalId = allTableEvals[evalIdx - 1].id;
      }
    }

    if (targetStudentId && targetEvalId) {
      const nextKey = `${targetStudentId}::${targetEvalId}`;
      const nextInput = inputRefs.current.get(nextKey);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  }, [students, allTableEvals]);

  const handleSaveGrades = useCallback(() => {
    let hasError = false;
    Object.entries(localGrades).forEach(([key, value]) => {
      if (value === '') return;
      const [studentId, evaluationId] = key.split('::');
      const evaluation = evaluations.find(e => e.id === evaluationId);
      const numValue = parseFloat(value);
      
      if (isNaN(numValue) || numValue < 0 || (evaluation && numValue > evaluation.maxScore)) {
        hasError = true;
        return;
      }

      const existingGrade = getGrade(studentId, evaluationId);
      if (existingGrade) updateGradeValue(existingGrade.id, numValue);
      else addGrade({ studentId, evaluationId, value: numValue });
    });

    if (hasError) {
      toast({ 
        title: 'Erreur de saisie', 
        description: 'Certaines notes sont invalides (ex: supérieures au maximum).', 
        variant: 'destructive' 
      });
      return;
    }

    saveGrades(unit.id);
    setLocalGrades({});
    toast({ title: 'Succès ✨', description: 'Notes enregistrées et synchronisées.' });
  }, [localGrades, getGrade, updateGradeValue, addGrade, saveGrades, unit.id, toast, evaluations]);

  const registerRef = useCallback((studentId: string, evalId: string, ref: HTMLInputElement | null) => {
    const key = `${studentId}::${evalId}`;
    if (ref) inputRefs.current.set(key, ref);
    else inputRefs.current.delete(key);
  }, []);

  const isNewEvaluation = useCallback((evaluationId: string): boolean => {
    if (!isSaved) return false;
    const gradesForEval = grades.filter(g => g.evaluationId === evaluationId);
    return gradesForEval.length === 0 || gradesForEval.every(g => !g.isLocked);
  }, [isSaved, grades]);

  return {
    // Data
    teacher,
    students,
    evaluations,
    filteredEvaluations,
    interros,
    devoirs,
    periods,
    activePeriod,
    classUnits,
    allPeriods,
    classRooms,
    schoolYears,
    grades,
    isSaved,
    localGrades,
    hasGradesToSave,
    
    // Computed Averages & Rankings
    studentAverages,
    studentRankings,
    
    // App Actions
    setActivePeriod,
    deletePeriod,
    deleteEvaluation,
    completePeriod,
    activatePeriod,
    updateGrade,
    calculateAverage,
    
    // Internal Actions
    getGrade,
    calculateTypeAverage,
    calculateFinalAverage,
    handleLocalGradeInput,
    handleKeyDown,
    handleSaveGrades,
    registerRef,
    isNewEvaluation,
  };
};
