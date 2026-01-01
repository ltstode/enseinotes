import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
  Plus, 
  Upload, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Pencil, 
  Users,
  Check,
  X,
  Search
} from 'lucide-react';
import { Student } from '@/types/enseinotes';
import { toast } from 'sonner';

const StudentsPage: React.FC = () => {
  const { 
    classRooms, 
    activeYearId, 
    getClassesByYear, 
    addStudentToClass,
    updateStudentInClass,
    deleteStudentFromClass
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
  
  // Form states
  const [newLastName, setNewLastName] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [importText, setImportText] = useState('');

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
    if (!selectedClassId || !importText.trim()) return;
    
    const names = importText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
    
    names.forEach(name => {
      const parts = name.split(/\s+/);
      const lastName = parts[0]?.toUpperCase() || '';
      const firstName = formatFirstName(parts.slice(1).join(' '));
      
      addStudentToClass(selectedClassId, {
        firstName,
        lastName,
        studentId: '',
        status: 'active'
      });
    });
    
    setImportText('');
    setIsImportDialogOpen(false);
    toast.success(`${names.length} élèves importés avec succès`);
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
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading font-display font-bold text-foreground">
              Gestion des élèves
            </h1>
            <p className="text-muted-foreground">
              Ajoutez, modifiez, archivez ou supprimez des élèves
            </p>
          </div>
        </div>

        {/* Class Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Sélectionner une classe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Choisir une classe..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.students.length} élèves)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedClass && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>
                  Élèves - {selectedClass.name}
                </CardTitle>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Add Student */}
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus size={16} />
                        Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter un élève</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Nom *</Label>
                          <Input
                            id="lastName"
                            placeholder="DUPONT"
                            value={newLastName}
                            onChange={e => setNewLastName(e.target.value)}
                            className="uppercase"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Prénoms</Label>
                          <Input
                            id="firstName"
                            placeholder="Jean Pierre"
                            value={newFirstName}
                            onChange={e => setNewFirstName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddStudent()}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleAddStudent} disabled={!newLastName.trim()}>
                          Ajouter
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Import Students */}
                  <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Upload size={16} />
                        Importer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Importer des élèves</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                          Collez la liste des élèves (un nom par ligne, format: NOM Prénom(s))
                        </p>
                        <Textarea
                          placeholder="DUPONT Jean&#10;MARTIN Marie Claire&#10;..."
                          value={importText}
                          onChange={e => setImportText(e.target.value)}
                          rows={10}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleImportStudents} disabled={!importText.trim()}>
                          Importer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Bulk Archive */}
                  {selectedStudents.size > 0 && (
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="gap-2"
                      onClick={handleBulkArchive}
                    >
                      <Archive size={16} />
                      Archiver ({selectedStudents.size})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un élève..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={showArchived}
                    onCheckedChange={(checked) => setShowArchived(checked as boolean)}
                  />
                  Afficher les archivés
                </label>
              </div>

              {/* Students List */}
              {filteredStudents.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b">
                    <Checkbox
                      checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="font-medium text-sm flex-1">Nom</span>
                    <span className="text-sm text-muted-foreground w-24 text-center">Statut</span>
                    <span className="text-sm text-muted-foreground w-32 text-center">Actions</span>
                  </div>
                  
                  {/* Rows */}
                  {filteredStudents.map(student => (
                    <div 
                      key={student.id}
                      className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={() => {
                          toggleStudentSelection(student.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      {editingStudent?.id === student.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editLastName}
                            onChange={e => setEditLastName(e.target.value)}
                            className="h-8 w-32 uppercase"
                            placeholder="Nom"
                            autoFocus
                          />
                          <Input
                            value={editFirstName}
                            onChange={e => setEditFirstName(e.target.value)}
                            className="h-8 flex-1"
                            placeholder="Prénoms"
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') setEditingStudent(null);
                            }}
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
                            <Check size={16} className="text-success" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingStudent(null)}>
                            <X size={16} className="text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <span className="flex-1 text-sm">{student.lastName} {student.firstName}</span>
                      )}
                      
                      <div className="w-24 flex justify-center">
                        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                          {student.status === 'active' ? 'Actif' : 'Archivé'}
                        </Badge>
                      </div>
                      
                      <div className="w-32 flex justify-center gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={() => handleEditStudent(student)}
                        >
                          <Pencil size={14} className="text-primary" />
                        </Button>
                        
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={() => handleArchiveStudent(student)}
                        >
                          {student.status === 'active' ? (
                            <Archive size={14} className="text-warning" />
                          ) : (
                            <ArchiveRestore size={14} className="text-success" />
                          )}
                        </Button>
                        
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={() => setStudentToDelete(student)}
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'Aucun élève trouvé' : 'Aucun élève dans cette classe'}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedClass && classes.length > 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Sélectionnez une classe pour gérer ses élèves
            </CardContent>
          </Card>
        )}

        {classes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucune classe créée. Créez d'abord une classe pour ajouter des élèves.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'élève{' '}
              <strong>{studentToDelete?.lastName} {studentToDelete?.firstName}</strong>{' '}
              sera supprimé définitivement ainsi que toutes ses notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStudent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default StudentsPage;
