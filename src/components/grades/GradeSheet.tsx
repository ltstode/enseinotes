import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  History, 
  Lock, 
  AlertCircle, 
  HelpCircle, 
  FileText, 
  Save, 
  Pencil, 
  Check, 
  X, 
  Calendar, 
  Trash2,
  Trophy,
  ChevronRight,
  LayoutDashboard,
  Timer,
  Settings,
  Keyboard,
  Download,
  BarChart3
} from 'lucide-react';
import { PedagogicalUnit, Student, Evaluation, Period } from '@/types/enseinotes';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CreateEvaluationDialog from './CreateEvaluationDialog';
import CreatePeriodDialog from './CreatePeriodDialog';
import EditUnitDialog from '../units/EditUnitDialog';
import PeriodProgressBar from './PeriodProgressBar';
import ClassStatistics from './ClassStatistics';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { generateClassBulletins } from '@/services/pdfService';
import { cn } from '@/lib/utils';

interface GradeSheetProps {
  unit: PedagogicalUnit;
}

interface LocalGradeState {
  [key: string]: string;
}

const GradeSheet: React.FC<GradeSheetProps> = ({ unit }) => {
  const { 
    getStudentsByClass, 
    getEvaluationsByUnit, 
    getPeriodsByUnit,
    deletePeriod,
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
  } = useApp();
  
  const { teacher } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showStatistics, setShowStatistics] = useState(false);
  
  const students = useMemo(() => {
    return getStudentsByClass(unit.classRoomId)
      .filter(s => s.status === 'active')
      .sort((a, b) => {
        const lastNameCompare = a.lastName.localeCompare(b.lastName, 'fr');
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName, 'fr');
      });
  }, [getStudentsByClass, unit.classRoomId]);
  
  const evaluations = getEvaluationsByUnit(unit.id);
  const periods = getPeriodsByUnit(unit.id);
  const isSaved = isUnitSaved(unit.id);
  
  const [activePeriod, setActivePeriod] = useState<string>('');
  
  React.useEffect(() => {
    if (!activePeriod && periods.length > 0) {
      const active = periods.find(p => p.status === 'active')?.id;
      setActivePeriod(active || periods[0].id);
    }
  }, [periods, activePeriod]);

  const filteredEvaluations = useMemo(() => {
    if (!activePeriod) return [];
    return evaluations.filter(e => e.periodId === activePeriod);
  }, [evaluations, activePeriod]);
  
  const interros = filteredEvaluations.filter(e => e.type === 'interro');
  const devoirs = filteredEvaluations.filter(e => e.type === 'devoir');
  
  const [showEvalDialog, setShowEvalDialog] = useState(false);
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [showEditUnitDialog, setShowEditUnitDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<{
    gradeId: string;
    studentName: string;
    currentValue: number;
    evalName: string;
  } | null>(null);
  const [modifyReason, setModifyReason] = useState('');
  const [newGradeValue, setNewGradeValue] = useState('');
  
  const [localGrades, setLocalGrades] = useState<LocalGradeState>({});
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const allTableEvals = useMemo(() => [...interros, ...devoirs], [interros, devoirs]);

  // hasGradesToSave - defined early for use in keyboard shortcuts
  const hasGradesToSave = Object.keys(localGrades).some(key => localGrades[key] !== '');

  const getGrade = useCallback((studentId: string, evaluationId: string) => {
    return grades.find(g => g.studentId === studentId && g.evaluationId === evaluationId);
  }, [grades]);

  const calculateTypeAverage = useCallback((studentId: string, evals: Evaluation[]): number | null => {
    const studentGrades = evals
      .map(e => {
        const key = `${studentId}-${e.id}`;
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
    const studentsWithHighAverages = students.map(student => ({
      studentId: student.id,
      average: calculateFinalAverage(student.id)
    }));
    const sorted = [...studentsWithHighAverages].filter(s => s.average !== null).sort((a, b) => b.average! - a.average!);
    const rankings: Record<string, number | null> = {};
    sorted.forEach((student, index) => {
      if (index > 0 && student.average === sorted[index - 1].average) rankings[student.studentId] = rankings[sorted[index - 1].studentId];
      else rankings[student.studentId] = index + 1;
    });
    students.forEach(student => { if (!(student.id in rankings)) rankings[student.id] = null; });
    return rankings;
  }, [students, calculateFinalAverage]);

  const handleLocalGradeInput = useCallback((studentId: string, evaluationId: string, value: string) => {
    const key = `${studentId}-${evaluationId}`;
    // Allow the value to be set even if it's currently invalid (e.g. while typing)
    // We will validate during rendering and saving
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
      const nextKey = `${targetStudentId}-${targetEvalId}`;
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
      const [studentId, evaluationId] = key.split('-');
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

  const handleExportPDF = useCallback(() => {
    const period = periods.find(p => p.id === activePeriod);
    const classroom = classRooms.find(c => c.id === unit.classRoomId);
    const schoolYear = schoolYears.find(y => y.id === unit.schoolYearId);
    
    if (!period || !classroom || !schoolYear) {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de générer les bulletins. Données manquantes.', 
        variant: 'destructive' 
      });
      return;
    }

    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Enseignant';

    generateClassBulletins(
      students,
      filteredEvaluations,
      grades,
      {
        unit,
        classroom,
        schoolYear,
        period,
        teacherName
      },
      calculateTypeAverage,
      calculateFinalAverage,
      studentRankings
    );

    toast({ 
      title: 'Bulletins générés 📄', 
      description: `${students.length} bulletins exportés en PDF.` 
    });
  }, [periods, activePeriod, classRooms, schoolYears, unit, teacher, students, filteredEvaluations, grades, calculateTypeAverage, calculateFinalAverage, studentRankings, toast]);

  const handleModifyGrade = useCallback((studentId: string, evaluationId: string, newValue: string) => {
    const existingGrade = getGrade(studentId, evaluationId);
    const evaluation = evaluations.find(e => e.id === evaluationId);
    const student = students.find(s => s.id === studentId);
    if (!existingGrade || !evaluation || !student) return;
    if (existingGrade.history.length > 0) {
      toast({ title: 'Attention', description: 'Note déjà modifiée une fois.', variant: 'destructive' });
      return;
    }
    setSelectedGrade({ gradeId: existingGrade.id, studentName: `${student.lastName} ${student.firstName}`, currentValue: existingGrade.value, evalName: evaluation.name });
    setNewGradeValue(newValue);
    setShowModifyDialog(true);
  }, [getGrade, evaluations, students, toast]);

  const registerRef = useCallback((studentId: string, evalId: string, ref: HTMLInputElement | null) => {
    const key = `${studentId}-${evalId}`;
    if (ref) inputRefs.current.set(key, ref);
    else inputRefs.current.delete(key);
  }, []);

  const isNewEvaluation = useCallback((evaluationId: string): boolean => {
    if (!isSaved) return false;
    const gradesForEval = grades.filter(g => g.evaluationId === evaluationId);
    return gradesForEval.length === 0 || gradesForEval.every(g => !g.isLocked);
  }, [isSaved, grades]);

  // Keyboard shortcuts (defined after handlers)
  useKeyboardShortcuts({
    onNewEvaluation: () => {
      if (periods.find(p => p.id === activePeriod)?.status === 'active') {
        setShowEvalDialog(true);
      }
    },
    onSave: () => {
      if (hasGradesToSave) {
        handleSaveGrades();
      }
    },
    onClose: () => {
      if (showEvalDialog) setShowEvalDialog(false);
      else if (showPeriodDialog) setShowPeriodDialog(false);
      else if (showModifyDialog) setShowModifyDialog(false);
      else if (showEditUnitDialog) setShowEditUnitDialog(false);
    },
    enabled: true,
  });

  const renderGradeCell = (student: Student, evaluation: Evaluation, studentIndex: number) => {
    const grade = getGrade(student.id, evaluation.id);
    const isEditing = editingStudent === student.id;
    const alreadyModified = grade?.history && grade.history.length > 0;
    const key = `${student.id}-${evaluation.id}`;
    const evalIsNew = isNewEvaluation(evaluation.id);
    const canFreeEdit = !isSaved || evalIsNew;
    
    const currentValue = localGrades[key] ?? (grade?.value?.toString() ?? '');
    const numValue = parseFloat(currentValue);
    const isInvalid = !isNaN(numValue) && (numValue < 0 || numValue > evaluation.maxScore);

    return (
      <td key={evaluation.id} className="p-1 text-center">
        <div className="relative group/cell">
          {canFreeEdit ? (
            <Input
              ref={(ref) => registerRef(student.id, evaluation.id, ref)}
              type="text"
              inputMode="decimal"
              placeholder="-"
              value={currentValue}
              onChange={(e) => handleLocalGradeInput(student.id, evaluation.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, student.id, evaluation.id)}
              className={cn(
                "w-14 h-9 mx-auto border-none text-center text-xs font-bold rounded-lg transition-all",
                isInvalid ? "bg-soft-pink text-soft-pink-foreground" : "bg-secondary/30 focus:bg-card"
              )}
            />
          ) : isEditing && !alreadyModified ? (
            <Input
              ref={(ref) => registerRef(student.id, evaluation.id, ref)}
              type="number"
              min="0"
              max={evaluation.maxScore}
              step="0.5"
              defaultValue={grade?.value ?? ''}
              onBlur={(e) => { if (e.target.value !== grade?.value?.toString()) handleModifyGrade(student.id, evaluation.id, e.target.value); }}
              className="w-14 h-9 mx-auto border-2 border-soft-pink-foreground/30 text-center text-xs font-bold rounded-lg"
            />
          ) : (
            <div className={cn(
              "w-14 h-9 mx-auto flex items-center justify-center text-xs font-bold rounded-lg border border-transparent",
              alreadyModified ? "bg-soft-orange text-soft-orange-foreground border-soft-orange-foreground/20" : "bg-muted/30 text-muted-foreground"
            )}>
              {grade?.value ?? '-'}
            </div>
          )}
          {alreadyModified && (
            <History size={10} className="absolute -top-1 -right-1 text-soft-orange-foreground drop-shadow-sm" />
          )}
        </div>
      </td>
    );
  };

  if (students.length === 0) return (
    <div className="apple-card p-12 text-center bg-card/50 backdrop-blur-md border border-border/40">
      <AlertCircle className="mx-auto text-primary mb-4" size={48} />
      <h3 className="text-xl font-semibold mb-2">Classe vide</h3>
      <p className="text-muted-foreground mb-6">Ajoutez des élèves à la classe {unit.classRoomId} pour commencer.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Unit Header Bar */}
      <div className="flex items-center justify-between px-2 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-[2rem] bg-gradient-to-tr from-primary to-accent shadow-xl shadow-primary/20">
            <LayoutDashboard size={28} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">{unit.name}</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary transition-colors hover:bg-card/50" 
                onClick={() => setShowEditUnitDialog(true)}
              >
                <Settings size={16} />
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{students.length} Élèves Actifs</span>
              <div className="h-1 w-1 rounded-full bg-muted-foreground/30"></div>
              <span className="text-xs font-medium text-primary uppercase tracking-wide">{unit.periodSystem}s</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setShowStatistics(!showStatistics)} 
            className="h-11 px-5 rounded-2xl border-none shadow-sm hover:shadow-md transition-all gap-2 font-medium bg-card/80"
          >
            <BarChart3 size={18} />
            {showStatistics ? 'Masquer stats' : 'Statistiques'}
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportPDF}
            disabled={filteredEvaluations.length === 0}
            className="h-11 px-5 rounded-2xl border-none shadow-sm hover:shadow-md transition-all gap-2 font-medium bg-card/80"
          >
            <Download size={18} /> Bulletins PDF
          </Button>
          {isSaved && !hasGradesToSave ? (
             <div className="px-4 py-2 rounded-2xl bg-success/10 text-success text-xs font-medium border border-success/20 flex items-center gap-2">
               <Check size={16} /> Verrouillé
             </div>
          ) : hasGradesToSave && (
            <Button onClick={handleSaveGrades} className="h-11 px-6 rounded-2xl bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-2 font-medium">
              <Save size={18} /> Enregistrer
            </Button>
          )}
          <Button onClick={() => setShowEvalDialog(true)} className="h-11 px-6 rounded-2xl bg-card text-foreground border-none shadow-sm hover:shadow-md transition-all gap-2 font-medium">
            <Plus size={18} /> Nouvelle Éval
          </Button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStatistics && activePeriod && (
        <ClassStatistics
          students={students}
          evaluations={filteredEvaluations}
          calculateFinalAverage={calculateFinalAverage}
          periodName={periods.find(p => p.id === activePeriod)?.name || ''}
        />
      )}

      {/* Period Progress Bar */}
      {activePeriod && periods.find(p => p.id === activePeriod) && (
        <PeriodProgressBar 
          period={periods.find(p => p.id === activePeriod)!} 
          evaluations={filteredEvaluations} 
        />
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="flex items-center gap-4 px-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Keyboard size={12} />
          <span className="font-medium">Raccourcis :</span>
        </div>
        <div className="flex gap-3">
          <span><kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono text-[9px]">Ctrl+N</kbd> Nouvelle éval</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono text-[9px]">Ctrl+S</kbd> Enregistrer</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono text-[9px]">Esc</kbd> Fermer</span>
        </div>
      </div>

      {/* Period Selection / Glass Container */}
      <div className="glass-card rounded-[2.5rem] p-2">
        <div className="flex flex-col gap-2 p-1">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/20">
            <div className="flex items-center gap-4">
              <Timer size={18} className="text-primary" />
              <div className="flex gap-2">
                {periods.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActivePeriod(p.id)}
                    className={cn(
                      "px-5 py-2 rounded-xl text-xs font-medium transition-all duration-300 relative flex items-center gap-2",
                      activePeriod === p.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                    )}
                  >
                    {p.status === 'completed' && <Check size={12} className="text-success" />}
                    {p.status === 'locked' && <Lock size={12} className="opacity-40" />}
                    {p.name}
                    {p.status === 'active' && (
                       <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary border-2 border-white rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={() => setShowPeriodDialog(true)} className="rounded-xl text-[10px] uppercase tracking-wide font-medium text-muted-foreground hover:text-primary transition-colors">
              Gérer les périodes
            </Button>
          </div>

          <div className="p-4 scrollable-content overflow-x-auto">
            {filteredEvaluations.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-muted/20 mx-auto rounded-3xl flex items-center justify-center">
                  <Plus size={24} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Aucune évaluation pour cette période.</p>
                {periods.find(p => p.id === activePeriod)?.status === 'active' ? (
                  <Button variant="outline" size="sm" onClick={() => setShowEvalDialog(true)} className="rounded-xl font-medium">Créer maintenant</Button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl max-w-xs mx-auto">
                      Cette période ({periods.find(p => p.id === activePeriod)?.name}) est actuellement verrouillée.
                    </p>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => activatePeriod(activePeriod!)} 
                      className="rounded-xl font-medium bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                    >
                      Activer la période
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <table className="w-full border-separate border-spacing-y-2 border-spacing-x-0">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground w-12 text-center">Rang</th>
                    <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground sticky left-0 glass-card border-none z-10 w-48">Étudiant</th>
                    {interros.map(e => (
                      <th key={e.id} className="px-1 py-2 text-center">
                        <div className="text-[10px] font-medium uppercase text-soft-blue-foreground">{e.name}</div>
                        <div className="text-[8px] font-medium text-muted-foreground mt-0.5 opacity-50">/{e.maxScore}</div>
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-soft-blue-foreground uppercase bg-soft-blue/30 rounded-t-xl">Moy. Int</th>
                    {devoirs.map(e => (
                      <th key={e.id} className="px-1 py-2 text-center">
                        <div className="text-[10px] font-medium uppercase text-soft-pink-foreground">{e.name}</div>
                        <div className="text-[8px] font-medium text-muted-foreground mt-0.5 opacity-50">/{e.maxScore}</div>
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-soft-pink-foreground uppercase bg-soft-pink/30 rounded-t-xl">Moy. Dev</th>
                    <th className="px-6 py-2 text-center text-[10px] font-medium uppercase text-primary">Moyenne Finale</th>
                  </tr>
                </thead>
                <tbody className="before:block before:h-2">
                  {students.map((student, studentIdx) => {
                    const moyInt = calculateTypeAverage(student.id, interros);
                    const moyDev = calculateTypeAverage(student.id, devoirs);
                    const final = calculateFinalAverage(student.id);
                    const rank = studentRankings[student.id];

                    return (
                      <tr key={student.id} className="group hover:translate-x-1 transition-transform duration-300">
                        <td className="text-center">
                          <div className={cn(
                            "w-8 h-8 mx-auto rounded-xl flex items-center justify-center text-[10px] font-semibold",
                            rank === 1 ? "bg-soft-orange text-soft-orange-foreground border border-soft-orange-foreground/20" : "bg-muted/10 text-muted-foreground"
                          )}>
                            {rank || '-'}
                          </div>
                        </td>
                        <td className="sticky left-0 glass-card border-none z-10 px-4 py-2 font-medium text-xs truncate">
                          {student.lastName} <span className="text-muted-foreground font-medium">{student.firstName}</span>
                        </td>
                        {interros.map(e => renderGradeCell(student, e, studentIdx))}
                        <td className="bg-soft-blue/10 px-2 text-center font-medium text-xs text-soft-blue-foreground">{moyInt?.toFixed(1) ?? '-'}</td>
                        {devoirs.map(e => renderGradeCell(student, e, studentIdx))}
                        <td className="bg-soft-pink/10 px-2 text-center font-medium text-xs text-soft-pink-foreground">{moyDev?.toFixed(1) ?? '-'}</td>
                        <td className="px-6 text-center">
                          <div className={cn(
                             "inline-flex px-4 py-1 rounded-full text-xs font-semibold shadow-inner",
                             final && final >= 10 ? "bg-soft-green text-soft-green-foreground" : final ? "bg-soft-pink text-soft-pink-foreground" : "bg-muted/10 text-muted-foreground"
                          )}>
                             {final?.toFixed(2) ?? '--'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Completion Banner */}
      {activePeriod && periods.find(p => p.id === activePeriod)?.status === 'active' && (
        <div className="p-6 rounded-[2rem] bg-gradient-to-r from-soft-blue to-white border border-soft-blue-foreground/10 flex items-center justify-between animate-fade-in shadow-sm">
           <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-2xl bg-white border border-soft-blue-foreground/20 flex items-center justify-center text-soft-blue-foreground shadow-sm">
                 <Trophy size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">Clôturer la période ?</h4>
                <p className="text-xs text-muted-foreground">Une fois clôturé, le {periods.find(p=>p.id===activePeriod)?.name} sera archivé et verrouillé.</p>
              </div>
           </div>
           <Button onClick={() => completePeriod(activePeriod)} className="rounded-xl px-8 h-10 bg-soft-blue-foreground text-white font-medium hover:bg-soft-blue-foreground/90 transition-all shadow-lg active:scale-95">
             Valider le semestre
           </Button>
        </div>
      )}

      <CreateEvaluationDialog open={showEvalDialog} onOpenChange={setShowEvalDialog} unitId={unit.id} preselectedPeriodId={activePeriod} />
      <CreatePeriodDialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog} unitId={unit.id} periodSystem={unit.periodSystem || 'semester'} />
      <EditUnitDialog unit={unit} open={showEditUnitDialog} onOpenChange={setShowEditUnitDialog} onDeleted={() => navigate('/units')} />

      <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
        <DialogContent className="rounded-3xl border-none shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-soft-orange-foreground"></div>
          <DialogHeader className="pt-6">
            <DialogTitle className="flex items-center gap-2">
              <History size={20} className="text-soft-orange-foreground" />
              Modification Sécurisée
            </DialogTitle>
            <DialogDescription>Changement définitif pour <b>{selectedGrade?.studentName}</b></DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="p-4 rounded-2xl bg-muted/30">
                <p className="text-[10px] uppercase font-medium text-muted-foreground mb-1">Motif de la rectification</p>
                <textarea className="w-full bg-transparent border-none text-xs focus:ring-0 h-24 font-medium" placeholder="Ex: Erreur de report, recalcul après vérification..." value={modifyReason} onChange={e => setModifyReason(e.target.value)} />
             </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowModifyDialog(false)} className="rounded-xl">Abandonner</Button>
            <Button onClick={() => { updateGrade(selectedGrade!.gradeId, parseFloat(newGradeValue), modifyReason); setShowModifyDialog(false); setEditingStudent(null); }} className="rounded-xl bg-primary px-8">Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GradeSheet;
