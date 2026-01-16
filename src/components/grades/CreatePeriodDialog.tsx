import React, { useState } from 'react';
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
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar, BookOpen, GraduationCap, Layers } from 'lucide-react';
import { PeriodType } from '@/types/enseinotes';

interface CreatePeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  periodSystem: 'semester' | 'trimester' | 'none';
}

const CreatePeriodDialog: React.FC<CreatePeriodDialogProps> = ({ 
  open, 
  onOpenChange, 
  unitId,
  periodSystem
}) => {
  const [name, setName] = useState('');
  const [expectedDevoirs, setExpectedDevoirs] = useState('2');
  const [expectedInterros, setExpectedInterros] = useState('3');
  
  const { addPeriod, getPeriodsByUnit } = useApp();
  const { toast } = useToast();

  const existingPeriods = getPeriodsByUnit(unitId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un nom pour la période',
        variant: 'destructive',
      });
      return;
    }

    const periodType: PeriodType = periodSystem === 'semester' ? 'semester' : 
                                   periodSystem === 'trimester' ? 'trimester' : 'custom';

    addPeriod({
      name: name.trim(),
      pedagogicalUnitId: unitId,
      periodType,
      order: existingPeriods.length + 1,
      // Semester = 2 devoirs forcés
      expectedDevoirs: periodSystem === 'semester' ? 2 : parseInt(expectedDevoirs) || 2,
      expectedInterros: parseInt(expectedInterros) || 3,
    });

    toast({
      title: 'Période créée',
      description: `Période "${name}" ajoutée avec succès`,
    });

    setName('');
    setExpectedDevoirs('2');
    setExpectedInterros('3');
    onOpenChange(false);
  };

  const handleQuickAdd = (periodName: string) => {
    const periodType: PeriodType = periodName.includes('Semestre') ? 'semester' : 
                                   periodName.includes('Trimestre') ? 'trimester' : 'custom';
    
    addPeriod({
      name: periodName,
      pedagogicalUnitId: unitId,
      periodType,
      order: existingPeriods.length + 1,
      // Semester = 2 devoirs forcés, Trimester = configurable
      expectedDevoirs: periodType === 'semester' ? 2 : 2,
      expectedInterros: 3,
    });

    toast({
      title: 'Période créée',
      description: `Période "${periodName}" ajoutée`,
    });
  };

  const quickPeriods = periodSystem === 'semester' 
    ? ['Semestre 1', 'Semestre 2']
    : ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <Calendar className="text-primary" size={24} />
            </div>
            <div>
              <DialogTitle className="font-display text-h3">
                Nouvelle période
              </DialogTitle>
              <DialogDescription>
                {periodSystem === 'semester' 
                  ? 'Créez un semestre (2 devoirs obligatoires par semestre)'
                  : periodSystem === 'trimester'
                    ? 'Créez un trimestre avec le nombre d\'évaluations souhaité'
                    : 'Créez une période personnalisée'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Quick add buttons */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Layers size={16} className="text-muted-foreground" />
              Ajout rapide
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {quickPeriods.map(p => (
                <Button
                  key={p}
                  type="button"
                  variant="outline"
                  className="h-12 font-medium hover:bg-primary/5 hover:border-primary transition-all"
                  onClick={() => handleQuickAdd(p)}
                  disabled={existingPeriods.some(ep => ep.name === p)}
                >
                  {p.includes('Semestre') ? (
                    <BookOpen size={16} className="mr-2 text-info" />
                  ) : (
                    <GraduationCap size={16} className="mr-2 text-warning" />
                  )}
                  {p}
                </Button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">
                ou période personnalisée
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="periodName">Nom de la période</Label>
              <Input
                id="periodName"
                placeholder="Ex: Période 1, Module A..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Only show evaluation count for trimester system */}
            {periodSystem === 'trimester' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedDevoirs" className="flex items-center gap-2">
                    Devoirs prévus
                    <span className="text-xs text-muted-foreground">(obligatoire)</span>
                  </Label>
                  <Input
                    id="expectedDevoirs"
                    type="number"
                    min="1"
                    max="10"
                    value={expectedDevoirs}
                    onChange={(e) => setExpectedDevoirs(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedInterros">Interrogations prévues</Label>
                  <Input
                    id="expectedInterros"
                    type="number"
                    min="0"
                    max="20"
                    value={expectedInterros}
                    onChange={(e) => setExpectedInterros(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            )}

            {periodSystem === 'semester' && (
              <div className="p-4 rounded-xl bg-info/10 border border-info/20">
                <p className="text-sm text-info font-medium flex items-center gap-2">
                  <BookOpen size={16} />
                  Système semestriel
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Chaque semestre comprend obligatoirement <strong>2 devoirs</strong>. 
                  Vous pouvez ajouter autant d'interrogations que souhaité.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Créer la période
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePeriodDialog;
