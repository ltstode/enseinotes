import React, { useState, useRef, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, History, Lock, AlertCircle, HelpCircle, FileText, Save, Pencil, Check, X } from 'lucide-react';
import { PedagogicalUnit, Student, Evaluation, EvaluationType } from '@/types/enseinotes';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import CreateEvaluationDialog from './CreateEvaluationDialog';

interface GradeSheetProps {
  unit: PedagogicalUnit;
}

const GradeSheet: React.FC<GradeSheetProps> = ({ unit }) => {
  const { 
    getStudentsByClass, 
    getEvaluationsByUnit, 
    grades, 
    addGrade,
    updateGrade,
    updateGradeValue,
    saveGrades,
    isUnitSaved,
  } = useApp();
  
  const { toast } = useToast();
  const students = getStudentsByClass(unit.classRoomId).filter(s => s.status === 'active');
  const evaluations = getEvaluationsByUnit(unit.id);
  const isSaved = isUnitSaved(unit.id);
  
  const interros = evaluations.filter(e => e.type === 'interro');
  const devoirs = evaluations.filter(e => e.type === 'devoir');
  
  const [showEvalDialog, setShowEvalDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<{
    gradeId: string;
    studentName: string;
    currentValue: number;
    evalName: string;
  } | null>(null);
  const [modifyReason, setModifyReason] = useState('');
  const [newGradeValue, setNewGradeValue] = useState('');
  const [localGrades, setLocalGrades] = useState<Map<string, number>>(new Map());
  
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const getGrade = (studentId: string, evaluationId: string) => {
    return grades.find(g => g.studentId === studentId && g.evaluationId === evaluationId);
  };

  const getLocalGradeValue = (studentId: string, evaluationId: string): string => {
    const key = `${studentId}-${evaluationId}`;
    if (localGrades.has(key)) {
      return localGrades.get(key)!.toString();
    }
    const grade = getGrade(studentId, evaluationId);
    return grade?.value?.toString() ?? '';
  };

  // Calculate average for a specific type of evaluation
  const calculateTypeAverage = (studentId: string, evals: Evaluation[]): number | null => {
    const studentGrades = evals
      .map(e => {
        const grade = getGrade(studentId, e.id);
        const key = `${studentId}-${e.id}`;
        const localValue = localGrades.get(key);
        const value = localValue !== undefined ? localValue : grade?.value;
        return value !== undefined ? { value, evaluation: e } : null;
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
  };

  // Calculate final average using the unit's formula
  const calculateFinalAverage = (studentId: string): number | null => {
    const moyInterros = calculateTypeAverage(studentId, interros);
    const moyDevoirs = calculateTypeAverage(studentId, devoirs);

    if (moyInterros === null && moyDevoirs === null) return null;

    const { interroWeight, devoirWeight } = unit.rules;

    // Handle cases where only one type has grades
    if (moyInterros !== null && moyDevoirs === null) return moyInterros;
    if (moyDevoirs !== null && moyInterros === null) return moyDevoirs;

    // Apply formula
    const totalWeight = interroWeight + devoirWeight;
    const weighted = (moyInterros! * interroWeight + moyDevoirs! * devoirWeight) / totalWeight;
    
    return Math.round(weighted * 100) / 100;
  };

  const handleLocalGradeInput = (studentId: string, evaluationId: string, value: string) => {
    const evaluation = evaluations.find(e => e.id === evaluationId);
    
    if (value === '') {
      const key = `${studentId}-${evaluationId}`;
      setLocalGrades(prev => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
      return;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || (evaluation && numValue > evaluation.maxScore)) {
      return;
    }

    const key = `${studentId}-${evaluationId}`;
    setLocalGrades(prev => new Map(prev).set(key, numValue));
  };

  const handleSaveGrades = () => {
    // Save all local grades to the context
    localGrades.forEach((value, key) => {
      const [studentId, evaluationId] = key.split('-');
      const existingGrade = getGrade(studentId, evaluationId);
      
      if (existingGrade) {
        updateGradeValue(existingGrade.id, value);
      } else {
        addGrade({
          studentId,
          evaluationId,
          value,
        });
      }
    });

    // Lock all grades for this unit
    saveGrades(unit.id);
    setLocalGrades(new Map());
    
    toast({
      title: 'Notes enregistrées',
      description: 'Toutes les notes ont été sauvegardées et verrouillées',
    });
  };

  const handleEditStudent = (studentId: string) => {
    setEditingStudent(studentId);
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
  };

  const handleModifyGrade = (studentId: string, evaluationId: string, newValue: string) => {
    const existingGrade = getGrade(studentId, evaluationId);
    const evaluation = evaluations.find(e => e.id === evaluationId);
    const student = students.find(s => s.id === studentId);
    
    if (!existingGrade || !evaluation || !student) return;
    
    // Check if already modified
    if (existingGrade.history.length > 0) {
      toast({
        title: 'Note verrouillée',
        description: 'Cette note a déjà été modifiée et ne peut plus être changée',
        variant: 'destructive',
      });
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
  };

  const handleModifyConfirm = () => {
    if (!selectedGrade || !modifyReason.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un motif de modification',
        variant: 'destructive',
      });
      return;
    }

    updateGrade(selectedGrade.gradeId, parseFloat(newGradeValue), modifyReason.trim());
    
    toast({
      title: 'Note modifiée',
      description: 'La modification a été enregistrée définitivement',
    });

    setShowModifyDialog(false);
    setSelectedGrade(null);
    setModifyReason('');
    setNewGradeValue('');
    setEditingStudent(null);
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    studentIndex: number,
    evalIndex: number,
    evalList: Evaluation[]
  ) => {
    const allEvals = [...interros, ...devoirs];
    const currentEvalId = evalList[evalIndex].id;
    const globalEvalIndex = allEvals.findIndex(ev => ev.id === currentEvalId);

    let nextStudentIndex = studentIndex;
    let nextEvalIndex = globalEvalIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'Enter':
        e.preventDefault();
        nextStudentIndex = Math.min(studentIndex + 1, students.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextStudentIndex = Math.max(studentIndex - 1, 0);
        break;
      case 'ArrowRight':
      case 'Tab':
        if (!e.shiftKey) {
          e.preventDefault();
          nextEvalIndex = Math.min(globalEvalIndex + 1, allEvals.length - 1);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextEvalIndex = Math.max(globalEvalIndex - 1, 0);
        break;
      default:
        return;
    }

    const nextEval = allEvals[nextEvalIndex];
    const nextStudent = students[nextStudentIndex];
    if (nextEval && nextStudent) {
      const key = `${nextStudent.id}-${nextEval.id}`;
      const input = inputRefs.current.get(key);
      input?.focus();
      input?.select();
    }
  }, [students, interros, devoirs]);

  const registerRef = useCallback((studentId: string, evalId: string, ref: HTMLInputElement | null) => {
    const key = `${studentId}-${evalId}`;
    if (ref) {
      inputRefs.current.set(key, ref);
    } else {
      inputRefs.current.delete(key);
    }
  }, []);

  const renderGradeCell = (student: Student, evaluation: Evaluation, studentIndex: number, evalIndex: number, evalList: Evaluation[]) => {
    const grade = getGrade(student.id, evaluation.id);
    const isEditing = editingStudent === student.id;
    const isLocked = isSaved && !isEditing;
    const canModify = isEditing && grade?.isLocked && grade.history.length === 0;
    const alreadyModified = grade?.history && grade.history.length > 0;
    
    return (
      <td key={evaluation.id} className="p-2 text-center">
        <div className="relative">
          {!isSaved ? (
            // Free editing mode - not saved yet
            <Input
              ref={(ref) => registerRef(student.id, evaluation.id, ref)}
              type="number"
              min="0"
              max={evaluation.maxScore}
              step="0.5"
              value={getLocalGradeValue(student.id, evaluation.id)}
              onChange={(e) => handleLocalGradeInput(student.id, evaluation.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, studentIndex, evalIndex, evalList)}
              className="w-16 mx-auto text-center text-small"
            />
          ) : isEditing && !alreadyModified ? (
            // Editing mode for locked grades (one-time modification)
            <Input
              ref={(ref) => registerRef(student.id, evaluation.id, ref)}
              type="number"
              min="0"
              max={evaluation.maxScore}
              step="0.5"
              defaultValue={grade?.value ?? ''}
              onBlur={(e) => {
                if (e.target.value !== grade?.value?.toString()) {
                  handleModifyGrade(student.id, evaluation.id, e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  if (target.value !== grade?.value?.toString()) {
                    handleModifyGrade(student.id, evaluation.id, target.value);
                  }
                }
              }}
              className="w-16 mx-auto text-center text-small border-warning"
            />
          ) : (
            // Display mode - locked
            <div className={`w-16 mx-auto py-2 px-3 rounded-md text-center text-small bg-muted ${
              alreadyModified ? 'ring-2 ring-warning/50' : ''
            }`}>
              {grade?.value ?? '-'}
            </div>
          )}
          {alreadyModified && (
            <span title={`Modifié: ${grade.history[0].reason}`}>
              <History 
                size={10} 
                className="absolute -bottom-1 -right-1 text-warning cursor-pointer"
              />
            </span>
          )}
        </div>
      </td>
    );
  };

  const renderAverageCell = (value: number | null, label: string) => (
    <td className="p-2 text-center bg-secondary/20">
      <span className={`font-display font-semibold text-small ${
        value !== null && value >= 10 ? 'text-success' : 
        value !== null ? 'text-destructive' : 'text-muted-foreground'
      }`}>
        {value !== null ? value.toFixed(2) : '-'}
      </span>
    </td>
  );

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto text-muted-foreground mb-4" size={48} />
          <h3 className="font-display text-h3 mb-2">Aucun élève actif</h3>
          <p className="text-muted-foreground">
            La classe associée à cette unité n'a pas encore d'élèves actifs.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check if all grades are complete
  const allGradesComplete = students.every(student =>
    evaluations.every(evaluation => {
      const key = `${student.id}-${evaluation.id}`;
      return localGrades.has(key) || getGrade(student.id, evaluation.id);
    })
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>{unit.name}</CardTitle>
            <p className="text-small text-muted-foreground mt-1">
              {students.length} élèves · {interros.length} interro(s) · {devoirs.length} devoir(s)
              {isSaved && <span className="ml-2 text-success">✓ Enregistré</span>}
            </p>
            <p className="text-small text-muted-foreground">
              Min. requis: {unit.rules.minInterros} interros, {unit.rules.minDevoirs} devoirs
            </p>
          </div>
          <div className="flex gap-2">
            {!isSaved && evaluations.length > 0 && (
              <Button 
                onClick={handleSaveGrades}
                variant="default"
                disabled={localGrades.size === 0 && grades.filter(g => 
                  evaluations.some(e => e.id === g.evaluationId)
                ).length === 0}
              >
                <Save size={18} />
                Enregistrer les notes
              </Button>
            )}
            <Button onClick={() => setShowEvalDialog(true)} variant={isSaved ? "default" : "outline"}>
              <Plus size={18} />
              Nouvelle évaluation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {evaluations.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground mb-4">
                Créez votre première évaluation pour commencer à saisir les notes
              </p>
              <Button variant="outline" onClick={() => setShowEvalDialog(true)}>
                <Plus size={18} />
                Créer une évaluation
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-small">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-display font-semibold bg-secondary/30 sticky left-0 z-10">
                      Élève
                    </th>
                    {isSaved && (
                      <th className="p-2 text-center min-w-[60px] bg-secondary/30">
                        <span className="text-xs">Actions</span>
                      </th>
                    )}
                    {/* Interrogations header */}
                    {interros.length > 0 && (
                      <>
                        {interros.map((evaluation) => (
                          <th key={evaluation.id} className="p-2 text-center min-w-[70px] bg-info/10">
                            <div className="flex items-center justify-center gap-1">
                              <HelpCircle size={12} className="text-info" />
                              <span className="font-display font-semibold text-xs">{evaluation.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-normal">
                              /{evaluation.maxScore}
                            </div>
                          </th>
                        ))}
                        <th className="p-2 text-center min-w-[70px] bg-info/20">
                          <div className="font-display font-semibold text-xs">Moy. Interros</div>
                        </th>
                      </>
                    )}
                    {/* Devoirs header */}
                    {devoirs.length > 0 && (
                      <>
                        {devoirs.map((evaluation) => (
                          <th key={evaluation.id} className="p-2 text-center min-w-[70px] bg-warning/10">
                            <div className="flex items-center justify-center gap-1">
                              <FileText size={12} className="text-warning" />
                              <span className="font-display font-semibold text-xs">{evaluation.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-normal">
                              /{evaluation.maxScore}
                            </div>
                          </th>
                        ))}
                        <th className="p-2 text-center min-w-[70px] bg-warning/20">
                          <div className="font-display font-semibold text-xs">Moy. Devoirs</div>
                        </th>
                      </>
                    )}
                    {/* Final average */}
                    <th className="p-2 text-center min-w-[80px] bg-primary/20">
                      <div className="font-display font-semibold text-xs">Moyenne</div>
                      {unit.rules.coefficientEnabled && (
                        <div className="text-xs text-muted-foreground">(coef. {unit.rules.coefficient})</div>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, studentIndex) => {
                    const moyInterros = calculateTypeAverage(student.id, interros);
                    const moyDevoirs = calculateTypeAverage(student.id, devoirs);
                    const finalAverage = calculateFinalAverage(student.id);
                    const isEditing = editingStudent === student.id;
                    
                    return (
                      <tr 
                        key={student.id} 
                        className={`border-b hover:bg-secondary/10 transition-colors ${
                          isEditing ? 'bg-warning/5' : ''
                        }`}
                      >
                        <td className="p-3 font-medium sticky left-0 bg-card z-10 text-small">
                          {student.lastName} {student.firstName}
                        </td>
                        {isSaved && (
                          <td className="p-2 text-center">
                            {isEditing ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="h-7 w-7 p-0"
                              >
                                <X size={14} />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStudent(student.id)}
                                className="h-7 w-7 p-0"
                              >
                                <Pencil size={14} />
                              </Button>
                            )}
                          </td>
                        )}
                        {/* Interro cells */}
                        {interros.map((evaluation, evalIndex) => 
                          renderGradeCell(student, evaluation, studentIndex, evalIndex, interros)
                        )}
                        {interros.length > 0 && renderAverageCell(moyInterros, 'Moy. Interros')}
                        {/* Devoir cells */}
                        {devoirs.map((evaluation, evalIndex) => 
                          renderGradeCell(student, evaluation, studentIndex, evalIndex, devoirs)
                        )}
                        {devoirs.length > 0 && renderAverageCell(moyDevoirs, 'Moy. Devoirs')}
                        {/* Final average */}
                        <td className="p-2 text-center bg-primary/10">
                          <span className={`font-display font-bold ${
                            finalAverage !== null && finalAverage >= 10 ? 'text-success' : 
                            finalAverage !== null ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            {finalAverage !== null ? finalAverage.toFixed(2) : '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateEvaluationDialog
        open={showEvalDialog}
        onOpenChange={setShowEvalDialog}
        unitId={unit.id}
      />

      <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Modifier une note</DialogTitle>
            <DialogDescription>
              {selectedGrade && (
                <>
                  Élève : <strong>{selectedGrade.studentName}</strong><br />
                  Évaluation : <strong>{selectedGrade.evalName}</strong><br />
                  Note actuelle : <strong>{selectedGrade.currentValue}</strong> → Nouvelle note : <strong>{newGradeValue}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-small text-warning font-medium">
                ⚠️ Cette note ne pourra plus être modifiée après validation.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motif de modification (obligatoire)</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Erreur de saisie, rattrapage, recalcul après vérification..."
                value={modifyReason}
                onChange={(e) => setModifyReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModifyDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleModifyConfirm} disabled={!modifyReason.trim()}>
              Confirmer la modification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GradeSheet;
