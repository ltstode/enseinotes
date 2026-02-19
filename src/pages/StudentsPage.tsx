import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  UserPlus, 
  Download, 
  Upload, 
  Pencil, 
  Trash2, 
  Users, 
  Check, 
  X,
  GraduationCap,
  Plus,
  Archive,
  ArchiveRestore,
  Share2
} from 'lucide-react';
import { Student, PedagogicalUnit } from '@/types/enseinotes';
import { toast } from 'sonner';
import MagicShareDialog from '@/components/grades/MagicShareDialog';

const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    classRooms, 
    activeYearId, 
    schoolYears,
    pedagogicalUnits,
    periods,
    getClassesByYear, 
    addStudentToClass,
    updateStudentInClass,
    deleteStudentFromClass,
    calculateAverage
  } = useApp();
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editLastName, setEditLastName] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  
  // Share states
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedStudentForShare, setSelectedStudentForShare] = useState<Student | null>(null);
  const [selectedUnitForShare, setSelectedUnitForShare] = useState<PedagogicalUnit | null>(null);
  
  // Form states
  const [newLastName, setNewLastName] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [importText, setImportText] = useState('');
  const [excelPreview, setExcelPreview] = useState<{ firstName: string; lastName: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const classes = activeYearId ? getClassesByYear(activeYearId) : [];
  const selectedClass = classRooms.find(c => c.id === selectedClassId);
  
  // Filter and sort students alphabetically
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    
    return selectedClass.students
      .filter(s => {
        const fullName = `${s.lastName} ${s.firstName}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase());
        const matchesArchived = showArchived ? true : s.status === 'active';
        return matchesSearch && matchesArchived;
      })
      .sort((a, b) => {
        const lastNameCompare = a.lastName.localeCompare(b.lastName, 'fr');
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName, 'fr');
      });
  }, [selectedClass, searchTerm, showArchived]);

  // Format name: each word capitalized (first letter uppercase, rest lowercase)
  const formatFirstName = (name: string): string => {
    return name
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleAddStudent = () => {
    if (!selectedClassId || !newLastName.trim()) return;
    
    addStudentToClass(selectedClassId, {
      firstName: formatFirstName(newFirstName),
      lastName: newLastName.trim().toUpperCase(),
      studentId: '',
      status: 'active'
    });
    
    setNewLastName('');
    setNewFirstName('');
    setIsAddDialogOpen(false);
    toast.success('Élève ajouté avec succès');
  };

  const handleImportStudents = () => {
    if (!selectedClassId) return;
    
    // Use excelPreview if available (from Excel file), else parse text
    let parsedStudents: { firstName: string; lastName: string }[] = [];
    
    if (excelPreview.length > 0) {
      parsedStudents = excelPreview;
    } else if (importText.trim()) {
      const names = importText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
      parsedStudents = names.map(name => {
        const parts = name.split(/\s+/);
        return {
          lastName: parts[0]?.toUpperCase() || '',
          firstName: formatFirstName(parts.slice(1).join(' ')),
        };
      });
    }
    
    if (parsedStudents.length === 0) {
      toast.error('Aucun élève à importer');
      return;
    }
    
    parsedStudents.forEach(({ firstName, lastName }) => {
      if (lastName.trim()) {
        addStudentToClass(selectedClassId, {
          firstName,
          lastName: lastName.toUpperCase(),
          studentId: '',
          status: 'active'
        });
      }
    });
    
    setImportText('');
    setExcelPreview([]);
    setIsImportDialogOpen(false);
    toast.success(`${parsedStudents.length} élèves importés avec succès`);
  };

  const handleExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Chargement différé : xlsx n'est téléchargé que quand un fichier est sélectionné
    const XLSX = await import('xlsx');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

        if (jsonData.length === 0) {
          toast.error('Le fichier est vide ou mal formaté');
          return;
        }

        const headers = Object.keys(jsonData[0]);
        const nameColumn = headers.find(h => h.toLowerCase().includes('nom'));

        if (!nameColumn) {
          toast.error('Aucune colonne "Nom" trouvée dans le fichier. Assurez-vous qu\'une colonne contient "Nom" dans son titre.');
          return;
        }

        const students = jsonData
          .map(row => {
            const fullName = String(row[nameColumn] || '').trim();
            if (!fullName) return null;
            const parts = fullName.split(/\s+/);
            const lastName = parts[0]?.toUpperCase() || '';
            const firstName = formatFirstName(parts.slice(1).join(' '));
            return { firstName, lastName };
          })
          .filter(Boolean) as { firstName: string; lastName: string }[];

        setExcelPreview(students);
        toast.success(`${students.length} élèves détectés dans le fichier`);
      } catch {
        toast.error('Erreur lors de la lecture du fichier Excel');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleArchiveStudent = (student: Student) => {
    if (!selectedClassId) return;
    
    const newStatus = student.status === 'active' ? 'archived' : 'active';
    updateStudentInClass(selectedClassId, student.id, { status: newStatus });
    toast.success(newStatus === 'archived' ? 'Élève archivé' : 'Élève restauré');
  };

  const handleDeleteStudent = () => {
    if (!selectedClassId || !studentToDelete) return;
    
    deleteStudentFromClass(selectedClassId, studentToDelete.id);
    setStudentToDelete(null);
    toast.success('Élève supprimé définitivement');
  };

  const handleBulkArchive = () => {
    if (!selectedClassId) return;
    
    selectedStudents.forEach(studentId => {
      const student = selectedClass?.students.find(s => s.id === studentId);
      if (student && student.status === 'active') {
        updateStudentInClass(selectedClassId, studentId, { status: 'archived' });
      }
    });
    
    setSelectedStudents(new Set());
    toast.success('Élèves archivés');
  };

  const handleExportExcel = async () => {
    if (!selectedClass) return;

    // Chargement différé : xlsx n'est téléchargé que quand l'utilisateur exporte
    const XLSX = await import('xlsx');

    const data = [
      ['Nom', 'Prénom'],
      ...filteredStudents.map(student => [student.lastName, student.firstName])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Élèves');

    const fileName = `${selectedClass.name.replace(/\s+/g, '_')}_eleves_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success(`Liste de ${filteredStudents.length} élève(s) exportée`);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditLastName(student.lastName);
    setEditFirstName(student.firstName);
  };

  const handleSaveEdit = () => {
    if (!selectedClassId || !editingStudent || !editLastName.trim()) return;
    
    updateStudentInClass(selectedClassId, editingStudent.id, { 
      firstName: formatFirstName(editFirstName), 
      lastName: editLastName.trim().toUpperCase() 
    });
    setEditingStudent(null);
    setEditLastName('');
    setEditFirstName('');
    toast.success('Élève modifié');
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedStudents((prev) => {
      if (prev.size === filteredStudents.length) return new Set();
      return new Set(filteredStudents.map((s) => s.id));
    });
  };

  return (
    <AppLayout>
      <div className="no-scroll-container gap-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h2 className="text-4xl font-semibold tracking-tighter text-foreground leading-tight flex items-center gap-3">
              Gestion <span className="text-primary">Élèves</span>
              <Users className="text-soft-purple-foreground" size={32} />
            </h2>
            <p className="text-muted-foreground font-medium">Administrez vos listes d'élèves par classe.</p>
          </div>
          <div className="flex gap-3">
             {selectedClass && (
               <>
                  <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" className="h-12 px-6 rounded-2xl gap-2 font-bold hover:bg-secondary transition-all shadow-sm border-border">
                   <Upload size={18} />
                   Import massif
                 </Button>
                  {filteredStudents.length > 0 && (
                    <Button onClick={handleExportExcel} variant="outline" className="h-12 px-6 rounded-2xl gap-2 font-bold hover:bg-soft-green hover:text-soft-green-foreground transition-all shadow-sm border-border">
                      <Download size={18} />
                      Export Excel
                    </Button>
                  )}
                  <Button onClick={() => setIsAddDialogOpen(true)} className="h-12 px-8 rounded-2xl gap-2 font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                   <Plus size={18} />
                   Ajouter un élève
                 </Button>
               </>
             )}
          </div>
        </div>

        {/* Class Selection - Horizontal Pills */}
        <div className="glass-card p-4 rounded-3xl flex items-center gap-4 overflow-x-auto compact-scrollbar shrink-0">
          <div className="flex items-center gap-2 px-3 border-r border-white/20 shrink-0">
            <Users size={16} className="text-primary" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Classes</span>
          </div>
          <div className="flex gap-2">
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs font-medium transition-all duration-300 shrink-0",
                  selectedClassId === c.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground shadow-sm"
                )}
              >
                {c.name}
                <span className="ml-2 opacity-50 font-medium">({c.students.length})</span>
              </button>
            ))}
            {classes.length === 0 && (
              <p className="text-xs text-muted-foreground italic px-4">Aucune classe disponible. Créez-en une d'abord.</p>
            )}
          </div>
        </div>

        {selectedClass ? (
          <div className="flex-1 min-h-0 flex flex-col gap-6">
            {/* Filters Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                 <Input
                   placeholder="Rechercher un élève par nom ou prénom..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="pl-11 h-12 rounded-2xl bg-card border border-border/60 shadow-sm group-focus-within:shadow-md group-focus-within:border-primary/30 transition-all font-medium"
                 />
              </div>
              
              <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-card border border-border/60 shadow-sm">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none">
                  <Checkbox
                    checked={showArchived}
                    onCheckedChange={(checked) => setShowArchived(checked as boolean)}
                    className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span>Afficher les archivés</span>
                </label>
                
                {selectedStudents.size > 0 && (
                  <div className="h-6 w-px bg-muted-foreground/20"></div>
                )}
                
                {selectedStudents.size > 0 && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 gap-2 text-soft-pink-foreground hover:bg-soft-pink hover:text-soft-pink-foreground font-medium rounded-xl px-4"
                    onClick={handleBulkArchive}
                  >
                    <Archive size={14} />
                    Archiver ({selectedStudents.size})
                  </Button>
                )}
              </div>
            </div>

            {/* Students Table - Clean Apple Style */}
            <div className="apple-card flex-1 min-h-0 flex flex-col overflow-hidden border border-border/60">
              <div className="flex-1 overflow-y-auto compact-scrollbar">
                {filteredStudents.length > 0 ? (
                  <table className="w-full border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-card/95 backdrop-blur-md z-20">
                      <tr className="border-b border-muted/50">
                        <th className="px-6 text-left w-12" style={{ paddingTop: 'var(--density-cell-py, 1rem)', paddingBottom: 'var(--density-cell-py, 1rem)' }}>
                          <Checkbox
                            checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                            onCheckedChange={toggleSelectAll}
                            className="rounded-md"
                          />
                        </th>
                        <th className="px-6 text-[10px] font-medium uppercase tracking-widest text-muted-foreground text-left" style={{ paddingTop: 'var(--density-cell-py, 1rem)', paddingBottom: 'var(--density-cell-py, 1rem)' }}>Nom de l'élève</th>
                        <th className="px-6 text-[10px] font-medium uppercase tracking-widest text-muted-foreground text-center w-32" style={{ paddingTop: 'var(--density-cell-py, 1rem)', paddingBottom: 'var(--density-cell-py, 1rem)' }}>Statut</th>
                        <th className="px-6 text-[10px] font-medium uppercase tracking-widest text-muted-foreground text-center w-32" style={{ paddingTop: 'var(--density-cell-py, 1rem)', paddingBottom: 'var(--density-cell-py, 1rem)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/30">
                      {filteredStudents.map(student => (
                        <tr 
                          key={student.id}
                          className="group hover:bg-primary/5 transition-colors duration-200"
                        >
                          <td className="px-6" style={{ paddingTop: 'var(--density-cell-py, 1rem)', paddingBottom: 'var(--density-cell-py, 1rem)' }}>
                            <Checkbox
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={() => toggleStudentSelection(student.id)}
                              className="rounded-md"
                            />
                          </td>
                          <td className="px-6" style={{ paddingTop: 'var(--density-cell-py, 1rem)', paddingBottom: 'var(--density-cell-py, 1rem)' }}>
                            {editingStudent?.id === student.id ? (
                              <div className="flex items-center gap-2 animate-fade-in">
                                <Input
                                  value={editLastName}
                                  onChange={e => setEditLastName(e.target.value)}
                                   className="h-9 w-40 uppercase font-semibold text-xs rounded-xl shadow-inner border-primary/20"
                                  placeholder="NOM"
                                  autoFocus
                                />
                                <Input
                                  value={editFirstName}
                                  onChange={e => setEditFirstName(e.target.value)}
                                   className="h-9 flex-1 text-xs font-medium rounded-xl shadow-inner border-primary/20"
                                  placeholder="Prénoms"
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') setEditingStudent(null);
                                  }}
                                />
                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-soft-green" onClick={handleSaveEdit}>
                                  <Check size={16} className="text-soft-green-foreground" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-soft-pink" onClick={() => setEditingStudent(null)}>
                                  <X size={16} className="text-soft-pink-foreground" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-foreground uppercase text-sm">{student.lastName}</span>
                                <span className="font-medium text-muted-foreground text-sm">{student.firstName}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 text-center" style={{ paddingTop: 'var(--density-cell-py, 1rem)', paddingBottom: 'var(--density-cell-py, 1rem)' }}>
                            <div className={cn(
                              "inline-flex px-3 py-1 rounded-full text-[10px] font-medium uppercase",
                              student.status === 'active' ? "bg-soft-green text-soft-green-foreground" : "bg-muted/10 text-muted-foreground"
                            )}>
                              {student.status === 'active' ? 'Actif' : 'Archivé'}
                            </div>
                          </td>
                          <td className="px-6" style={{ paddingTop: 'var(--density-cell-py, 1rem)', paddingBottom: 'var(--density-cell-py, 1rem)' }}>
                            <div className="flex items-center justify-center gap-1">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-9 w-9 rounded-xl hover:bg-primary/10 text-primary"
                                onClick={() => handleEditStudent(student)}
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className={cn(
                                  "h-9 w-9 rounded-xl hover:bg-soft-orange/50 transition-colors",
                                  student.status === 'active' ? "text-soft-orange-foreground" : "text-soft-blue-foreground hover:bg-soft-blue/50"
                                )}
                                onClick={() => handleArchiveStudent(student)}
                              >
                                {student.status === 'active' ? <Archive size={16} /> : <ArchiveRestore size={16} />}
                              </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-9 w-9 rounded-xl hover:bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all"
                                  onClick={() => {
                                    setSelectedStudentForShare(student);
                                    // By default, if there are units, pick the first one
                                    const classUnits = classRooms.find(c => c.id === selectedClassId) 
                                      ? pedagogicalUnits.filter(u => u.classRoomId === selectedClassId)
                                      : [];
                                    if (classUnits.length > 0) {
                                      setSelectedUnitForShare(classUnits[0]);
                                      setIsShareDialogOpen(true);
                                    } else {
                                      toast.error("Aucune unité pédagogique trouvée pour cette classe.");
                                    }
                                  }}
                                  title="Partage Magique"
                                >
                                  <Share2 size={16} />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-9 w-9 rounded-xl hover:bg-soft-pink text-soft-pink-foreground"
                                  onClick={() => setStudentToDelete(student)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center">
                      <Search size={24} className="text-muted-foreground opacity-30" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground italic">
                      {searchTerm ? 'Aucun résultat ne correspond à votre recherche.' : 'Cette classe ne contient aucun élève pour le moment.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in text-center p-12">
             <div className="w-24 h-24 bg-soft-purple-foreground/5 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
               <Users size={48} className="text-soft-purple-foreground opacity-50" />
             </div>
             <h3 className="text-2xl font-semibold mb-2 italic">Où sont les élèves ?</h3>
             <p className="text-muted-foreground max-w-sm mb-8 font-medium">Sélectionnez une classe dans la barre ci-dessus pour gérer vos listes d'appel et les notes des élèves.</p>
             <div className="flex gap-4">
                 <Button variant="outline" onClick={() => navigate('/classes?new=true')} className="rounded-2xl h-12 px-6 font-medium border-dashed hover:bg-white transition-all">
                  Créer une nouvelle classe
                </Button>
             </div>
          </div>
        )}
      </div>

      {/* Dialogs - Consistent Styling */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="rounded-3xl border border-border/60 shadow-2xl p-0 overflow-hidden bg-card">
          <div className="h-1 w-full bg-primary"></div>
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-semibold items-center flex gap-3">
              <Plus className="text-primary" /> Nouvel Élève
            </DialogTitle>
          </DialogHeader>
          <div className="px-8 py-4 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-1">Nom de famille</Label>
              <Input
                placeholder="Ex: DUPONT"
                value={newLastName}
                onChange={e => setNewLastName(e.target.value)}
                className="h-14 rounded-2xl bg-secondary border border-border font-semibold text-lg text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/40 transition-all uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-1">Prénoms</Label>
              <Input
                placeholder="Ex: Jean Pierre"
                value={newFirstName}
                onChange={e => setNewFirstName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddStudent()}
                className="h-14 rounded-2xl bg-secondary border border-border font-medium text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/40 transition-all"
              />
            </div>
          </div>
          <DialogFooter className="p-8 pt-4 gap-3 bg-secondary/50">
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl font-medium">Annuler</Button>
            <Button onClick={handleAddStudent} disabled={!newLastName.trim()} className="rounded-xl bg-primary px-10 font-medium shadow-lg shadow-primary/20">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
          <AlertDialogContent className="rounded-[2.5rem] border border-border/60 shadow-2xl bg-card">
          <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-semibold text-soft-pink-foreground">Supprimer définitivement ?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-muted-foreground py-2">
              L'élève <b>{studentToDelete?.lastName} {studentToDelete?.firstName}</b> ainsi que toutes ses notes seront effacés de manière irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-none bg-secondary hover:bg-secondary/70">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStudent}
              className="rounded-xl bg-soft-pink-foreground text-white hover:bg-soft-pink-foreground/90 shadow-lg shadow-soft-pink-foreground/20 font-medium px-8"
            >
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog with Excel support */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => { setIsImportDialogOpen(open); if (!open) { setExcelPreview([]); setImportText(''); } }}>
        <DialogContent className="sm:max-w-[560px] rounded-3xl border border-border/60 shadow-2xl p-0 overflow-hidden bg-card">
          <div className="h-1 w-full bg-success"></div>
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
              <Upload className="text-success" /> Import massif
            </DialogTitle>
          </DialogHeader>
          <div className="px-8 py-4 space-y-6">
            {/* Excel file upload */}
            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-1">Importer depuis un fichier Excel</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelFile}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-14 rounded-2xl border-dashed border-2 border-success/30 hover:bg-success/5 hover:border-success/50 font-medium gap-3 text-foreground transition-all"
              >
                <Download size={20} className="text-success" />
                Choisir un fichier .xlsx ou .csv
              </Button>
              <p className="text-[10px] text-muted-foreground ml-1">
                Le fichier doit contenir une colonne avec «&nbsp;Nom&nbsp;» dans son titre. Le premier mot sera le NOM, le reste les prénoms.
              </p>
            </div>

            {/* Excel Preview */}
            {excelPreview.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-widest text-success ml-1">
                  {excelPreview.length} élèves détectés
                </Label>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border/40 divide-y divide-border/20">
                  {excelPreview.map((s, i) => (
                    <div key={i} className="px-4 py-2 flex items-center gap-3 text-xs">
                      <span className="w-6 text-muted-foreground text-[10px] font-mono">{i + 1}</span>
                      <span className="font-semibold text-foreground uppercase">{s.lastName}</span>
                      <span className="text-muted-foreground font-medium">{s.firstName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Separator */}
            {excelPreview.length === 0 && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border/40"></div>
                  <span className="text-[10px] uppercase font-medium text-muted-foreground">ou copier-coller</span>
                  <div className="flex-1 h-px bg-border/40"></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-1">Saisie manuelle (un nom par ligne)</Label>
                  <Textarea
                    placeholder={"DUPONT Jean Pierre\nMARTIN Marie\nDUBOIS Sophie Anne"}
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                    className="min-h-[150px] rounded-2xl bg-secondary border border-border font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/40 transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground ml-1">
                    Format : Le premier mot = NOM (majuscule), le reste = Prénoms.
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="p-8 pt-4 gap-3 bg-secondary/50">
            <Button variant="ghost" onClick={() => setIsImportDialogOpen(false)} className="rounded-xl font-medium">Annuler</Button>
            <Button 
              onClick={handleImportStudents} 
              disabled={excelPreview.length === 0 && !importText.trim()}
              className="rounded-xl bg-success text-white px-10 font-medium shadow-lg shadow-success/20 hover:brightness-110"
            >
              Importer {excelPreview.length > 0 ? `(${excelPreview.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedStudentForShare && (
        <MagicShareDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          student={selectedStudentForShare}
          unit={selectedUnitForShare ?? pedagogicalUnits.filter(u => u.classRoomId === selectedClassId)[0]}
          availableUnits={pedagogicalUnits.filter(u => u.classRoomId === selectedClassId)}
          allPeriods={periods}
          classroom={classRooms.find(c => c.id === selectedClassId)}
          schoolYear={schoolYears.find(y => y.id === activeYearId!)}
          teacherName="Enseignant"
          calculateAverage={calculateAverage}
          classStudents={classRooms.find(c => c.id === selectedClassId)?.students ?? []}
        />
      )}
    </AppLayout>
  );
};

export default StudentsPage;
