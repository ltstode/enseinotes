import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, BookOpen, ChevronRight, Pencil, Trash2, Check, X, Calendar, UserPlus } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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
      toast({ title: 'Erreur', description: 'Le nom de la classe est requis.', variant: 'destructive' });
      return;
    }
    updateClassRoom(classRoom.id, { name: editName.trim() });
    setIsEditing(false);
    toast({ title: 'Succès ✨', description: 'Classe renommée.' });
  };

  const handleCancelEdit = () => {
    setEditName(classRoom.name);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteClassRoom(classRoom.id);
    setShowDeleteDialog(false);
    toast({ title: 'Supprimé', description: `Classe ${classRoom.name} effacée.` });
  };

  return (
    <>
      <div className="apple-card group hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 overflow-hidden flex flex-col h-full border border-white/40 bg-white/70 backdrop-blur-md">
        {/* Top Decorative Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-soft-purple to-soft-blue"></div>
        
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3.5 rounded-2xl bg-soft-purple shadow-inner text-soft-purple-foreground">
                <Users size={24} />
              </div>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-10 text-lg font-black rounded-xl bg-white border-primary/20"
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" onClick={handleSaveEdit} className="h-10 w-10 hover:bg-soft-green text-soft-green-foreground">
                      <Check size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-10 w-10 hover:bg-soft-pink text-soft-pink-foreground">
                      <X size={18} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-black tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                      {classRoom.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      <Calendar size={10} />
                      {new Date(classRoom.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {!isEditing && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8 rounded-lg hover:bg-secondary">
                  <Pencil size={14} className="text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowDeleteDialog(true)} className="h-8 w-8 rounded-lg hover:bg-soft-pink text-soft-pink-foreground">
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
             <div className="p-4 rounded-[1.5rem] bg-soft-purple/30 border border-soft-purple-foreground/10 flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-soft-purple-foreground/70 mb-1">Élèves</span>
                <p className="text-3xl font-black text-soft-purple-foreground">{classRoom.students.length}</p>
             </div>
             <div className="p-4 rounded-[1.5rem] bg-soft-blue/30 border border-soft-blue-foreground/10 flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-soft-blue-foreground/70 mb-1">Unités</span>
                <p className="text-3xl font-black text-soft-blue-foreground">{units.length}</p>
             </div>
          </div>

          {classRoom.students.length > 0 ? (
            <div className="mb-6 flex-1">
              <div className="flex items-center gap-2 mb-3">
                 <UserPlus size={12} className="text-muted-foreground" />
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Effectif</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {classRoom.students.slice(0, 4).map((student) => (
                  <div
                    key={student.id}
                    className="px-3 py-1.5 rounded-xl bg-white/60 text-[10px] font-bold text-foreground border border-white/40 shadow-sm"
                  >
                    {student.lastName}
                  </div>
                ))}
                {classRoom.students.length > 4 && (
                  <div className="px-3 py-1.5 rounded-xl bg-muted/30 text-[10px] font-bold text-muted-foreground">
                    +{classRoom.students.length - 4}
                  </div>
                )}
              </div>
            </div>
          ) : (
             <div className="mb-6 flex-1 flex flex-col items-center justify-center border-2 border-dashed border-muted/20 rounded-2xl py-4 group/add cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigate(`/students?class=${classRoom.id}`)}>
                <UserPlus size={20} className="text-muted-foreground group-hover/add:text-primary transition-colors mb-2" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Ajouter des élèves</span>
             </div>
          )}

          <div className="mt-auto pt-4 flex gap-2">
            <Button 
              variant="default" 
              className="flex-1 rounded-2xl h-11 font-bold shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-all gap-2"
              onClick={() => navigate(`/units?class=${classRoom.id}`)}
            >
              Gérer Unités
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              className="w-11 h-11 rounded-2xl border-dashed hover:bg-white hover:text-primary transition-all shadow-sm"
              onClick={() => navigate(`/students?class=${classRoom.id}`)}
              title="Voir les élèves"
            >
              <Users size={18} />
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-soft-pink-foreground">Détruire cette classe ?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-muted-foreground py-2 leading-relaxed">
              La classe <b>{classRoom.name}</b> sera effacée avec ses <b>{units.length} unités</b> et toutes les notes. 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-none bg-secondary hover:bg-secondary/70">Oublier</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-soft-pink-foreground text-white hover:bg-soft-pink-foreground/90 shadow-lg shadow-soft-pink-foreground/20 font-bold px-8">
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClassCard;
