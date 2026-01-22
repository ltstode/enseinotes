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
import { Calendar, BookOpen, GraduationCap, Layers, Sparkles, Check, Trash2, Play, Lock } from 'lucide-react';
import { PeriodType } from '@/types/enseinotes';
import { cn } from '@/lib/utils';

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
  
  const { addPeriod, getPeriodsByUnit, activatePeriod, deletePeriod } = useApp();
  const { toast } = useToast();

  const existingPeriods = getPeriodsByUnit(unitId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez saisir un nom pour la période', variant: 'destructive' });
      return;
    }

    const periodType: PeriodType = periodSystem === 'semester' ? 'semester' : 
                                   periodSystem === 'trimester' ? 'trimester' : 'custom';

    // The first period added to a unit should be "active"
    const status = existingPeriods.length === 0 ? 'active' : 'locked';

    addPeriod({
      name: name.trim(),
      pedagogicalUnitId: unitId,
      periodType,
      status,
      order: existingPeriods.length + 1,
      expectedDevoirs: parseInt(expectedDevoirs) || 2,
      expectedInterros: parseInt(expectedInterros) || 3,
    });

    toast({
      title: 'Période créée ✨',
      description: `Période "${name}" ajoutée (${status === 'active' ? 'Activée' : 'En attente'})`,
    });

    setName('');
    onOpenChange(false);
  };

  const handleQuickAdd = (periodName: string) => {
    const periodType: PeriodType = periodName.includes('Semestre') ? 'semester' : 
                                   periodName.includes('Trimestre') ? 'trimester' : 'custom';
    
    const status = existingPeriods.length === 0 ? 'active' : 'locked';

    addPeriod({
      name: periodName,
      pedagogicalUnitId: unitId,
      periodType,
      status,
      order: existingPeriods.length + 1,
      expectedDevoirs: 2,
      expectedInterros: 3,
    });

    toast({
      title: 'Période créée ✨',
      description: `Période "${periodName}" ajoutée (${status === 'active' ? 'Activée' : 'En attente'})`,
    });
  };

  const quickPeriods = periodSystem === 'semester' 
    ? ['Semestre 1', 'Semestre 2']
    : ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl overflow-hidden border-none shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-info to-primary"></div>
        
        <DialogHeader className="pt-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3.5 rounded-2xl bg-primary/10 shadow-inner">
              <Calendar className="text-primary" size={28} />
            </div>
            <div>
              <DialogTitle className="font-display text-2xl font-semibold tracking-tight text-foreground">
                Configuration des Périodes
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-body">
                {periodSystem === 'semester' 
                  ? 'Gérez vos semestres pour cette unité pédagogique.'
                  : 'Gérez vos trimestres pour cette unité pédagogique.'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* Quick add buttons */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-small font-semibold text-foreground uppercase tracking-wider">
              <Sparkles size={16} className="text-primary" />
              Génération Rapide
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {quickPeriods.map(p => {
                const isAdded = existingPeriods.some(ep => ep.name === p);
                return (
                  <Button
                    key={p}
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-16 rounded-2xl flex-col gap-1 font-display transition-all duration-300",
                      isAdded 
                        ? "opacity-50 cursor-not-allowed bg-muted" 
                        : "hover:bg-primary/5 hover:border-primary hover:scale-[1.02] shadow-sm"
                    )}
                    onClick={() => handleQuickAdd(p)}
                    disabled={isAdded}
                  >
                    {isAdded ? <Check size={18} className="text-success" /> : (
                      p.includes('Semestre') ? <BookOpen size={18} className="text-info" /> : <GraduationCap size={18} className="text-warning" />
                    )}
                    <span className="text-xs">{p}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {existingPeriods.length > 0 && (
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-small font-semibold text-foreground uppercase tracking-wider">
                <Layers size={16} className="text-primary" />
                Périodes existantes
              </Label>
              <div className="space-y-2">
                {existingPeriods.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-border">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        p.status === 'active' ? "bg-primary animate-pulse" : p.status === 'completed' ? "bg-success" : "bg-muted"
                      )} />
                      <span className="font-medium text-xs">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{p.status}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {p.status !== 'active' && (
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => activatePeriod(p.id)}
                        >
                          <Play size={14} />
                        </Button>
                      )}
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deletePeriod(p.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-muted-foreground font-medium tracking-widest">
                ou sur mesure
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="periodName" className="text-foreground">Nom de la période</Label>
              <Input
                id="periodName"
                placeholder="Ex: Période Spéciale, Module de Rattrapage..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 rounded-2xl bg-secondary/30 border-secondary-foreground/10 focus:bg-white transition-all shadow-inner"
              />
            </div>

            {periodSystem === 'semester' ? (
              <div className="p-4 rounded-2xl bg-info/5 border border-info/10 flex gap-4 items-start">
                <div className="p-2 rounded-xl bg-info/10">
                  <BookOpen size={20} className="text-info" />
                </div>
                <div className="space-y-1">
                  <p className="text-small font-semibold text-info">Règles du système semestriel</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ce système impose <strong>2 devoirs</strong> par semestre. 
                    Les moyennes seront calculées automatiquement selon la pondération de l'unité.
                  </p>
                </div>
              </div>
            ) : periodSystem === 'trimester' ? (
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedDevoirs">Devoirs prévus</Label>
                  <Input
                    id="expectedDevoirs"
                    type="number"
                    min="1"
                    value={expectedDevoirs}
                    onChange={(e) => setExpectedDevoirs(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedInterros">Interros prévues</Label>
                  <Input
                    id="expectedInterros"
                    type="number"
                    min="0"
                    value={expectedInterros}
                    onChange={(e) => setExpectedInterros(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/30"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-3 sm:gap-0 pt-2">
            <Button type="button" variant="ghost" className="rounded-xl px-6" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <Button type="submit" disabled={!name.trim()} className="rounded-xl px-10 shadow-lg shadow-primary/20">
              Créer la période
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePeriodDialog;
