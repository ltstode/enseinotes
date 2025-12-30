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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Users, Settings2 } from 'lucide-react';

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
  const [name, setName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || '');
  const [coefficientEnabled, setCoefficientEnabled] = useState(true);
  const [coefficient, setCoefficient] = useState('1');
  const [minInterros, setMinInterros] = useState('2');
  const [minDevoirs, setMinDevoirs] = useState('2');
  const [interroWeight, setInterroWeight] = useState('1');
  const [devoirWeight, setDevoirWeight] = useState('2');
  const [displayMode, setDisplayMode] = useState<'numeric' | 'letter' | 'percentage'>('numeric');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { addPedagogicalUnit, activeYearId, schoolYears, getClassesByYear, getStudentsByClass } = useApp();
  const { toast } = useToast();

  const activeYear = schoolYears.find(y => y.id === activeYearId);
  const classes = activeYearId ? getClassesByYear(activeYearId) : [];
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const students = selectedClassId ? getStudentsByClass(selectedClassId) : [];

  // Generate formula based on weights
  const formula = `(MoyInterros * ${interroWeight} + MoyDevoirs * ${devoirWeight}) / ${parseInt(interroWeight) + parseInt(devoirWeight)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeYearId) {
      toast({
        title: 'Erreur',
        description: "Veuillez d'abord sélectionner une année scolaire active",
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: "Veuillez saisir un nom pour l'unité pédagogique",
        variant: 'destructive',
      });
      return;
    }

    if (!selectedClassId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une classe',
        variant: 'destructive',
      });
      return;
    }

    addPedagogicalUnit({
      name: name.trim(),
      classRoomId: selectedClassId,
      schoolYearId: activeYearId,
      rules: {
        coefficient: parseFloat(coefficient) || 1,
        coefficientEnabled,
        minInterros: parseInt(minInterros) || 2,
        minDevoirs: parseInt(minDevoirs) || 2,
        formula,
        displayMode,
        interroWeight: parseFloat(interroWeight) || 1,
        devoirWeight: parseFloat(devoirWeight) || 2,
      },
    });

    toast({
      title: 'Unité créée',
      description: `L'unité ${name} a été créée pour la classe ${selectedClass?.name}`,
    });

    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setName('');
    setSelectedClassId(preselectedClassId || '');
    setCoefficientEnabled(true);
    setCoefficient('1');
    setMinInterros('2');
    setMinDevoirs('2');
    setInterroWeight('1');
    setDevoirWeight('2');
    setDisplayMode('numeric');
    setShowAdvanced(false);
  };

  if (!activeYear) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aucune année active</DialogTitle>
            <DialogDescription>
              Veuillez d'abord créer et activer une année scolaire.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (classes.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aucune classe disponible</DialogTitle>
            <DialogDescription>
              Veuillez d'abord créer au moins une classe dans l'année {activeYear.name}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <BookOpen className="text-primary" size={24} />
            </div>
            <div>
              <DialogTitle className="font-display text-h3">
                Nouvelle unité pédagogique
              </DialogTitle>
              <DialogDescription>
                Année scolaire : {activeYear.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="unitName">Nom de l'unité</Label>
            <Input
              id="unitName"
              placeholder="Ex: Informatique – Algorithmique"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Classe concernée</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Sélectionnez une classe" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.students.length} élèves)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClassId && students.length > 0 && (
            <div className="p-4 rounded-xl bg-success/5 border border-success/20 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Users className="text-success" size={18} />
                <span className="font-medium text-success">
                  {students.length} élèves préremplis
                </span>
              </div>
              <p className="text-small text-muted-foreground">
                La liste des élèves de la classe {selectedClass?.name} sera automatiquement utilisée.
              </p>
            </div>
          )}

          {/* Coefficient settings */}
          <div className="space-y-4 p-4 rounded-xl bg-secondary/30 border">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="coeffEnabled" className="cursor-pointer">Coefficient activé</Label>
                <p className="text-small text-muted-foreground">
                  Appliquer un coefficient global à cette unité
                </p>
              </div>
              <Switch
                id="coeffEnabled"
                checked={coefficientEnabled}
                onCheckedChange={setCoefficientEnabled}
              />
            </div>
            {coefficientEnabled && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="coefficient">Valeur du coefficient</Label>
                <Input
                  id="coefficient"
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={coefficient}
                  onChange={(e) => setCoefficient(e.target.value)}
                  className="h-12 w-32"
                />
              </div>
            )}
          </div>

          {/* Minimum evaluations */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minInterros">Nombre min. d'interrogations</Label>
              <Input
                id="minInterros"
                type="number"
                min="0"
                max="20"
                value={minInterros}
                onChange={(e) => setMinInterros(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minDevoirs">Nombre min. de devoirs</Label>
              <Input
                id="minDevoirs"
                type="number"
                min="0"
                max="20"
                value={minDevoirs}
                onChange={(e) => setMinDevoirs(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          {/* Advanced settings toggle */}
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings2 size={18} className="mr-2" />
            {showAdvanced ? 'Masquer' : 'Afficher'} les paramètres avancés
          </Button>

          {showAdvanced && (
            <div className="space-y-6 animate-fade-in">
              {/* Formula weights */}
              <div className="space-y-4 p-4 rounded-xl bg-secondary/30 border">
                <Label>Formule de moyenne</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interroWeight" className="text-small">Poids des interrogations</Label>
                    <Input
                      id="interroWeight"
                      type="number"
                      min="1"
                      max="10"
                      value={interroWeight}
                      onChange={(e) => setInterroWeight(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="devoirWeight" className="text-small">Poids des devoirs</Label>
                    <Input
                      id="devoirWeight"
                      type="number"
                      min="1"
                      max="10"
                      value={devoirWeight}
                      onChange={(e) => setDevoirWeight(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-card border font-mono text-small text-muted-foreground">
                  {formula}
                </div>
              </div>

              {/* Display mode */}
              <div className="space-y-2">
                <Label>Mode d'affichage</Label>
                <Select value={displayMode} onValueChange={(v: any) => setDisplayMode(v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numeric">Note /20</SelectItem>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="letter">Lettre (A-F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Créer l'unité
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUnitDialog;
