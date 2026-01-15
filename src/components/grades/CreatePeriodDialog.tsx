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
import { Calendar } from 'lucide-react';

interface CreatePeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
}

const CreatePeriodDialog: React.FC<CreatePeriodDialogProps> = ({ 
  open, 
  onOpenChange, 
  unitId 
}) => {
  const [name, setName] = useState('');
  
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

    addPeriod({
      name: name.trim(),
      pedagogicalUnitId: unitId,
      order: existingPeriods.length + 1,
    });

    toast({
      title: 'Période créée',
      description: `Période "${name}" ajoutée`,
    });

    setName('');
    onOpenChange(false);
  };

  const handleQuickAdd = (periodName: string) => {
    addPeriod({
      name: periodName,
      pedagogicalUnitId: unitId,
      order: existingPeriods.length + 1,
    });

    toast({
      title: 'Période créée',
      description: `Période "${periodName}" ajoutée`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
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
                Organisez vos évaluations par période
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Ajout rapide</Label>
            <div className="flex flex-wrap gap-2">
              {['Trimestre 1', 'Trimestre 2', 'Trimestre 3'].map(p => (
                <Button
                  key={p}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdd(p)}
                  disabled={existingPeriods.some(ep => ep.name === p)}
                >
                  {p}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {['Semestre 1', 'Semestre 2'].map(p => (
                <Button
                  key={p}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdd(p)}
                  disabled={existingPeriods.some(ep => ep.name === p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou personnalisé</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="periodName">Nom de la période</Label>
            <Input
              id="periodName"
              placeholder="Ex: Période 1, Chapitre 1..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePeriodDialog;
