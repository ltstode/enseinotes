import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight, Check, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { SchoolYear } from '@/types/enseinotes';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
import { toast } from 'sonner';

interface YearCardProps {
  year: SchoolYear;
}

const YearCard: React.FC<YearCardProps> = ({ year }) => {
  const { 
    getClassesByYear, 
    setActiveYear, 
    activeYearId, 
    deleteSchoolYear,
    getUnitsByClass,
    getEvaluationsByUnit
  } = useApp();
  const navigate = useNavigate();
  const classes = getClassesByYear(year.id);
  const isActive = year.id === activeYearId;
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // Impact analysis
  const totalStudents = classes.reduce((sum, c) => sum + c.students.length, 0);
  const totalUnits = classes.reduce((sum, c) => sum + getUnitsByClass(c.id).length, 0);
  const totalEvals = classes.reduce((sum, c) => {
    const classUnits = getUnitsByClass(c.id);
    return sum + classUnits.reduce((acc, u) => acc + getEvaluationsByUnit(u.id).length, 0);
  }, 0);

  const handleActivate = () => {
    setActiveYear(year.id);
    toast.success(`Année ${year.name} activée ✨`);
  };

  const handleViewClasses = () => {
    setActiveYear(year.id);
    navigate('/classes');
  };

  return (
    <>
      <div className={cn(
        "group rounded-xl p-6 border transition-all duration-300 flex flex-col justify-between h-full",
        isActive 
          ? "border-primary/60 bg-card ring-2 ring-primary/10 shadow-none" 
          : "border-white/10 bg-card/60 backdrop-blur-md shadow-none hover:border-white/20"
      )}>
        <div>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3.5 rounded-2xl shadow-inner transition-colors",
                isActive ? "bg-primary text-white" : "bg-soft-orange text-soft-orange-foreground"
              )}>
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">{year.name}</h3>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-0.5">
                  Système {year.mode === 'semester' ? 'Semestriel' : 'Trimestriel'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isActive && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-medium uppercase tracking-tight border border-success/20">
                  <Check size={12} />
                  Active
                </div>
              )}
              {!isActive && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="h-8 w-8 rounded-lg hover:bg-soft-pink text-soft-pink-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="p-4 rounded-2xl bg-secondary/30 flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Classes</span>
              <p className="text-2xl font-semibold text-foreground">{classes.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-secondary/30 flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Élèves</span>
              <p className="text-2xl font-semibold text-foreground">{totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5">
          {!isActive && (
            <Button 
              variant="ghost" 
              onClick={handleActivate} 
              className="flex-1 rounded-xl h-11 font-medium hover:bg-card hover:shadow-sm"
            >
              Activer
            </Button>
          )}
          <Button 
            variant={isActive ? "default" : "secondary"} 
            onClick={handleViewClasses}
            className={cn(
              "flex-1 rounded-xl h-11 font-medium transition-all gap-2",
              isActive && "shadow-lg shadow-primary/20 hover:scale-[1.02]"
            )}
          >
            {isActive ? 'Ouvrir' : 'Explorer'}
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-[2.5rem] border border-border/60 shadow-2xl bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-semibold text-soft-pink-foreground flex items-center gap-2">
              <AlertTriangle className="text-soft-pink-foreground" />
              Supprimer l'année ?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-muted-foreground py-2 leading-relaxed">
              L'année <b>{year.name}</b> sera définitivement supprimée. 
              <br className="mb-2" />
              Cette action est irréversible et détruira TOUTES les données associées.
            </AlertDialogDescription>

            <div className="mt-2 p-4 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-3">
              <p className="text-[10px] uppercase font-bold text-destructive/60 tracking-wider flex items-center gap-2">
                <AlertCircle size={12} />
                Analyse de destruction massive
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center h-8">
                  <span className="text-muted-foreground">Classes</span>
                  <span className="font-bold text-destructive">{classes.length}</span>
                </div>
                <div className="flex justify-between items-center h-8">
                  <span className="text-muted-foreground">Élèves</span>
                  <span className="font-bold text-destructive">{totalStudents}</span>
                </div>
                <div className="flex justify-between items-center h-8 border-t border-destructive/10 pt-2">
                  <span className="text-muted-foreground">Unités pédagogiques</span>
                  <span className="font-bold text-destructive">{totalUnits}</span>
                </div>
                <div className="flex justify-between items-center h-8">
                  <span className="text-muted-foreground">Évaluations et notes</span>
                  <span className="font-bold text-destructive">{totalEvals}</span>
                </div>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl border-none bg-secondary hover:bg-secondary/70 px-6">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                deleteSchoolYear(year.id);
                setShowDeleteDialog(false);
                toast.success(`L'année ${year.name} a été pulvérisée.`);
              }}
              className="rounded-xl bg-soft-pink-foreground text-white hover:bg-soft-pink-foreground/90 shadow-lg shadow-soft-pink-foreground/20 font-bold px-8"
            >
              Oui, tout supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default YearCard;
