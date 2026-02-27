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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Settings2, Calculator, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import { PedagogicalUnit } from '@/types/enseinotes';

interface EditUnitDialogProps {
  unit: PedagogicalUnit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

const EditUnitDialog: React.FC<EditUnitDialogProps> = ({ 
  unit, 
  open, 
  onOpenChange,
  onDeleted
}) => {
  const [name, setName] = useState(unit.name);
  const [interroWeight, setInterroWeight] = useState(unit.rules.interroWeight.toString());
  const [devoirWeight, setDevoirWeight] = useState(unit.rules.devoirWeight.toString());
  const [coefficient, setCoefficient] = useState(unit.rules.coefficient.toString());
  
  const { updatePedagogicalUnit, deletePedagogicalUnit, getEvaluationsByUnit, classRooms } = useApp();
  const { toast } = useToast();

  const evaluations = getEvaluationsByUnit(unit.id);
  const classroom = classRooms.find(c => c.id === unit.classRoomId);
  const totalGrades = evaluations.reduce((acc, e) => acc + (classroom?.students.filter(s => s.status === 'active').length ?? 0), 0);

  useEffect(() => {
    if (open) {
      setName(unit.name);
      setInterroWeight(unit.rules.interroWeight.toString());
      setDevoirWeight(unit.rules.devoirWeight.toString());
      setCoefficient(unit.rules.coefficient.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: "Veuillez saisir le nom de l'unité",
        variant: 'destructive',
      });
      return;
    }

    updatePedagogicalUnit(unit.id, {
      name: name.trim(),
      rules: {
        ...unit.rules,
        interroWeight: parseFloat(interroWeight) || 1,
        devoirWeight: parseFloat(devoirWeight) || 2,
        coefficient: parseFloat(coefficient) || 1,
      },
    });

    toast({
      title: 'Unité mise à jour ✨',
      description: `L'unité "${name}" a été modifiée avec succès.`,
    });

    onOpenChange(false);
  };

  const handleDelete = () => {
    deletePedagogicalUnit(unit.id);
    toast({
      title: 'Unité supprimée',
      description: `L'unité "${unit.name}" et toutes ses données ont été supprimées.`,
      variant: 'destructive',
    });
    onOpenChange(false);
    if (onDeleted) onDeleted();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] rounded-3xl border-none shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-soft-orange-foreground"></div>
        
        <DialogHeader className="pt-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3.5 rounded-2xl bg-soft-orange/10 shadow-inner">
              <Settings2 className="text-soft-orange-foreground" size={28} />
            </div>
            <div>
              <DialogTitle className="font-display text-2xl font-semibold tracking-tight text-foreground">
                Modifier l'Unité
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-body">
                Ajustez les paramètres de <b>{unit.name}</b>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="editUnitName" className="flex items-center gap-2">
              <BookOpen size={14} className="text-muted-foreground" />
              Nom de la matière
            </Label>
            <Input
              id="editUnitName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl bg-secondary/30 border-secondary-foreground/10 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editUnitCoef" className="flex items-center gap-2">
              <Sparkles size={14} className="text-muted-foreground" />
              Coefficient Global
            </Label>
            <Input
              id="editUnitCoef"
              type="number"
              min="0.5"
              step="0.5"
              value={coefficient}
              onChange={(e) => setCoefficient(e.target.value)}
              className="h-12 rounded-xl bg-secondary/30 border-secondary-foreground/10 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="p-6 rounded-2xl bg-secondary/20 border border-border space-y-4">
            <Label className="flex items-center gap-2 text-small font-semibold text-foreground">
              <Calculator size={16} className="text-primary" />
              Pondération des notes (Interne)
            </Label>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="editInterroWeight" className="text-xs text-muted-foreground">Poids Interro</Label>
                <Input
                  id="editInterroWeight"
                  type="number"
                  min="1"
                  max="10"
                  value={interroWeight}
                  onChange={(e) => setInterroWeight(e.target.value)}
                  className="h-12 rounded-xl bg-white border-none shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDevoirWeight" className="text-xs text-muted-foreground">Poids Devoir</Label>
                <Input
                  id="editDevoirWeight"
                  type="number"
                  min="1"
                  max="10"
                  value={devoirWeight}
                  onChange={(e) => setDevoirWeight(e.target.value)}
                  className="h-12 rounded-xl bg-white border-none shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl gap-2 font-medium">
                  <Trash2 size={18} />
                  Supprimer l'unité
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-none">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle size={24} />
                    Suppression Définitive
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    L'unité <b>{unit.name}</b> sera supprimée avec toutes ses données :
                  </AlertDialogDescription>
                  {/* Impact cascade */}
                  <div className="mt-3 rounded-xl bg-destructive/5 border border-destructive/15 divide-y divide-destructive/10 text-sm font-medium overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-muted-foreground">Évaluations</span>
                      <span className="font-semibold text-foreground">{evaluations.length}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-muted-foreground">Notes enregistrées</span>
                      <span className="font-semibold text-foreground">{totalGrades}</span>
                    </div>
                  </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl px-6">
                    Oui, supprimer tout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="rounded-xl px-6" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" className="rounded-xl px-10 shadow-lg shadow-soft-orange-foreground/20 bg-soft-orange-foreground text-white hover:scale-105 transition-transform">
                Enregistrer
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUnitDialog;
