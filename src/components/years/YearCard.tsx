import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, BookOpen, ChevronRight } from 'lucide-react';
import { SchoolYear } from '@/types/enseinotes';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface YearCardProps {
  year: SchoolYear;
}

const YearCard: React.FC<YearCardProps> = ({ year }) => {
  const { getClassesByYear, setActiveYear, activeYearId } = useApp();
  const navigate = useNavigate();
  const classes = getClassesByYear(year.id);
  const isActive = year.id === activeYearId;

  const handleActivate = () => {
    setActiveYear(year.id);
  };

  const handleViewClasses = () => {
    setActiveYear(year.id);
    navigate('/classes');
  };

  const totalStudents = classes.reduce((sum, c) => sum + c.students.length, 0);

  return (
    <Card className={`p-6 ${isActive ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Calendar className="text-primary" size={24} />
          </div>
          <div>
            <h3 className="font-display text-h3 font-semibold">{year.name}</h3>
            <p className="text-small text-muted-foreground capitalize">
              {year.mode === 'semester' ? 'Semestres' : 'Trimestres'}
            </p>
          </div>
        </div>
        {isActive && (
          <Badge className="bg-success/10 text-success border-0">
            Active
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users size={18} />
          <span className="text-small">{classes.length} classes</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen size={18} />
          <span className="text-small">{totalStudents} élèves</span>
        </div>
      </div>

      <div className="flex gap-2">
        {!isActive && (
          <Button variant="outline" size="sm" onClick={handleActivate} className="flex-1">
            Activer
          </Button>
        )}
        <Button 
          variant={isActive ? "default" : "secondary"} 
          size="sm" 
          onClick={handleViewClasses}
          className="flex-1"
        >
          Voir les classes
          <ChevronRight size={16} />
        </Button>
      </div>
    </Card>
  );
};

export default YearCard;
