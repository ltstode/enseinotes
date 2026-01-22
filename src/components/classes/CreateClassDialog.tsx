import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  Trash2, 
  Upload, 
  UserPlus, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2,
  Sparkles,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [students, setStudents] = useState<StudentInput[]>([
    { firstName: '', lastName: '', studentId: '' }
  ]);
  const [bulkInput, setBulkInput] = useState('');
  const [inputMode, setInputMode] = useState<'individual' | 'bulk'>('individual');
  
  const { addClassRoom, activeYearId, schoolYears } = useApp();
  const { toast } = useToast();

  const activeYear = schoolYears.find(y => y.id === activeYearId);

  useEffect(() => {
    if (open) {
      setStep(0);
      setName('');
      setStudents([{ firstName: '', lastName: '', studentId: '' }]);
      setBulkInput('');
      setInputMode('individual');
    }
  }, [open]);

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

  const handleSubmit = () => {
    if (!activeYearId || !name.trim()) return;

    const finalStudents = inputMode === 'bulk' ? parseBulkInput() : students;
    const validStudents = finalStudents.filter(s => s.firstName.trim() && s.lastName.trim());

    if (validStudents.length === 0) {
      toast({
        title: 'Aucun élève valide',
        description: 'Veuillez ajouter au moins un élève avec un nom et un prénom.',
        variant: 'destructive',
      });
      return;
    }

    const now = Date.now().toString(36);

    addClassRoom({
      name: name.trim(),
      schoolYearId: activeYearId,
      students: validStudents.map((s, idx) => ({
        id: `${now}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        firstName: s.firstName.trim(),
        lastName: s.lastName.trim(),
        studentId: s.studentId.trim() || `STU-${Math.random().toString(36).substr(2, 6)}`,
        status: 'active' as const,
      })),
    });

    toast({
      title: 'Classe créée ✨',
      description: `La classe "${name}" a été créée avec ${validStudents.length} élèves.`,
    });

    onOpenChange(false);
  };

  if (!activeYear) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[460px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="h-1.5 w-full bg-destructive/50" />
          <div className="p-8 space-y-6 text-center">
            <div className="p-4 rounded-3xl bg-destructive/10 text-destructive mx-auto w-fit">
              <Plus size={40} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">Aucune année active</h2>
              <p className="text-muted-foreground">Veuillez d'abord créer et activer une année scolaire.</p>
            </div>
            <Button className="w-full h-12 rounded-2xl font-medium" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const steps = [
    { title: "Nom de la classe", icon: <Users size={18} /> },
    { title: "Mode d'importation", icon: <Upload size={18} /> },
    { title: "Liste des élèves", icon: <UserPlus size={18} /> }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
        <div className="flex w-full h-1.5 bg-secondary/30">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-success/10 text-success">
                   {steps[step].icon}
                </div>
                <div>
                   <h3 className="text-xl font-medium tracking-tight uppercase text-success/40 text-[10px] leading-none mb-1">Étape {step + 1}/{steps.length}</h3>
                   <h2 className="text-lg font-semibold tracking-tight text-foreground leading-none">{steps[step].title}</h2>
                </div>
             </div>
             {step > 0 && (
               <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => setStep(step - 1)}>
                  <ChevronLeft size={20} />
               </Button>
             )}
          </div>

          {/* Step 1: Class Name */}
          {step === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="space-y-3">
                <Label className="text-sm font-medium ml-1 text-muted-foreground">Quel est le nom de la classe ?</Label>
                <div className="relative">
                  <Input
                    autoFocus
                    placeholder="Ex: Terminale D, 3ème A..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-16 rounded-2xl bg-secondary/10 border-none shadow-inner font-semibold text-xl text-center"
                  />
                  <Sparkles size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-success/30" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Import Mode */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setInputMode('individual'); setStep(2); }}
                  className="p-8 rounded-[2rem] border-2 border-secondary/50 bg-secondary/10 hover:border-success/50 hover:bg-success/5 transition-all text-center space-y-3 group"
                >
                  <div className="p-4 rounded-2xl bg-white shadow-sm mx-auto w-fit group-hover:scale-110 transition-transform">
                    <UserPlus className="text-success" size={28} />
                  </div>
                  <p className="font-semibold text-sm text-foreground">Individuel</p>
                  <p className="text-[10px] uppercase font-medium text-muted-foreground">Un par un</p>
                </button>
                <button
                  onClick={() => { setInputMode('bulk'); setStep(2); }}
                  className="p-8 rounded-[2rem] border-2 border-secondary/50 bg-secondary/10 hover:border-success/50 hover:bg-success/5 transition-all text-center space-y-3 group"
                >
                  <div className="p-4 rounded-2xl bg-white shadow-sm mx-auto w-fit group-hover:scale-110 transition-transform">
                    <Upload className="text-success" size={28} />
                  </div>
                  <p className="font-semibold text-sm text-foreground">En masse</p>
                  <p className="text-[10px] uppercase font-medium text-muted-foreground">Copier-Coller</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Student Entry */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               {inputMode === 'individual' ? (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {students.map((student, index) => (
                      <div key={index} className="flex gap-2 items-center p-3 rounded-2xl bg-secondary/10 border border-secondary/20">
                        <Input
                          placeholder="Nom"
                          value={student.lastName}
                          onChange={(e) => updateStudent(index, 'lastName', e.target.value)}
                          className="h-10 rounded-xl bg-white border-none shadow-sm font-medium text-xs"
                        />
                        <Input
                          placeholder="Prénom"
                          value={student.firstName}
                          onChange={(e) => updateStudent(index, 'firstName', e.target.value)}
                          className="h-10 rounded-xl bg-white border-none shadow-sm font-medium text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStudentRow(index)}
                          disabled={students.length === 1}
                          className="h-10 w-10 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addStudentRow}
                      className="w-full h-12 rounded-2xl border-dashed border-2 hover:bg-success/5 hover:border-success/30 font-medium gap-2"
                    >
                      <Plus size={18} />
                      Ajouter un élève
                    </Button>
                  </div>
               ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-success/5 border border-success/10 border-dashed">
                      <Textarea
                        autoFocus
                        placeholder="DUPONT, Jean, STU-001&#10;MARTIN, Marie, STU-002"
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        className="min-h-[200px] bg-transparent border-none focus-visible:ring-0 font-mono text-xs leading-relaxed"
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase">
                      <Search size={14} />
                      Format : Nom, Prénom, ID (par ligne)
                    </div>
                  </div>
               )}
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex gap-3 pt-2">
            {step < steps.length - 1 ? (
              step === 1 ? null : ( // Hide button on mode choice step as buttons inside handle it
                <Button 
                  className="w-full h-14 rounded-2xl text-lg font-medium bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-2"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 0 && !name.trim()}
                >
                  Continuer
                  <ChevronRight size={20} />
                </Button>
              )
            ) : (
              <Button 
                className="w-full h-14 rounded-2xl text-lg font-medium bg-success text-white shadow-lg shadow-success/20 hover:scale-[1.02] active:scale-95 transition-all gap-2"
                onClick={handleSubmit}
              >
                Créer la classe
                <CheckCircle2 size={20} />
              </Button>
            )}
          </div>
          
          <div className="flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  step === i ? "w-6 bg-success" : "w-1.5 bg-secondary"
                )} 
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassDialog;
