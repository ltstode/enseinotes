import React, { useState } from 'react';
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
import { Plus, History, Lock, AlertCircle } from 'lucide-react';
import { PedagogicalUnit, Student, Evaluation } from '@/types/enseinotes';
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
    calculateAverage 
  } = useApp();
  
  const { toast } = useToast();
  const students = getStudentsByClass(unit.classRoomId);
  const evaluations = getEvaluationsByUnit(unit.id);
  
  const [showEvalDialog, setShowEvalDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<{
    gradeId: string;
    studentName: string;
    currentValue: number;
    evalName: string;
  } | null>(null);
  const [modifyReason, setModifyReason] = useState('');
  const [newGradeValue, setNewGradeValue] = useState('');

  const getGrade = (studentId: string, evaluationId: string) => {
    return grades.find(g => g.studentId === studentId && g.evaluationId === evaluationId);
  };

  const handleGradeInput = (studentId: string, evaluationId: string, value: string) => {
    const numValue = parseFloat(value);
    const evaluation = evaluations.find(e => e.id === evaluationId);
    
    if (isNaN(numValue) || numValue < 0 || (evaluation && numValue > evaluation.maxScore)) {
      return;
    }

    const existingGrade = getGrade(studentId, evaluationId);
    
    if (existingGrade) {
      if (existingGrade.isLocked) {
        toast({
          title: 'Note verrouillée',
          description: 'Cette note a déjà été modifiée et ne peut plus être changée',
          variant: 'destructive',
        });
        return;
      }
      
      const student = students.find(s => s.id === studentId);
      setSelectedGrade({
        gradeId: existingGrade.id,
        studentName: `${student?.lastName} ${student?.firstName}`,
        currentValue: existingGrade.value,
        evalName: evaluation?.name || '',
      });
      setNewGradeValue(value);
      setShowModifyDialog(true);
    } else {
      addGrade({
        studentId,
        evaluationId,
        value: numValue,
      });
    }
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
      description: 'La modification a été enregistrée et verrouillée',
    });

    setShowModifyDialog(false);
    setSelectedGrade(null);
    setModifyReason('');
    setNewGradeValue('');
  };

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto text-muted-foreground mb-4" size={48} />
          <h3 className="font-display text-h3 mb-2">Aucun élève</h3>
          <p className="text-muted-foreground">
            La classe associée à cette unité n'a pas encore d'élèves.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{unit.name}</CardTitle>
            <p className="text-small text-muted-foreground mt-1">
              {students.length} élèves · {evaluations.length} évaluations
            </p>
          </div>
          <Button onClick={() => setShowEvalDialog(true)}>
            <Plus size={18} />
            Nouvelle évaluation
          </Button>
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
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-display font-semibold bg-secondary/30 sticky left-0">
                      Élève
                    </th>
                    {evaluations.map((evaluation) => (
                      <th key={evaluation.id} className="p-3 text-center min-w-[100px] bg-secondary/30">
                        <div className="font-display font-semibold">{evaluation.name}</div>
                        <div className="text-small text-muted-foreground font-normal">
                          /{evaluation.maxScore} (coef. {evaluation.coefficient})
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-center min-w-[80px] bg-primary/10">
                      <div className="font-display font-semibold">Moyenne</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const average = calculateAverage(student.id, unit.id);
                    return (
                      <tr 
                        key={student.id} 
                        className="border-b hover:bg-secondary/20 transition-colors"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="p-3 font-medium sticky left-0 bg-card">
                          {student.lastName} {student.firstName}
                        </td>
                        {evaluations.map((evaluation) => {
                          const grade = getGrade(student.id, evaluation.id);
                          return (
                            <td key={evaluation.id} className="p-2 text-center">
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  max={evaluation.maxScore}
                                  step="0.5"
                                  value={grade?.value ?? ''}
                                  onChange={(e) => handleGradeInput(student.id, evaluation.id, e.target.value)}
                                  className={`w-20 mx-auto text-center ${
                                    grade?.isLocked ? 'bg-muted cursor-not-allowed' : ''
                                  }`}
                                  disabled={grade?.isLocked}
                                />
                                {grade?.isLocked && (
                                  <Lock 
                                    size={12} 
                                    className="absolute -top-1 -right-1 text-warning"
                                  />
                                )}
                                {grade?.history && grade.history.length > 0 && (
                                  <span title={`Modifié: ${grade.history[0].reason}`}>
                                    <History 
                                      size={12} 
                                      className="absolute -bottom-1 -right-1 text-info cursor-pointer"
                                    />
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-3 text-center">
                          <span className={`font-display font-bold text-lg ${
                            average !== null && average >= 10 ? 'text-success' : 
                            average !== null ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            {average !== null ? average.toFixed(2) : '-'}
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
                ⚠️ Attention : Cette modification sera définitive et la note sera verrouillée.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motif de modification (obligatoire)</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Erreur de saisie, recalcul après vérification..."
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
