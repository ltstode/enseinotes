import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Edit3, Check, RotateCcw } from 'lucide-react';
import { Student, Evaluation, Grade, Period, PedagogicalUnit, ClassRoom, SchoolYear } from '@/types/enseinotes';
import { generateClassBulletins } from '@/services/pdfService';
import { cn } from '@/lib/utils';

interface BulletinPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  evaluations: Evaluation[];
  grades: Grade[];
  unit: PedagogicalUnit;
  classroom: ClassRoom;
  schoolYear: SchoolYear;
  period: Period;
  teacherName: string;
  calculateTypeAverage: (studentId: string, evals: Evaluation[]) => number | null;
  calculateFinalAverage: (studentId: string) => number | null;
  studentRankings: Record<string, number | null>;
}

// Helper to get default appreciation based on grade
const getDefaultAppreciation = (average: number | null): string => {
  if (average === null) return 'Non évaluable';
  if (average >= 18) return 'Excellent travail, félicitations !';
  if (average >= 16) return 'Très bon travail, continuez ainsi.';
  if (average >= 14) return 'Bon travail, ensemble satisfaisant.';
  if (average >= 12) return 'Travail assez bon, quelques efforts à fournir.';
  if (average >= 10) return 'Travail passable, des progrès à réaliser.';
  if (average >= 8) return 'Travail insuffisant, efforts nécessaires.';
  return 'Travail très insuffisant, un sursaut est attendu.';
};

const BulletinPreviewDialog: React.FC<BulletinPreviewDialogProps> = ({
  open,
  onOpenChange,
  students,
  evaluations,
  grades,
  unit,
  classroom,
  schoolYear,
  period,
  teacherName,
  calculateTypeAverage,
  calculateFinalAverage,
  studentRankings,
}) => {
  const [appreciations, setAppreciations] = useState<Record<string, string>>({});
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const studentsWithAverages = useMemo(() => {
    return students.map(student => ({
      student,
      average: calculateFinalAverage(student.id),
      rank: studentRankings[student.id],
    })).sort((a, b) => {
      if (a.rank === null && b.rank === null) return 0;
      if (a.rank === null) return 1;
      if (b.rank === null) return -1;
      return a.rank - b.rank;
    });
  }, [students, calculateFinalAverage, studentRankings]);

  const getAppreciation = (studentId: string, average: number | null) => {
    return appreciations[studentId] ?? getDefaultAppreciation(average);
  };

  const handleAppreciationChange = (studentId: string, value: string) => {
    setAppreciations(prev => ({ ...prev, [studentId]: value }));
  };

  const resetAppreciation = (studentId: string, average: number | null) => {
    setAppreciations(prev => {
      const newState = { ...prev };
      delete newState[studentId];
      return newState;
    });
  };

  const handleExport = () => {
    generateClassBulletins(
      students,
      evaluations,
      grades,
      { unit, classroom, schoolYear, period, teacherName },
      calculateTypeAverage,
      calculateFinalAverage,
      studentRankings,
      appreciations
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] rounded-3xl border-none shadow-2xl overflow-hidden p-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Edit3 size={20} className="text-primary" />
            Personnaliser les appréciations
          </DialogTitle>
          <DialogDescription>
            Modifiez les appréciations avant l'export. {students.length} élèves — {period.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[50vh] px-6 py-4">
          <div className="space-y-3">
            {studentsWithAverages.map(({ student, average, rank }) => {
              const isEditing = editingStudentId === student.id;
              const currentAppreciation = getAppreciation(student.id, average);
              const isCustom = student.id in appreciations;

              return (
                <div
                  key={student.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all",
                    isEditing ? "bg-card border-primary/30 shadow-md" : "bg-muted/20 border-border/20 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-semibold",
                          rank && rank <= 3 ? "bg-soft-orange text-soft-orange-foreground" : "bg-muted/30 text-muted-foreground"
                        )}>
                          {rank || '-'}
                        </div>
                        <span className="font-medium text-sm truncate">
                          {student.lastName} {student.firstName}
                        </span>
                        <div className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                          average && average >= 10 ? "bg-soft-green text-soft-green-foreground" : "bg-soft-pink text-soft-pink-foreground"
                        )}>
                          {average?.toFixed(2) ?? '--'}/20
                        </div>
                        {isCustom && (
                          <span className="text-[9px] uppercase tracking-wide text-primary font-medium">Personnalisé</span>
                        )}
                      </div>

                      {isEditing ? (
                        <Textarea
                          value={currentAppreciation}
                          onChange={(e) => handleAppreciationChange(student.id, e.target.value)}
                          className="text-xs min-h-[60px] rounded-xl border-border/30 bg-background"
                          placeholder="Saisissez une appréciation..."
                          autoFocus
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground italic pl-10">
                          {currentAppreciation}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => resetAppreciation(student.id, average)}
                            title="Réinitialiser"
                          >
                            <RotateCcw size={14} className="text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-success"
                            onClick={() => setEditingStudentId(null)}
                          >
                            <Check size={14} />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => setEditingStudentId(student.id)}
                        >
                          <Edit3 size={14} className="text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t border-border/20 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
            Annuler
          </Button>
          <Button onClick={handleExport} className="rounded-xl bg-primary px-6 gap-2 shadow-lg shadow-primary/20">
            <Download size={16} />
            Exporter {students.length} bulletins
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulletinPreviewDialog;
