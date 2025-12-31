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
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Trash2 } from 'lucide-react';
import { Student } from '@/types/enseinotes';

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StudentInput {
  firstName: string;
  lastName: string;
  studentId: string;
}

const CreateClassDialog: React.FC<CreateClassDialogProps> = ({ open, onOpenChange }) => {
  const [name, setName] = useState('');
  const [students, setStudents] = useState<StudentInput[]>([
    { firstName: '', lastName: '', studentId: '' }
  ]);
  const [bulkInput, setBulkInput] = useState('');
  const [inputMode, setInputMode] = useState<'individual' | 'bulk'>('individual');
  
  const { addClassRoom, activeYearId, schoolYears } = useApp();
  const { toast } = useToast();

  const activeYear = schoolYears.find(y => y.id === activeYearId);

  const addStudentRow = () => {
    setStudents([...students, { firstName: '', lastName: '', studentId: '' }]);
  };

  const removeStudentRow = (index: number) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index));
    }
  };

  const updateStudent = (index: number, field: keyof StudentInput, value: string) => {
    const newStudents = [...students];
    newStudents[index][field] = value;
    setStudents(newStudents);
  };

  const parseBulkInput = (): StudentInput[] => {
    const lines = bulkInput.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const parts = line.split(/[,;\t]+/).map(p => p.trim());
      return {
        lastName: parts[0] || '',
        firstName: parts[1] || '',
        studentId: parts[2] || `STU-${index + 1}`,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeYearId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez d\'abord sélectionner une année scolaire active',
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un nom pour la classe',
        variant: 'destructive',
      });
      return;
    }

    const finalStudents = inputMode === 'bulk' ? parseBulkInput() : students;
    const validStudents = finalStudents.filter(s => s.firstName.trim() && s.lastName.trim());

<<<<<<< HEAD
    const now = Date.now().toString(36);

    addClassRoom({
      name: name.trim(),
      schoolYearId: activeYearId,
      students: validStudents.map((s, idx) => ({
        // NOTE: ids were previously saved as empty string and broke grade entry.
        // We still normalize again in AppContext for safety.
        id: `${now}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
=======
    addClassRoom({
      name: name.trim(),
      schoolYearId: activeYearId,
      students: validStudents.map(s => ({
        id: '',
>>>>>>> 9d33d5c (chore: initial sandbox commit)
        firstName: s.firstName.trim(),
        lastName: s.lastName.trim(),
        studentId: s.studentId.trim() || `STU-${Math.random().toString(36).substr(2, 6)}`,
        status: 'active' as const,
      })),
    });

    toast({
      title: 'Classe créée',
      description: `La classe ${name} a été créée avec ${validStudents.length} élèves`,
    });

    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setName('');
    setStudents([{ firstName: '', lastName: '', studentId: '' }]);
    setBulkInput('');
    setInputMode('individual');
  };

  if (!activeYear) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aucune année active</DialogTitle>
            <DialogDescription>
              Veuillez d'abord créer et activer une année scolaire avant de créer des classes.
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-success/10">
              <Users className="text-success" size={24} />
            </div>
            <div>
              <DialogTitle className="font-display text-h3">
                Nouvelle classe
              </DialogTitle>
              <DialogDescription>
                Année scolaire : {activeYear.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="className">Nom de la classe</Label>
            <Input
              id="className"
              placeholder="Ex: Tle D, 2nde A..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Liste des élèves</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={inputMode === 'individual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputMode('individual')}
                >
                  Individuel
                </Button>
                <Button
                  type="button"
                  variant={inputMode === 'bulk' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputMode('bulk')}
                >
                  En masse
                </Button>
              </div>
            </div>

            {inputMode === 'individual' ? (
              <div className="space-y-3">
                {students.map((student, index) => (
                  <div key={index} className="flex gap-2 items-center animate-fade-in">
                    <Input
                      placeholder="Nom"
                      value={student.lastName}
                      onChange={(e) => updateStudent(index, 'lastName', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Prénom"
                      value={student.firstName}
                      onChange={(e) => updateStudent(index, 'firstName', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="ID (optionnel)"
                      value={student.studentId}
                      onChange={(e) => updateStudent(index, 'studentId', e.target.value)}
                      className="w-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStudentRow(index)}
                      disabled={students.length === 1}
                    >
                      <Trash2 size={18} className="text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addStudentRow}
                  className="w-full"
                >
                  <Plus size={18} />
                  Ajouter un élève
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  placeholder="Collez la liste des élèves (Nom, Prénom, ID par ligne)&#10;Exemple:&#10;DUPONT, Jean, STU-001&#10;MARTIN, Marie, STU-002"
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  rows={8}
                  className="font-mono text-small"
                />
                <p className="text-small text-muted-foreground">
                  Format: Nom, Prénom, ID (séparés par virgule, point-virgule ou tabulation)
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Créer la classe
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassDialog;
