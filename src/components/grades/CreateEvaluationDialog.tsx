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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, FileText, HelpCircle } from 'lucide-react';
import { EvaluationType } from '@/types/enseinotes';

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
  const [type, setType] = useState<EvaluationType>('interro');
  const [coefficient, setCoefficient] = useState('1');
  const [maxScore, setMaxScore] = useState('20');
  
  const { addEvaluation } = useApp();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: "Veuillez saisir un nom pour l'évaluation",
        variant: 'destructive',
      });
      return;
    }

    addEvaluation({
      name: name.trim(),
      pedagogicalUnitId: unitId,
      type,
      coefficient: parseFloat(coefficient) || 1,
      maxScore: parseFloat(maxScore) || 20,
      date: new Date(),
    });

    toast({
      title: 'Évaluation créée',
      description: `${type === 'interro' ? 'Interrogation' : 'Devoir'} "${name}" ajouté(e)`,
    });

    setName('');
    setType('interro');
    setCoefficient('1');
    setMaxScore('20');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
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
          <div className="space-y-2">
            <Label>Type d'évaluation</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('interro')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'interro'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <HelpCircle className={`mx-auto mb-2 ${type === 'interro' ? 'text-primary' : 'text-muted-foreground'}`} size={24} />
                <p className={`font-medium ${type === 'interro' ? 'text-primary' : 'text-foreground'}`}>Interrogation</p>
                <p className="text-small text-muted-foreground">Test rapide</p>
              </button>
              <button
                type="button"
                onClick={() => setType('devoir')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'devoir'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <FileText className={`mx-auto mb-2 ${type === 'devoir' ? 'text-primary' : 'text-muted-foreground'}`} size={24} />
                <p className={`font-medium ${type === 'devoir' ? 'text-primary' : 'text-foreground'}`}>Devoir</p>
                <p className="text-small text-muted-foreground">Évaluation complète</p>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Ajouter {type === 'interro' ? "l'interrogation" : 'le devoir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEvaluationDialog;
