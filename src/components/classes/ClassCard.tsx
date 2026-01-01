import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, BookOpen, ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react';
import { ClassRoom } from '@/types/enseinotes';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
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
import { useToast } from '@/hooks/use-toast';

interface ClassCardProps {
  classRoom: ClassRoom;
}

const ClassCard: React.FC<ClassCardProps> = ({ classRoom }) => {
  const { getUnitsByClass, updateClassRoom, deleteClassRoom } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const units = getUnitsByClass(classRoom.id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(classRoom.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom de la classe ne peut pas être vide',
        variant: 'destructive',
      });
      return;
    }
    updateClassRoom(classRoom.id, { name: editName.trim() });
    setIsEditing(false);
    toast({
      title: 'Classe modifiée',
      description: 'Le nom de la classe a été mis à jour',
    });
  };

  const handleCancelEdit = () => {
    setEditName(classRoom.name);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteClassRoom(classRoom.id);
    setShowDeleteDialog(false);
    toast({
      title: 'Classe supprimée',
      description: `La classe ${classRoom.name} a été supprimée`,
    });
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-3 rounded-xl bg-success/10">
              <Users className="text-success" size={24} />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-9"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <Button variant="ghost" size="sm" onClick={handleSaveEdit} className="h-9 w-9 p-0">
                    <Check size={16} className="text-success" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-9 w-9 p-0">
                    <X size={16} className="text-destructive" />
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-h3 font-semibold">{classRoom.name}</h3>
                  <p className="text-small text-muted-foreground">
                    Créée le {new Date(classRoom.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </>
              )}
            </div>
          </div>
          {!isEditing && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0">
                <Pencil size={14} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDeleteDialog(true)} 
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users size={16} />
              <span className="text-small">Élèves</span>
            </div>
            <p className="font-display text-h2 font-bold">{classRoom.students.length}</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BookOpen size={16} />
              <span className="text-small">Unités</span>
            </div>
            <p className="font-display text-h2 font-bold">{units.length}</p>
          </div>
        </div>

        {classRoom.students.length > 0 && (
          <div className="mb-4">
            <p className="text-small text-muted-foreground mb-2">Premiers élèves :</p>
            <div className="flex flex-wrap gap-2">
              {classRoom.students.slice(0, 5).map((student) => (
                <span
                  key={student.id}
                  className="px-3 py-1 rounded-full bg-secondary text-small"
                >
                  {student.lastName} {student.firstName[0]}.
                </span>
              ))}
              {classRoom.students.length > 5 && (
                <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-small">
                  +{classRoom.students.length - 5} autres
                </span>
              )}
            </div>
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate(`/units?class=${classRoom.id}`)}
        >
          Gérer les unités
          <ChevronRight size={16} />
        </Button>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la classe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La classe <strong>{classRoom.name}</strong> sera supprimée 
              avec toutes ses unités pédagogiques, évaluations et notes associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClassCard;
