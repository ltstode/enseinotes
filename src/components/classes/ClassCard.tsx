import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, ChevronRight } from 'lucide-react';
import { ClassRoom } from '@/types/enseinotes';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface ClassCardProps {
  classRoom: ClassRoom;
}

const ClassCard: React.FC<ClassCardProps> = ({ classRoom }) => {
  const { getUnitsByClass } = useApp();
  const navigate = useNavigate();
  const units = getUnitsByClass(classRoom.id);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-success/10">
            <Users className="text-success" size={24} />
          </div>
          <div>
            <h3 className="font-display text-h3 font-semibold">{classRoom.name}</h3>
            <p className="text-small text-muted-foreground">
              Créée le {new Date(classRoom.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
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
  );
};

export default ClassCard;
