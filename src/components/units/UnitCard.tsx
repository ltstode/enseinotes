import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, ClipboardList, ChevronRight } from 'lucide-react';
import { PedagogicalUnit } from '@/types/enseinotes';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface UnitCardProps {
  unit: PedagogicalUnit;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit }) => {
  const { classRooms, getStudentsByClass, getEvaluationsByUnit } = useApp();
  const navigate = useNavigate();
  
  const classRoom = classRooms.find(c => c.id === unit.classRoomId);
  const students = getStudentsByClass(unit.classRoomId);
  const evaluations = getEvaluationsByUnit(unit.id);

  const displayModeLabels = {
    numeric: 'Note /20',
    percentage: 'Pourcentage',
    letter: 'Lettre',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <BookOpen className="text-primary" size={24} />
          </div>
          <div>
            <h3 className="font-display text-h3 font-semibold">{unit.name}</h3>
            <p className="text-small text-muted-foreground">
              Classe : {classRoom?.name || 'Inconnue'}
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          Coef. {unit.rules.coefficient}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-secondary/50 text-center">
          <Users size={18} className="mx-auto text-muted-foreground mb-1" />
          <p className="font-display font-bold">{students.length}</p>
          <p className="text-small text-muted-foreground">élèves</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 text-center">
          <ClipboardList size={18} className="mx-auto text-muted-foreground mb-1" />
          <p className="font-display font-bold">{evaluations.length}</p>
          <p className="text-small text-muted-foreground">évaluations</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 text-center">
          <p className="text-small text-muted-foreground mb-1">Affichage</p>
          <p className="font-medium text-small">{displayModeLabels[unit.rules.displayMode]}</p>
        </div>
      </div>

      <Button 
        variant="default" 
        className="w-full"
        onClick={() => navigate(`/grades?unit=${unit.id}`)}
      >
        Gérer les notes
        <ChevronRight size={16} />
      </Button>
    </Card>
  );
};

export default UnitCard;
