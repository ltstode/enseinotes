import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  History,
  Lock,
  AlertCircle,
  Save,
  Check,
  Trophy,
  LayoutDashboard,
  Timer,
  Settings,
  Keyboard,
  Download,
  BarChart3,
  Share2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { PedagogicalUnit, Student, Evaluation } from '@/types/enseinotes';
import { useToast } from '@/hooks/use-toast';
import CreateEvaluationDialog from './CreateEvaluationDialog';
import CreatePeriodDialog from './CreatePeriodDialog';
import EditUnitDialog from '../units/EditUnitDialog';
import PeriodProgressBar from './PeriodProgressBar';
import ClassStatistics from './ClassStatistics';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import BulletinPreviewDialog from './BulletinPreviewDialog';
import MagicShareDialog from './MagicShareDialog';
import { cn } from '@/lib/utils';
import { useGradeSheet } from '@/hooks/useGradeSheet';

interface GradeSheetProps {
  unit: PedagogicalUnit;
}

const GradeSheet: React.FC<GradeSheetProps> = ({ unit }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Toute la logique métier est dans le hook ──────────────────────────────
  const {
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
    studentAverages,
    studentRankings,
    setActivePeriod,
    deletePeriod,
    deleteEvaluation,
    completePeriod,
    activatePeriod,
    updateGrade,
    calculateAverage,
    getGrade,
    calculateTypeAverage,
    calculateFinalAverage,
    handleLocalGradeInput,
    handleKeyDown,
    handleSaveGrades,
    registerRef,
    isNewEvaluation,
  } = useGradeSheet(unit);

  // ── État UI uniquement ────────────────────────────────────────────────────
  const [showStatistics, setShowStatistics] = useState(false);
  const [showBulletinPreview, setShowBulletinPreview] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedStudentForShare, setSelectedStudentForShare] = useState<Student | null>(null);
  const [showEvalDialog, setShowEvalDialog] = useState(false);
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [showEditUnitDialog, setShowEditUnitDialog] = useState(false);
  const [evaluationToDelete, setEvaluationToDelete] = useState<Evaluation | null>(null);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<{
    gradeId: string;
    studentName: string;
    currentValue: number;
    evalName: string;
  } | null>(null);
  const [modifyReason, setModifyReason] = useState('');
  const [newGradeValue, setNewGradeValue] = useState('');

  // ── Handlers UI ───────────────────────────────────────────────────────────
  const handleModifyGrade = useCallback(
    (studentId: string, evaluationId: string, newValue: string) => {
      const existingGrade = getGrade(studentId, evaluationId);
      const evaluation = evaluations.find(e => e.id === evaluationId);
      const student = students.find(s => s.id === studentId);
      if (!existingGrade || !evaluation || !student) return;
      if (existingGrade.history.length > 0) {
        toast({ title: 'Attention', description: 'Note déjà modifiée une fois.', variant: 'destructive' });
        return;
      }
      setSelectedGrade({
        gradeId: existingGrade.id,
        studentName: `${student.lastName} ${student.firstName}`,
        currentValue: existingGrade.value,
        evalName: evaluation.name,
      });
      setNewGradeValue(newValue);
      setShowModifyDialog(true);
    },
    [getGrade, evaluations, students, toast]
  );

  const handleExportPDF = useCallback(() => {
    const period = periods.find(p => p.id === activePeriod);
    const classroom = classRooms.find(c => c.id === unit.classRoomId);
    const schoolYear = schoolYears.find(y => y.id === unit.schoolYearId);
    if (!period || !classroom || !schoolYear) {
      toast({ title: 'Erreur', description: 'Impossible de générer les bulletins. Données manquantes.', variant: 'destructive' });
      return;
    }
    setShowBulletinPreview(true);
  }, [periods, activePeriod, classRooms, schoolYears, unit, toast]);

  const handleExportExcel = useCallback(async () => {
    if (!activePeriod) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner une période.', variant: 'destructive' });
      return;
    }
    const period = periods.find(p => p.id === activePeriod);
    const classroom = classRooms.find(c => c.id === unit.classRoomId);
    if (!period || !classroom) {
      toast({ title: 'Erreur', description: 'Données manquantes.', variant: 'destructive' });
      return;
    }

    const XLSX = await import('xlsx');
    const nI = interros.length;
    const nD = devoirs.length;
    const colMI = 2 + nI;
    const colMS = colMI + 1 + nD;
    const colMC = colMS + 1;

    const colLetter = (col: number): string => {
      let s = '';
      let n = col + 1;
      while (n > 0) {
        const rem = (n - 1) % 26;
        s = String.fromCharCode(65 + rem) + s;
        n = Math.floor((n - 1) / 26);
      }
      return s;
    };

    const headerRow: string[] = [
      'Nom', 'Prénom',
      ...interros.map((e, i) => `I${i + 1} (/${e.maxScore})`), 'MI',
      ...devoirs.map((e, i) => `D${i + 1} (/${e.maxScore})`), 'MS', 'MC', 'Rang',
    ];

    const dataRows = students.map((student, rowIdx) => {
      const excelRow = rowIdx + 2;
      const iCols = interros.map(e => { const g = getGrade(student.id, e.id); return g?.value ?? null; });
      let formulaMI = '';
      if (interros.length > 0) {
        const parts = interros.map((e, i) => `(${colLetter(2 + i)}${excelRow}/${e.maxScore}*20*${e.coefficient})`);
        const totalCoef = interros.reduce((s, e) => s + e.coefficient, 0);
        formulaMI = `=IFERROR(ROUND((${parts.join('+')})/IF(${parts.map((_, i) => `ISNUMBER(${colLetter(2 + i)}${excelRow})`).join('+')}=0,1,${totalCoef}),2),"-")`;
      }
      const dCols = devoirs.map(e => { const g = getGrade(student.id, e.id); return g?.value ?? null; });
      let formulaMS = '';
      if (devoirs.length > 0) {
        const parts = devoirs.map((e, i) => `(${colLetter(colMI + 1 + i)}${excelRow}/${e.maxScore}*20*${e.coefficient})`);
        const totalCoef = devoirs.reduce((s, e) => s + e.coefficient, 0);
        formulaMS = `=IFERROR(ROUND((${parts.join('+')})/IF(${parts.map((_, i) => `ISNUMBER(${colLetter(colMI + 1 + i)}${excelRow})`).join('+')}=0,1,${totalCoef}),2),"-")`;
      }
      const { interroWeight, devoirWeight } = unit.rules;
      const totalWeight = interroWeight + devoirWeight;
      const miCell = `${colLetter(colMI)}${excelRow}`;
      const msCell = `${colLetter(colMS)}${excelRow}`;
      let formulaMC = '';
      if (interros.length === 0 && devoirs.length === 0) formulaMC = '';
      else if (interros.length === 0) formulaMC = `=IFERROR(${msCell},"-")`;
      else if (devoirs.length === 0) formulaMC = `=IFERROR(${miCell},"-")`;
      else formulaMC = `=IFERROR(ROUND((${miCell}*${interroWeight}+${msCell}*${devoirWeight})/${totalWeight},2),"-")`;
      const ranking = studentRankings[student.id];
      const rangVal = ranking ? (ranking.isExAequo ? `${ranking.rank} ex` : ranking.rank.toString()) : '-';
      return [student.lastName, student.firstName, ...iCols, formulaMI, ...dCols, formulaMS, formulaMC, rangVal];
    });

    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
    for (let r = 0; r < students.length; r++) {
      const excelRow = r + 2;
      for (const addr of [
        `${colLetter(colMI)}${excelRow}`,
        `${colLetter(colMS)}${excelRow}`,
        `${colLetter(colMC)}${excelRow}`,
      ]) {
        if (ws[addr] && typeof ws[addr].v === 'string' && ws[addr].v.startsWith('=')) {
          ws[addr] = { t: 'n', f: ws[addr].v.slice(1), v: 0 };
        }
      }
    }
    ws['!cols'] = [
      { wch: 20 }, { wch: 16 },
      ...interros.map(() => ({ wch: 10 })), { wch: 10 },
      ...devoirs.map(() => ({ wch: 10 })), { wch: 10 }, { wch: 10 }, { wch: 8 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, period.name);
    const fileName = `${classroom.name}_${unit.name}_${period.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast({ title: 'Export réussi ✨', description: `Bulletin Excel avec formules exporté pour ${students.length} élève(s).` });
  }, [activePeriod, periods, classRooms, unit, students, interros, devoirs, getGrade, studentRankings, toast]);

  // ── Raccourcis clavier ────────────────────────────────────────────────────
  useKeyboardShortcuts({
    onNewEvaluation: () => { if (periods.find(p => p.id === activePeriod)?.status === 'active') setShowEvalDialog(true); },
    onSave: () => { if (hasGradesToSave) handleSaveGrades(); },
    onClose: () => {
      if (showEvalDialog) setShowEvalDialog(false);
      else if (showPeriodDialog) setShowPeriodDialog(false);
      else if (showModifyDialog) setShowModifyDialog(false);
      else if (showEditUnitDialog) setShowEditUnitDialog(false);
    },
    enabled: true,
  });

  // ── Rendu d'une cellule de note ───────────────────────────────────────────
  const renderGradeCell = useCallback(
    (student: Student, evaluation: Evaluation, _studentIndex: number) => {
      const grade = getGrade(student.id, evaluation.id);
      const isEditing = editingStudent === student.id;
      const alreadyModified = grade?.history && grade.history.length > 0;
      const key = `${student.id}::${evaluation.id}`;
      const evalIsNew = isNewEvaluation(evaluation.id);
      const canFreeEdit = !isSaved || evalIsNew;
      const hasLocalDraft = key in localGrades;
      const currentValue = hasLocalDraft ? localGrades[key] : (grade?.value?.toString() ?? '');
      const numValue = parseFloat(currentValue);
      const isInvalid = currentValue !== '' && (isNaN(numValue) || numValue < 0 || numValue > evaluation.maxScore);

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
                  "w-14 h-9 mx-auto border-none text-center text-xs font-bold rounded-lg transition-all focus:ring-2 focus:ring-primary/30",
                  isInvalid ? "bg-destructive/15 text-destructive font-bold" : "bg-muted/30 dark:bg-muted/50 text-foreground focus:bg-card"
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
                alreadyModified ? "bg-soft-orange/30 dark:bg-soft-orange text-foreground border-soft-orange-foreground/30" : "bg-muted/15 dark:bg-muted/30 text-foreground"
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
    },
    [getGrade, editingStudent, isNewEvaluation, isSaved, localGrades, registerRef, handleLocalGradeInput, handleKeyDown, handleModifyGrade]
  );

  // ── Guard : classe sans élèves ────────────────────────────────────────────
  if (students.length === 0) return (
    <div className="apple-card p-12 text-center bg-card/50 backdrop-blur-md border border-border/40">
      <AlertCircle className="mx-auto text-primary mb-4" size={48} />
      <h3 className="text-xl font-semibold mb-2">Classe vide</h3>
      <p className="text-muted-foreground mb-6">Ajoutez des élèves à la classe {unit.classRoomId} pour commencer.</p>
    </div>
  );

  // ── Rendu principal ───────────────────────────────────────────────────────
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
            className="h-11 px-5 rounded-2xl border-none shadow-sm hover:shadow-md transition-all gap-2 font-bold bg-card/80"
          >
            <BarChart3 size={18} />
            {showStatistics ? 'Masquer stats' : 'Statistiques'}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={filteredEvaluations.length === 0}
            className="h-11 px-5 rounded-2xl border-none shadow-sm hover:shadow-md transition-all gap-2 font-bold bg-card/80 hover:bg-soft-green hover:text-soft-green-foreground"
          >
            <Download size={18} /> Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={filteredEvaluations.length === 0}
            className="h-11 px-5 rounded-2xl border-none shadow-sm hover:shadow-md transition-all gap-2 font-bold bg-card/80"
          >
            <Download size={18} /> Bulletins PDF
          </Button>
          {isSaved && !hasGradesToSave ? (
            <div className="px-4 py-2 rounded-2xl bg-success/10 text-success text-xs font-bold border border-success/20 flex items-center gap-2">
              <Check size={16} /> Verrouillé
            </div>
          ) : hasGradesToSave && (
            <Button onClick={handleSaveGrades} className="h-11 px-6 rounded-2xl bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-2 font-bold">
              <Save size={18} /> Enregistrer
            </Button>
          )}
          <Button onClick={() => setShowEvalDialog(true)} className="h-11 px-6 rounded-2xl bg-card text-foreground border-none shadow-sm hover:shadow-md transition-all gap-2 font-bold">
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
                      'px-5 py-2 rounded-xl text-xs font-medium transition-all duration-300 relative flex items-center gap-2',
                      activePeriod === p.id
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
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

          <div className="scrollable-content overflow-x-auto max-h-[65vh] overflow-y-auto relative rounded-3xl bg-white/30 dark:bg-card/50 backdrop-blur-3xl border border-white/20 dark:border-border/40 shadow-xl dark:shadow-black/30 ml-4 mr-4 mb-4">
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
              <table className="w-full border-separate border-spacing-x-0" style={{ borderSpacing: '0 var(--density-gap, 0.5rem)' }}>
                <thead className="sticky top-0 z-30 bg-white/80 dark:bg-[hsl(224,45%,12%)]/95 backdrop-blur-xl border-b border-white/10 dark:border-border/50 shadow-sm transition-all">
                  <tr className="text-left">
                    <th className="px-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground w-12 text-center py-4">Rang</th>
                    <th className="px-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground sticky left-0 bg-white/80 dark:bg-[hsl(224,45%,12%)] backdrop-blur-xl z-40 w-48 py-4 text-left border-r border-white/5 dark:border-border/30">Étudiant</th>
                    {interros.map(e => (
                      <th key={e.id} className="px-1 text-center py-4 group/h">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1 group/btn">
                            <div className="text-[10px] font-medium uppercase text-soft-blue-foreground">{e.name}</div>
                            <button 
                              onClick={() => setEvaluationToDelete(e)}
                              className="opacity-0 group-hover/h:opacity-100 p-1 rounded-md hover:bg-soft-pink/20 text-soft-pink-foreground transition-all"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                          <div className="text-[8px] font-medium text-muted-foreground mt-0.5 opacity-50">/{e.maxScore}</div>
                        </div>
                      </th>
                    ))}
                    <th className="px-2 text-center text-[10px] font-medium text-soft-orange-foreground uppercase bg-orange-50/80 dark:bg-soft-orange rounded-t-xl py-4">MI</th>
                    {devoirs.map(e => (
                      <th key={e.id} className="px-1 text-center py-4 group/h">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1">
                            <div className="text-[10px] font-medium uppercase text-soft-pink-foreground">{e.name}</div>
                            <button
                              onClick={() => setEvaluationToDelete(e)}
                              className="opacity-0 group-hover/h:opacity-100 p-1 rounded-md hover:bg-soft-pink/20 text-soft-pink-foreground transition-all"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                          <div className="text-[8px] font-medium text-muted-foreground mt-0.5 opacity-50">/{e.maxScore}</div>
                        </div>
                      </th>
                    ))}
                    <th className="px-2 text-center text-[10px] font-medium text-blue-600 dark:text-soft-blue-foreground uppercase bg-blue-50/80 dark:bg-soft-blue rounded-t-xl py-4">MS</th>
                    <th className="px-4 text-center text-[10px] font-medium uppercase text-primary bg-primary/10 dark:bg-primary/15 rounded-t-xl py-4">MC</th>
                    <th className="w-20 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground py-4 flex items-center justify-center gap-1">
                      <Share2 size={10} className="text-primary" />
                      <span className="text-primary font-semibold">Magic Shell</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, studentIdx) => {
                    const avgs = studentAverages.get(student.id);
                    const moyInt = avgs?.mi ?? null;
                    const moyDev = avgs?.ms ?? null;
                    const final_ = avgs?.mc ?? null;
                    const rank = studentRankings[student.id];

                    return (
                      <tr key={student.id} className="group hover:bg-white/40 dark:hover:bg-white/[0.04] transition-colors duration-200 bg-white/20 dark:bg-white/[0.02] backdrop-blur-sm">
                        <td className="text-center">
                          <div className={cn(
                            "w-8 h-8 mx-auto rounded-xl flex items-center justify-center text-[10px] font-semibold",
                            rank?.rank === 1 ? "bg-soft-orange text-soft-orange-foreground border border-soft-orange-foreground/20" : "bg-muted/20 dark:bg-muted/30 text-muted-foreground"
                          )}>
                            {rank ? `${rank.rank}${rank.isExAequo ? 'e' : ''}` : '-'}
                          </div>
                        </td>
                        <td className="sticky left-0 bg-white/80 dark:bg-[hsl(224,45%,11%)] backdrop-blur-xl z-20 px-4 py-3 font-medium text-xs truncate border-r border-white/5 dark:border-border/30 shadow-[2px_0_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_10px_-4px_rgba(0,0,0,0.3)]">
                          <span className="text-foreground">{student.lastName}</span> <span className="text-muted-foreground font-medium">{student.firstName}</span>
                        </td>
                        {interros.map(e => renderGradeCell(student, e, studentIdx))}
                        {/* MI */}
                        <td className="bg-orange-50/70 dark:bg-soft-orange px-2 text-center font-semibold text-xs text-orange-700 dark:text-soft-orange-foreground border-x border-orange-100/50 dark:border-soft-orange-foreground/15">
                          {moyInt?.toFixed(1) ?? '-'}
                        </td>
                        {devoirs.map(e => renderGradeCell(student, e, studentIdx))}
                        {/* MS */}
                        <td className="bg-blue-50/70 dark:bg-soft-blue px-2 text-center font-semibold text-xs text-blue-700 dark:text-soft-blue-foreground border-x border-blue-100/50 dark:border-soft-blue-foreground/15">
                          {moyDev?.toFixed(1) ?? '-'}
                        </td>
                        {/* MC */}
                        <td className="bg-primary/8 dark:bg-primary/10 px-4 text-center">
                          <div className={cn(
                             "inline-flex px-4 py-1 rounded-full text-xs font-semibold",
                             final_ && final_ >= 10 ? "bg-soft-green text-soft-green-foreground" : final_ ? "bg-soft-pink text-soft-pink-foreground" : "bg-muted/20 dark:bg-muted/30 text-muted-foreground"
                          )}>
                            {final_?.toFixed(2) ?? '--'}
                          </div>
                        </td>
                        {/* Magic Shell */}
                        <td className="px-2 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/10 transition-all"
                            onClick={() => { setSelectedStudentForShare(student); setShowShareDialog(true); }}
                            title="Magic Shell — Partage Magique"
                          >
                            <Share2 size={14} />
                          </Button>
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
              <p className="text-xs text-muted-foreground">Une fois clôturé, le {periods.find(p => p.id === activePeriod)?.name} sera archivé et verrouillé.</p>
            </div>
          </div>
          <Button onClick={() => completePeriod(activePeriod)} className="rounded-xl px-8 h-10 bg-soft-blue-foreground text-white font-medium hover:bg-soft-blue-foreground/90 transition-all shadow-lg active:scale-95">
            {unit.periodSystem === 'trimester' ? 'Valider le trimestre' : unit.periodSystem === 'none' ? 'Clôturer la période' : 'Valider le semestre'}
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <CreateEvaluationDialog open={showEvalDialog} onOpenChange={setShowEvalDialog} unitId={unit.id} preselectedPeriodId={activePeriod} />
      <CreatePeriodDialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog} unitId={unit.id} periodSystem={unit.periodSystem || 'semester'} />
      <EditUnitDialog unit={unit} open={showEditUnitDialog} onOpenChange={setShowEditUnitDialog} onDeleted={() => navigate('/units')} />

      {/* Bulletin Preview */}
      {(() => {
        const period = periods.find(p => p.id === activePeriod);
        const classroom = classRooms.find(c => c.id === unit.classRoomId);
        const schoolYear = schoolYears.find(y => y.id === unit.schoolYearId);
        const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Enseignant';
        if (period && classroom && schoolYear) {
          return (
            <BulletinPreviewDialog
              open={showBulletinPreview}
              onOpenChange={setShowBulletinPreview}
              students={students}
              evaluations={filteredEvaluations}
              grades={grades}
              unit={unit}
              classroom={classroom}
              schoolYear={schoolYear}
              period={period}
              teacherName={teacherName}
              calculateTypeAverage={calculateTypeAverage}
              calculateFinalAverage={calculateFinalAverage}
              studentRankings={studentRankings}
            />
          );
        }
        return null;
      })()}

      {/* Dialog : Modification sécurisée */}
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
              <textarea
                className="w-full bg-transparent border-none text-xs focus:ring-0 h-24 font-medium"
                placeholder="Ex: Erreur de report, recalcul après vérification..."
                value={modifyReason}
                onChange={e => setModifyReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowModifyDialog(false)} className="rounded-xl">Abandonner</Button>
            <Button
              onClick={() => {
                updateGrade(selectedGrade!.gradeId, parseFloat(newGradeValue), modifyReason);
                setShowModifyDialog(false);
                setEditingStudent(null);
              }}
              className="rounded-xl bg-primary px-8"
            >
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Magic Share Dialog */}
      {selectedStudentForShare && (
        <MagicShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          student={selectedStudentForShare}
          unit={unit}
          availableUnits={classUnits}
          allPeriods={allPeriods}
          classroom={classRooms.find(c => c.id === unit.classRoomId)}
          schoolYear={schoolYears.find(y => y.id === unit.schoolYearId)}
          teacherName={teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Enseignant'}
          calculateAverage={calculateAverage}
          classStudents={students}
        />
      )}

      {/* Delete Evaluation Confirmation */}
      <AlertDialog open={!!evaluationToDelete} onOpenChange={() => setEvaluationToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border border-border/60 shadow-2xl bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-semibold text-soft-pink-foreground flex items-center gap-2">
              <AlertTriangle className="text-soft-pink-foreground" />
              Supprimer l'évaluation ?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-muted-foreground py-2">
              L'évaluation <b>{evaluationToDelete?.name}</b> sera définitivement supprimée.
            </AlertDialogDescription>
            {evaluationToDelete && (
              <div className="mt-2 p-4 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-2">
                <p className="text-[10px] uppercase font-bold text-destructive/60 tracking-wider">Analyse d'impact</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Notes à supprimer</span>
                  <span className="font-bold text-destructive">
                    {grades.filter(g => g.evaluationId === evaluationToDelete.id).length}
                  </span>
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-none bg-secondary hover:bg-secondary/70">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (evaluationToDelete) {
                  deleteEvaluation(evaluationToDelete.id);
                  setEvaluationToDelete(null);
                  toast({ title: 'Évaluation supprimée', variant: 'destructive' });
                }
              }}
              className="rounded-xl bg-soft-pink-foreground text-white hover:bg-soft-pink-foreground/90 shadow-lg shadow-soft-pink-foreground/20 font-medium px-8"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GradeSheet;
