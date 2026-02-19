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
  BarChart3,
  Share2
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
import BulletinPreviewDialog from './BulletinPreviewDialog';
import MagicShareDialog from './MagicShareDialog';
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
    getUnitsByClass,
    periods: allPeriods,
    calculateAverage,
  } = useApp();
  
  const { teacher } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showStatistics, setShowStatistics] = useState(false);
  const [showBulletinPreview, setShowBulletinPreview] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedStudentForShare, setSelectedStudentForShare] = useState<Student | null>(null);

  // Toutes les unités de la classe (pour le sélecteur de matière dans le dialog)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unit.id, grades] // re-derive when grades saved (unit evaluations don't change often)
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
  
  const interros = useMemo(
    () => filteredEvaluations.filter(e => e.type === 'interro'),
    [filteredEvaluations]
  );
  const devoirs = useMemo(
    () => filteredEvaluations.filter(e => e.type === 'devoir'),
    [filteredEvaluations]
  );
  
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
    const studentsWithAverages = students
      .map(student => ({
        studentId: student.id,
        lastName: student.lastName,
        firstName: student.firstName,
        average: calculateFinalAverage(student.id)
      }))
      .filter((s): s is typeof s & { average: number } => s.average !== null);

    // Sort by average DESC, then alphabetically (lastName, firstName) for ties
    const sorted = [...studentsWithAverages].sort((a, b) => {
      if (b.average !== a.average) return b.average - a.average;
      const lastCmp = a.lastName.localeCompare(b.lastName, 'fr');
      if (lastCmp !== 0) return lastCmp;
      return a.firstName.localeCompare(b.firstName, 'fr');
    });

    const rankings: Record<string, { rank: number; isExAequo: boolean } | null> = {};
    sorted.forEach((student, index) => {
      if (index > 0 && student.average === sorted[index - 1].average) {
        // Ex-aequo: same rank as previous, mark both as ex-aequo
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

  // ── Précalcul de toutes les moyennes en un seul useMemo ──────────────────────
  // Évite N×3 appels de fonctions complexes à chaque render du tbody.
  // Le tableau de 30 élèves × 3 moyennes passe de 90 appels à 0 lors du rendu.
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

    // Open the preview dialog instead of directly exporting
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

    // Chargement différé de SheetJS : ne bloque pas le bundle initial
    const XLSX = await import('xlsx');

    // ── Colonnes ──────────────────────────────────────────────────────────────
    // Col A = Nom, B = Prénom
    // Col C..C+nI-1 = Interros (I1, I2...)
    // Col C+nI = MI (Moy. Interros)
    // Col C+nI+1..C+nI+nD = Devoirs (D1, D2...)
    // Col C+nI+nD+1 = MS (Moy. Devoirs / Semestrielle)
    // Col C+nI+nD+2 = MC (Moyenne Coefficiée / Finale) — si règle de pondération
    // Col C+nI+nD+3 = Rang
    const nI = interros.length;
    const nD = devoirs.length;
    const colMI = 2 + nI;           // 0-indexed: A=0, B=1, C=2...
    const colMS = colMI + 1 + nD;   // après les devoirs
    const colMC = colMS + 1;
    const colRang = colMC + 1;

    // Helper: numéro de colonne (0-indexed) → lettre Excel
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

    // ── En-têtes ──────────────────────────────────────────────────────────────
    const headerRow: string[] = [
      'Nom', 'Prénom',
      ...interros.map((e, i) => `I${i + 1} (/${e.maxScore})`),
      'MI',
      ...devoirs.map((e, i) => `D${i + 1} (/${e.maxScore})`),
      'MS',
      'MC',
      'Rang'
    ];

    // ── Lignes de données ───────────────────────────────────────────────────
    const dataRows = students.map((student, rowIdx) => {
      const excelRow = rowIdx + 2; // ligne 1 = en-tête

      // Colonnes des interros
      const iCols = interros.map((e) => {
        const grade = getGrade(student.id, e.id);
        return grade?.value ?? null;
      });

      // Formule MI : moyenne pondérée des interros (note/maxScore * 20 * coef) / somme coefs
      // Si une seule interro sans coef particulier → simple AVERAGE normalisée
      let formulaMI: string;
      if (interros.length === 0) {
        formulaMI = '';
      } else {
        // SUMPRODUCT((note/maxScore)*20*coef) / SUMPRODUCT(coef)
        // On utilise les cellules directement
        const parts = interros.map((e, i) => {
          const cell = `${colLetter(2 + i)}${excelRow}`;
          return `(${cell}/${e.maxScore}*20*${e.coefficient})`;
        });
        const totalCoef = interros.reduce((s, e) => s + e.coefficient, 0);
        formulaMI = `=IFERROR(ROUND((${parts.join('+')})/IF(${parts.map((_, i) => `ISNUMBER(${colLetter(2 + i)}${excelRow})`).join('+')}=0,1,${totalCoef}),2),"-")`;
      }

      // Colonnes des devoirs
      const dCols = devoirs.map((e) => {
        const grade = getGrade(student.id, e.id);
        return grade?.value ?? null;
      });

      // Formule MS : même logique pour les devoirs
      let formulaMS: string;
      if (devoirs.length === 0) {
        formulaMS = '';
      } else {
        const parts = devoirs.map((e, i) => {
          const cell = `${colLetter(colMI + 1 + i)}${excelRow}`;
          return `(${cell}/${e.maxScore}*20*${e.coefficient})`;
        });
        const totalCoef = devoirs.reduce((s, e) => s + e.coefficient, 0);
        formulaMS = `=IFERROR(ROUND((${parts.join('+')})/IF(${parts.map((_, i) => `ISNUMBER(${colLetter(colMI + 1 + i)}${excelRow})`).join('+')}=0,1,${totalCoef}),2),"-")`;
      }

      // Formule MC : pondération interroWeight / devoirWeight
      const { interroWeight, devoirWeight } = unit.rules;
      const totalWeight = interroWeight + devoirWeight;
      let formulaMC: string;
      const miCell = `${colLetter(colMI)}${excelRow}`;
      const msCell = `${colLetter(colMS)}${excelRow}`;
      if (interros.length === 0 && devoirs.length === 0) {
        formulaMC = '';
      } else if (interros.length === 0) {
        formulaMC = `=IFERROR(${msCell},"-")`;
      } else if (devoirs.length === 0) {
        formulaMC = `=IFERROR(${miCell},"-")`;
      } else {
        formulaMC = `=IFERROR(ROUND((${miCell}*${interroWeight}+${msCell}*${devoirWeight})/${totalWeight},2),"-")`;
      }

      // Rang (valeur calculée — on garde la valeur car RANK() nécessiterait une plage fixe)
      const ranking = studentRankings[student.id];
      const rangVal = ranking ? (ranking.isExAequo ? `${ranking.rank} ex` : ranking.rank.toString()) : '-';

      return [
        student.lastName,
        student.firstName,
        ...iCols,
        formulaMI,
        ...dCols,
        formulaMS,
        formulaMC,
        rangVal
      ];
    });

    // ── Construire la feuille ─────────────────────────────────────────────────
    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

    // Activer les formules (xlsx-js-style ou SheetJS standard)
    // SheetJS lit les formules si la cellule commence par '='
    // On doit re-typer les cellules de formule
    const totalRows = students.length;
    for (let r = 0; r < totalRows; r++) {
      const excelRow = r + 2;
      // MI
      const miAddr = `${colLetter(colMI)}${excelRow}`;
      if (ws[miAddr] && typeof ws[miAddr].v === 'string' && ws[miAddr].v.startsWith('=')) {
        ws[miAddr] = { t: 'n', f: ws[miAddr].v.slice(1), v: 0 };
      }
      // MS
      const msAddr = `${colLetter(colMS)}${excelRow}`;
      if (ws[msAddr] && typeof ws[msAddr].v === 'string' && ws[msAddr].v.startsWith('=')) {
        ws[msAddr] = { t: 'n', f: ws[msAddr].v.slice(1), v: 0 };
      }
      // MC
      const mcAddr = `${colLetter(colMC)}${excelRow}`;
      if (ws[mcAddr] && typeof ws[mcAddr].v === 'string' && ws[mcAddr].v.startsWith('=')) {
        ws[mcAddr] = { t: 'n', f: ws[mcAddr].v.slice(1), v: 0 };
      }
    }

    // ── Largeurs de colonnes ──────────────────────────────────────────────────
    ws['!cols'] = [
      { wch: 20 }, // Nom
      { wch: 16 }, // Prénom
      ...interros.map(() => ({ wch: 10 })),
      { wch: 10 }, // MI
      ...devoirs.map(() => ({ wch: 10 })),
      { wch: 10 }, // MS
      { wch: 10 }, // MC
      { wch: 8 },  // Rang
    ];

    // ── Mise en forme (nécessite xlsx-style ou SheetJS Pro — on utilise le style basique) ──
    // SheetJS open source ne supporte pas les styles natifs, mais on peut ajouter
    // des métadonnées de style si xlsx-js-style est disponible.
    // Ici on utilise l'approche standard : les formules suffisent pour l'interactivité.

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, period.name);

    const fileName = `${classroom.name}_${unit.name}_${period.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: 'Export réussi ✨',
      description: `Bulletin Excel avec formules exporté pour ${students.length} élève(s).`
    });
  }, [activePeriod, periods, classRooms, unit, students, interros, devoirs, getGrade, studentRankings, toast]);

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

  const renderGradeCell = useCallback((student: Student, evaluation: Evaluation, _studentIndex: number) => {
    const grade = getGrade(student.id, evaluation.id);
    const isEditing = editingStudent === student.id;
    const alreadyModified = grade?.history && grade.history.length > 0;
    const key = `${student.id}-${evaluation.id}`;
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
  }, [getGrade, editingStudent, isNewEvaluation, isSaved, localGrades, registerRef, handleLocalGradeInput, handleKeyDown, handleModifyGrade]);

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
                      <th key={e.id} className="px-1 text-center py-4">
                        <div className="text-[10px] font-medium uppercase text-soft-blue-foreground">{e.name}</div>
                        <div className="text-[8px] font-medium text-muted-foreground mt-0.5 opacity-50">/{e.maxScore}</div>
                      </th>
                    ))}
                    <th className="px-2 text-center text-[10px] font-medium text-soft-orange-foreground uppercase bg-orange-50/80 dark:bg-soft-orange rounded-t-xl py-4">MI</th>
                    {devoirs.map(e => (
                      <th key={e.id} className="px-1 text-center py-4">
                        <div className="text-[10px] font-medium uppercase text-soft-pink-foreground">{e.name}</div>
                        <div className="text-[8px] font-medium text-muted-foreground mt-0.5 opacity-60">/{e.maxScore}</div>
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
                    const moyInt  = avgs?.mi  ?? null;
                    const moyDev  = avgs?.ms  ?? null;
                    const final_  = avgs?.mc  ?? null;
                    const rank    = studentRankings[student.id];

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
                        {/* Magic Shell : bouton toujours visible */}
                        <td className="px-2 text-center">
                           <Button
                             variant="ghost"
                             size="icon"
                             className="h-8 w-8 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/10 transition-all"
                             onClick={() => {
                               setSelectedStudentForShare(student);
                               setShowShareDialog(true);
                             }}
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

      {/* Bulletin Preview Dialog */}
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
          classStudents={getStudentsByClass(unit.classRoomId)}
        />
      )}
    </div>
  );
};

export default GradeSheet;
