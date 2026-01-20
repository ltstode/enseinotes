import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  School, 
  Settings2, 
  Calculator, 
  CalendarDays, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedClassId?: string;
}

const CreateUnitDialog: React.FC<CreateUnitDialogProps> = ({ 
  open, 
  onOpenChange,
  preselectedClassId 
}) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [classRoomId, setClassRoomId] = useState('');
  const [periodSystem, setPeriodSystem] = useState<'semester' | 'trimester'>('semester');
  const [interroWeight, setInterroWeight] = useState('1');
  const [devoirWeight, setDevoirWeight] = useState('2');
  const [coefficient, setCoefficient] = useState('1');
  
  const { addPedagogicalUnit, getClassesByYear, activeYearId } = useApp();
  const { toast } = useToast();

  const classes = activeYearId ? getClassesByYear(activeYearId) : [];

  useEffect(() => {
    if (open) {
      setStep(0);
      setName('');
      const initialClassId = preselectedClassId || (classes[0]?.id || '');
      setClassRoomId(initialClassId);
      setPeriodSystem('semester');
      setInterroWeight('1');
      setDevoirWeight('2');
      setCoefficient('1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedClassId]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: 'Erreur', description: "Veuillez saisir le nom de l'unité", variant: 'destructive' });
      return;
    }
    if (!classRoomId) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner une classe', variant: 'destructive' });
      return;
    }

    addPedagogicalUnit({
      name: name.trim(),
      classRoomId,
      schoolYearId: activeYearId!,
      periodSystem,
      rules: {
        coefficient: parseFloat(coefficient) || 1,
        coefficientEnabled: true,
        expectedInterros: 0,
        expectedDevoirs: periodSystem === 'semester' ? 2 : 3,
        formula: 'weighted',
        displayMode: 'numeric',
        interroWeight: parseFloat(interroWeight) || 1,
        devoirWeight: parseFloat(devoirWeight) || 2,
      },
    });

    toast({
      title: 'Unité créée ✨',
      description: `L'unité "${name}" a été ajoutée avec succès.`,
    });

    onOpenChange(false);
  };

  const steps = [
    { title: "Matière & Classe", icon: <BookOpen size={18} /> },
    { title: "Périodes & Coefficient", icon: <CalendarDays size={18} /> },
    { title: "Pondération", icon: <Calculator size={18} /> }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
        {/* Progress Bar */}
        <div className="flex w-full h-1.5 bg-secondary/30">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                   {steps[step].icon}
                </div>
                <div>
                   <h3 className="text-xl font-black tracking-tight uppercase text-primary/40 text-[10px] leading-none mb-1">Étape {step + 1}/{steps.length}</h3>
                   <h2 className="text-lg font-bold tracking-tight text-foreground leading-none">{steps[step].title}</h2>
                </div>
             </div>
             {step > 0 && (
               <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => setStep(step - 1)}>
                  <ChevronLeft size={20} />
               </Button>
             )}
          </div>

          {/* Step 1: Identity */}
          {step === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="space-y-3">
                <Label className="text-sm font-bold ml-1 text-muted-foreground">Nom de la matière</Label>
                <div className="relative">
                  <Input
                    autoFocus
                    placeholder="Ex: Français, Mathématiques..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-14 rounded-2xl bg-secondary/10 border-none shadow-inner font-bold text-lg"
                  />
                  <Sparkles size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30" />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold ml-1 text-muted-foreground">Classe concernée</Label>
                <Select value={classRoomId} onValueChange={setClassRoomId}>
                  <SelectTrigger className="h-14 rounded-2xl bg-secondary/10 border-none shadow-inner font-bold text-primary">
                    <SelectValue placeholder="Sélectionnez une classe" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id} className="rounded-xl my-1">
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Period & Coef */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-3">
                <Label className="text-sm font-bold ml-1 text-muted-foreground">Système de périodes</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPeriodSystem('semester')}
                    className={cn(
                      "p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2",
                      periodSystem === 'semester' ? "border-primary bg-primary/5" : "border-secondary/50 bg-secondary/10"
                    )}
                  >
                    <CalendarDays className={periodSystem === 'semester' ? "text-primary" : "text-muted-foreground"} size={24} />
                    <p className={cn("font-bold text-xs", periodSystem === 'semester' ? "text-primary" : "text-muted-foreground")}>Semestres</p>
                  </button>
                  <button
                    onClick={() => setPeriodSystem('trimester')}
                    className={cn(
                      "p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2",
                      periodSystem === 'trimester' ? "border-primary bg-primary/5" : "border-secondary/50 bg-secondary/10"
                    )}
                  >
                    <GraduationCap className={periodSystem === 'trimester' ? "text-primary" : "text-muted-foreground"} size={24} />
                    <p className={cn("font-bold text-xs", periodSystem === 'trimester' ? "text-primary" : "text-muted-foreground")}>Trimestres</p>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold ml-1 text-muted-foreground">Coefficient global</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.5"
                    value={coefficient}
                    onChange={(e) => setCoefficient(e.target.value)}
                    className="h-14 rounded-2xl bg-secondary/10 border-none shadow-inner font-black text-center text-xl"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white shadow-sm">
                    <Sparkles size={14} className="text-primary" />
                  </div>
                </div>
                <p className="text-[10px] text-center text-muted-foreground font-medium px-4">
                  Ce poids sera utilisé pour calculer la moyenne générale de l'élève.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Weights */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                 <Label className="text-sm font-bold ml-1 text-muted-foreground">Poids des évaluations internes</Label>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 text-center">
                       <Label className="text-[10px] uppercase font-black text-muted-foreground/50">Interro</Label>
                       <Input
                         type="number"
                         value={interroWeight}
                         onChange={(e) => setInterroWeight(e.target.value)}
                         className="h-16 rounded-2xl bg-secondary/10 border-none text-center font-black text-xl shadow-inner"
                       />
                    </div>
                    <div className="space-y-2 text-center">
                       <Label className="text-[10px] uppercase font-black text-muted-foreground/50">Devoir</Label>
                       <Input
                         type="number"
                         value={devoirWeight}
                         onChange={(e) => setDevoirWeight(e.target.value)}
                         className="h-16 rounded-2xl bg-secondary/10 border-none text-center font-black text-xl shadow-inner"
                       />
                    </div>
                 </div>
              </div>

              <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 text-center">
                 <p className="text-xs font-bold text-primary mb-1">Moyenne de la période</p>
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Les interros comptent pour <b>{interroWeight}</b> et les devoirs pour <b>{devoirWeight}</b>.<br/>
                    Formule : <i>(Interros × {interroWeight} + Devoirs × {devoirWeight}) / {parseFloat(interroWeight) + parseFloat(devoirWeight)}</i>
                 </p>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex gap-3 pt-4">
            {step < steps.length - 1 ? (
              <Button 
                className="w-full h-14 rounded-2xl text-lg font-black bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-2"
                onClick={() => setStep(step + 1)}
              >
                Continuer
                <ChevronRight size={20} />
              </Button>
            ) : (
              <Button 
                className="w-full h-14 rounded-2xl text-lg font-black bg-gradient-to-r from-primary to-info text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-2"
                onClick={handleSubmit}
              >
                Créer l'unité
                <CheckCircle2 size={20} />
              </Button>
            )}
          </div>
          
          {/* Progress Dots */}
          <div className="flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  step === i ? "w-6 bg-primary" : "w-1.5 bg-secondary"
                )} 
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUnitDialog;
