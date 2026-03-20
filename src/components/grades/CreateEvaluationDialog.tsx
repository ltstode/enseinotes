import React, { useState, useEffect, useMemo } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ClipboardList, 
  FileText, 
  HelpCircle, 
  Calendar as CalendarIcon, 
  Lock, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Calculator,
  CheckCircle2
} from 'lucide-react';
import { EvaluationType } from '@/types/enseinotes';
import { cn } from '@/lib/utils';

interface CreateEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  preselectedPeriodId?: string;
}

const CreateEvaluationDialog: React.FC<CreateEvaluationDialogProps> = ({ 
  open, 
  onOpenChange, 
  unitId,
  preselectedPeriodId 
}) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [type, setType] = useState<EvaluationType>('interro');
  const [coefficient, setCoefficient] = useState('1');
  const [maxScore, setMaxScore] = useState('20');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [evalDate, setEvalDate] = useState<Date>(new Date());
  
  const { addEvaluation, getPeriodsByUnit, getEvaluationsByPeriod, schoolYears, pedagogicalUnits } = useApp();
  const { toast } = useToast();

  const periods = getPeriodsByUnit(unitId);
  const activePeriods = periods.filter(p => p.status === 'active');
  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

  // Compute school year date range from year name (e.g. "2024-2025" → Sept 2024 – Jul 2025)
  const yearRange = useMemo(() => {
    const currentUnit = pedagogicalUnits.find(u => u.id === unitId);
    const year = schoolYears.find(y => y.id === currentUnit?.schoolYearId);
    if (!year) return { from: undefined, to: undefined };

    // If explicit dates exist, use them
    if (year.startDate && year.endDate) {
      return { from: new Date(year.startDate), to: new Date(year.endDate) };
    }

    // Otherwise parse from name "YYYY-YYYY"
    const match = year.name.match(/(\d{4})\s*[-–]\s*(\d{4})/);
    if (match) {
      return {
        from: new Date(parseInt(match[1]), 8, 1),  // 1er septembre
        to: new Date(parseInt(match[2]), 6, 31),    // 31 juillet
      };
    }
    return { from: undefined, to: undefined };
  }, [unitId, pedagogicalUnits, schoolYears]);

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;

    setStep(0);
    setName('');
    setType('interro');
    setCoefficient('1');
    setMaxScore('20');
    setEvalDate(new Date());

    const initialPeriod = 
      (preselectedPeriodId && activePeriods.find(p => p.id === preselectedPeriodId)) ||
      activePeriods[0];

    setSelectedPeriodId(initialPeriod?.id || '');

    setTimeout(() => {
      const firstInput = document.querySelector('[data-first-focus]') as HTMLElement;
      if (firstInput) firstInput.focus();
    }, 100);
  }, [open, preselectedPeriodId, unitId, activePeriods.length]);

  // Auto-naming logic
  useEffect(() => {
    if (open && selectedPeriodId && step === 0) {
      const pEvals = getEvaluationsByPeriod(selectedPeriodId);
      const count = pEvals.filter(e => e.type === type).length;
      const label = type === 'interro' ? 'Interro' : 'Devoir';
      setName(`${label} ${count + 1}`);
    }
  }, [type, selectedPeriodId, open, getEvaluationsByPeriod]);

  const handleSubmit = () => {
    if (!selectedPeriodId || !name.trim()) return;

    addEvaluation({
      name: name.trim(),
      pedagogicalUnitId: unitId,
      periodId: selectedPeriodId,
      type,
      coefficient: parseFloat(coefficient) || 1,
      maxScore: parseFloat(maxScore) || 20,
      date: new Date(),
    });

    toast({
      title: 'Évaluation créée ✨',
      description: `${type === 'interro' ? 'L\'interrogation' : 'Le devoir'} "${name}" a été ajouté.`,
    });

    onOpenChange(false);
  };

  if (activePeriods.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[460px] rounded-3xl border-none shadow-2xl overflow-hidden p-0">
          <div className="h-1.5 w-full bg-destructive/50" />
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center gap-4">
               <div className="p-4 rounded-3xl bg-destructive/10 text-destructive">
                <Lock size={40} />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-xl font-semibold tracking-tight">Période verrouillée</DialogTitle>
                <p className="text-muted-foreground">Aucune période n'est actuellement active pour cette unité.</p>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground/80 leading-relaxed bg-muted/30 p-4 rounded-2xl">
              Vous devez d'abord activer une période (Semestre ou Trimestre) depuis la feuille de notes pour pouvoir ajouter des évaluations.
            </p>
            <Button variant="outline" className="w-full h-12 rounded-2xl font-medium border-muted-foreground/10" onClick={() => onOpenChange(false)}>
              Compris, je vais faire ça
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const steps = [
    { title: "Type & Période", icon: <ClipboardList size={18} /> },
    { title: "Nomination", icon: <Sparkles size={18} /> },
    { title: "Paramètres", icon: <Calculator size={18} /> }
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
                   <h3 className="text-primary/40 text-[10px] font-medium uppercase tracking-wide leading-none mb-1">Étape {step + 1}/{steps.length}</h3>
                   <h2 className="text-lg font-semibold tracking-tight text-foreground leading-none">{steps[step].title}</h2>
                </div>
             </div>
             {step > 0 && (
               <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => setStep(step - 1)}>
                  <ChevronLeft size={20} />
               </Button>
             )}
          </div>

          {/* Step 1: Type & Period */}
          {step === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="space-y-3">
                <Label className="text-sm font-medium ml-1 text-muted-foreground">Type d'évaluation</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setType('interro')}
                    className={cn(
                      "group p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden",
                      type === 'interro' 
                        ? "border-primary bg-primary/5 shadow-inner" 
                        : "border-secondary/50 hover:border-primary/30 bg-secondary/10"
                    )}
                  >
                    <div className={cn("p-3 rounded-2xl transition-colors", type === 'interro' ? "bg-primary text-white" : "bg-white text-muted-foreground")}>
                      <HelpCircle size={24} />
                    </div>
                    <div className="text-center">
                      <p className={cn("font-medium text-sm", type === 'interro' ? "text-primary" : "text-muted-foreground")}>Interro</p>
                      <p className="text-[10px] uppercase font-medium opacity-50">Test Rapide</p>
                    </div>
                    {type === 'interro' && <CheckCircle2 size={16} className="absolute top-3 right-3 text-primary" />}
                  </button>

                  <button
                    onClick={() => setType('devoir')}
                    className={cn(
                      "group p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden",
                      type === 'devoir' 
                        ? "border-primary bg-primary/5 shadow-inner" 
                        : "border-secondary/50 hover:border-primary/30 bg-secondary/10"
                    )}
                  >
                    <div className={cn("p-3 rounded-2xl transition-colors", type === 'devoir' ? "bg-primary text-white" : "bg-white text-muted-foreground")}>
                      <FileText size={24} />
                    </div>
                    <div className="text-center">
                      <p className={cn("font-medium text-sm", type === 'devoir' ? "text-primary" : "text-muted-foreground")}>Devoir</p>
                      <p className="text-[10px] uppercase font-medium opacity-50">Éval. Complète</p>
                    </div>
                    {type === 'devoir' && <CheckCircle2 size={16} className="absolute top-3 right-3 text-primary" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium ml-1 text-muted-foreground">Période cible</Label>
                <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                  <SelectTrigger className="h-14 rounded-2xl bg-secondary/20 border-none shadow-inner font-medium text-primary">
                    <SelectValue placeholder="Sélectionnez une période" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    {activePeriods.map(period => (
                      <SelectItem key={period.id} value={period.id} className="rounded-xl my-1 focus:bg-primary/10">
                        {period.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Name */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">Nous avons suggéré ce nom pour vous :</p>
                  </div>
                  <div className="relative">
                    <Input
                      id="eval-name-input"
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-20 text-center text-2xl font-semibold rounded-3xl bg-primary/5 border-primary/20 text-primary shadow-inner"
                    />
                    <Sparkles size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/30" />
                  </div>
                  <p className="text-center text-[10px] font-medium uppercase text-muted-foreground tracking-wide px-8">
                    Vous pouvez le modifier si vous préférez un titre personnalisé.
                  </p>
               </div>
            </div>
          )}

          {/* Step 3: Parameters */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground ml-1">Note Max</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={maxScore}
                      onChange={(e) => setMaxScore(e.target.value)}
                      className="h-16 rounded-2xl bg-secondary/10 border-none text-center text-xl font-semibold shadow-inner"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 font-medium">/</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground ml-1">Coefficient</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.5"
                      value={coefficient}
                      onChange={(e) => setCoefficient(e.target.value)}
                      className="h-16 rounded-2xl bg-secondary/10 border-none text-center text-xl font-semibold shadow-inner"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 font-medium">x</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex gap-4">
                 <div className="p-2 rounded-xl bg-white shadow-sm self-start">
                    <Calculator className="text-primary" size={20} />
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-medium text-primary">Récapitulatif</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                       Cette évaluation de type <b>{type}</b> sera notée sur <b>{maxScore}</b> avec un coefficient de <b>{coefficient}</b>. Elle impactera la moyenne du <b>{selectedPeriod?.name}</b>.
                    </p>
                 </div>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex gap-3 pt-4">
            {step < steps.length - 1 ? (
              <Button 
                className="w-full h-14 rounded-2xl text-lg font-semibold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-2"
                onClick={() => setStep(step + 1)}
              >
                Continuer
                <ChevronRight size={20} />
              </Button>
            ) : (
              <Button 
                className="w-full h-14 rounded-2xl text-lg font-semibold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-2"
                onClick={handleSubmit}
              >
                Créer l'évaluation
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

export default CreateEvaluationDialog;
