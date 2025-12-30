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
import { ClipboardList } from 'lucide-react';

interface CreateEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
}

const CreateEvaluationDialog: React.FC<CreateEvaluationDialogProps> = ({ 
  open, 
  onOpenChange, 
  unitId 
}) => {
  const [name, setName] = useState('');
  const [coefficient, setCoefficient] = useState('1');
  const [maxScore, setMaxScore] = useState('20');
  
  const { addEvaluation } = useApp();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un nom pour l\'évaluation',
        variant: 'destructive',
      });
      return;
    }

    addEvaluation({
      name: name.trim(),
      pedagogicalUnitId: unitId,
      coefficient: parseFloat(coefficient) || 1,
      maxScore: parseFloat(maxScore) || 20,
      date: new Date(),
    });

    toast({
      title: 'Évaluation créée',
      description: `L'évaluation "${name}" a été ajoutée`,
    });

    setName('');
    setCoefficient('1');
    setMaxScore('20');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
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
                Créez une colonne pour saisir des notes
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="evalName">Nom de l'évaluation</Label>
            <Input
              id="evalName"
              placeholder="Ex: Devoir 1, Interrogation, Examen..."
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Créer l'évaluation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEvaluationDialog;
