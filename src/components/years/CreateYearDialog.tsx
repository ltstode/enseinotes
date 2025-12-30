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
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Check } from 'lucide-react';
import { SchoolYearMode } from '@/types/enseinotes';
import YearInput from '@/components/ui/year-input';

interface CreateYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateYearDialog: React.FC<CreateYearDialogProps> = ({ open, onOpenChange }) => {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<SchoolYearMode>('trimester');
  const { addSchoolYear } = useApp();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const suggestedName = `${currentYear}-${currentYear + 1}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the year format (YYYY-YYYY)
    const yearRegex = /^\d{4}-\d{4}$/;
    if (!yearRegex.test(name)) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir une année scolaire valide (ex: 2024-2025)',
        variant: 'destructive',
      });
      return;
    }

    addSchoolYear({
      name: name.trim(),
      mode,
      isActive: true,
    });

    toast({
      title: 'Année créée',
      description: `L'année scolaire ${name} a été créée avec succès`,
    });

    setName('');
    setMode('trimester');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <Calendar className="text-primary" size={24} />
            </div>
            <div>
              <DialogTitle className="font-display text-h3">
                Nouvelle année scolaire
              </DialogTitle>
              <DialogDescription>
                Créez une nouvelle année scolaire pour commencer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'année</Label>
            <YearInput
              value={name}
              onChange={setName}
              className="h-12"
              placeholder={suggestedName}
            />
            <p className="text-small text-muted-foreground">
              Saisissez l'année de début (ex: 2024), le reste se complète automatiquement
            </p>
          </div>

          <div className="space-y-4">
            <Label>Mode de fonctionnement</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('semester')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mode === 'semester'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-semibold">Semestres</span>
                  {mode === 'semester' && (
                    <Check className="text-primary" size={20} />
                  )}
                </div>
                <p className="text-small text-muted-foreground">
                  Année divisée en 2 périodes
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('trimester')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mode === 'trimester'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-semibold">Trimestres</span>
                  {mode === 'trimester' && (
                    <Check className="text-primary" size={20} />
                  )}
                </div>
                <p className="text-small text-muted-foreground">
                  Année divisée en 3 périodes
                </p>
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Créer l'année
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateYearDialog;
