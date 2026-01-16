import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { ClipboardList, FileText, HelpCircle, Calendar, AlertTriangle } from 'lucide-react';
import { EvaluationType } from '@/types/enseinotes';

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
  const [name, setName] = useState('');
  const [type, setType] = useState<EvaluationType>('interro');
  const [coefficient, setCoefficient] = useState('1');
  const [maxScore, setMaxScore] = useState('20');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  
  const { addEvaluation, getPeriodsByUnit, getEvaluationsByPeriod } = useApp();
  const { toast } = useToast();

  const periods = getPeriodsByUnit(unitId);

  // Reset form when dialog opens (⚠️ do NOT depend on `periods` here, otherwise the name gets reset while typing)
  useEffect(() => {
    if (!open) return;

    setName('');
    setType('interro');
    setCoefficient('1');
    setMaxScore('20');

    const initialPeriodId =
      (preselectedPeriodId && periods.some((p) => p.id === preselectedPeriodId)
        ? preselectedPeriodId
        : undefined) ?? (periods[0]?.id ?? '');

    setSelectedPeriodId(initialPeriodId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedPeriodId, unitId]);

  // Keep selected period valid if periods list changes while the dialog is open
  useEffect(() => {
    if (!open) return;

    if (selectedPeriodId && periods.some((p) => p.id === selectedPeriodId)) return;

    const fallbackPeriodId =
      (preselectedPeriodId && periods.some((p) => p.id === preselectedPeriodId)
        ? preselectedPeriodId
        : undefined) ?? (periods[0]?.id ?? '');

    if (fallbackPeriodId && fallbackPeriodId !== selectedPeriodId) {
      setSelectedPeriodId(fallbackPeriodId);
    }
  }, [open, periods, preselectedPeriodId, selectedPeriodId]);

  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);
  
  // Get existing evaluations for the selected period
  const periodEvaluations = selectedPeriodId ? getEvaluationsByPeriod(selectedPeriodId) : [];
  const periodDevoirs = periodEvaluations.filter(e => e.type === 'devoir');
  const periodInterros = periodEvaluations.filter(e => e.type === 'interro');

  // Check if devoir limit is reached (for semesters)
  const isDevoirLimitReached = selectedPeriod?.periodType === 'semester' && 
                               periodDevoirs.length >= 2;

  // Auto-switch to interro if devoir limit reached
  useEffect(() => {
    if (isDevoirLimitReached && type === 'devoir') {
      setType('interro');
    }
  }, [isDevoirLimitReached, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPeriodId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une période',
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: "Veuillez saisir un nom pour l'évaluation",
        variant: 'destructive',
      });
      return;
    }

    // Check devoir limit for semesters
    if (selectedPeriod?.periodType === 'semester' && type === 'devoir' && periodDevoirs.length >= 2) {
      toast({
        title: 'Limite atteinte',
        description: 'Un semestre ne peut contenir que 2 devoirs maximum',
        variant: 'destructive',
      });
      return;
    }

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
      title: 'Évaluation créée',
      description: `${type === 'interro' ? 'Interrogation' : 'Devoir'} "${name}" ajouté(e) à ${selectedPeriod?.name}`,
    });

    onOpenChange(false);
  };

  // No periods available
  if (periods.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-warning/10">
                <AlertTriangle className="text-warning" size={24} />
              </div>
              <div>
                <DialogTitle className="font-display text-h3">
                  Aucune période
                </DialogTitle>
                <DialogDescription>
                  Vous devez d'abord créer une période
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              Les évaluations doivent être associées à une période (semestre ou trimestre).
              Créez d'abord une période pour pouvoir ajouter des évaluations.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-warning/10">
              <ClipboardList className="text-warning" size={24} />
            </div>
            <div>
              <DialogTitle className="font-display text-h3">
                Nouvelle évaluation
              </DialogTitle>
              <DialogDescription>
                Ajoutez une interrogation ou un devoir
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Period selection - Required */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              Période <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Sélectionnez une période" />
              </SelectTrigger>
              <SelectContent>
                {periods.map(period => {
                  const pEvals = getEvaluationsByPeriod(period.id);
                  const pDevoirs = pEvals.filter(e => e.type === 'devoir').length;
                  const pInterros = pEvals.filter(e => e.type === 'interro').length;
                  
                  return (
                    <SelectItem key={period.id} value={period.id}>
                      <div className="flex items-center gap-2">
                        <span>{period.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({pDevoirs}/{period.expectedDevoirs} devoirs, {pInterros} interros)
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {/* Period info */}
            {selectedPeriod && (
              <div className="text-xs text-muted-foreground mt-1 p-2 rounded-lg bg-muted/50">
                {selectedPeriod.periodType === 'semester' ? (
                  <span className="flex items-center gap-1">
                    <span className={periodDevoirs.length >= 2 ? 'text-success' : 'text-warning'}>
                      {periodDevoirs.length}/2 devoirs
                    </span>
                    {periodDevoirs.length >= 2 && ' ✓ Complet'}
                    <span className="mx-2">·</span>
                    <span>{periodInterros.length} interros</span>
                  </span>
                ) : (
                  <span>
                    {periodDevoirs.length}/{selectedPeriod.expectedDevoirs} devoirs · {periodInterros.length}/{selectedPeriod.expectedInterros} interros
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Evaluation type */}
          <div className="space-y-2">
            <Label>Type d'évaluation</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('interro')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'interro'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <HelpCircle className={`mx-auto mb-2 ${type === 'interro' ? 'text-primary' : 'text-muted-foreground'}`} size={24} />
                <p className={`font-medium ${type === 'interro' ? 'text-primary' : 'text-foreground'}`}>Interrogation</p>
                <p className="text-xs text-muted-foreground mt-1">Test rapide</p>
              </button>
              <button
                type="button"
                onClick={() => !isDevoirLimitReached && setType('devoir')}
                disabled={isDevoirLimitReached}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isDevoirLimitReached 
                    ? 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                    : type === 'devoir'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <FileText className={`mx-auto mb-2 ${type === 'devoir' && !isDevoirLimitReached ? 'text-primary' : 'text-muted-foreground'}`} size={24} />
                <p className={`font-medium ${type === 'devoir' && !isDevoirLimitReached ? 'text-primary' : 'text-foreground'}`}>Devoir</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isDevoirLimitReached ? 'Limite atteinte (2/2)' : 'Évaluation complète'}
                </p>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evalName">Nom de l'évaluation</Label>
            <Input
              id="evalName"
              placeholder={type === 'interro' ? 'Ex: Interro 1, Quiz chapitre 2...' : 'Ex: Devoir 1, Examen partiel...'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxScore">Note maximale</Label>
              <Input
                id="maxScore"
                type="number"
                min="1"
                max="100"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evalCoefficient">Coefficient</Label>
              <Input
                id="evalCoefficient"
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={coefficient}
                onChange={(e) => setCoefficient(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!selectedPeriodId}>
              Ajouter {type === 'interro' ? "l'interrogation" : 'le devoir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEvaluationDialog;
