import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, BookOpen, ChevronRight, Check } from 'lucide-react';
import { SchoolYear } from '@/types/enseinotes';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
    <div className={cn(
      "apple-card p-6 border transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between h-full",
      isActive 
        ? "border-primary/50 bg-white ring-4 ring-primary/5 shadow-2xl shadow-primary/10" 
        : "border-white/40 bg-white/70 backdrop-blur-md"
    )}>
      <div>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3.5 rounded-2xl shadow-inner transition-colors",
              isActive ? "bg-primary text-white" : "bg-soft-orange text-soft-orange-foreground"
            )}>
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-foreground">{year.name}</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                Système {year.mode === 'semester' ? 'Semestriel' : 'Trimestriel'}
              </p>
            </div>
          </div>
          {isActive && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-tighter border border-success/20">
              <Check size={12} />
              Active
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="p-4 rounded-2xl bg-secondary/30 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Classes</span>
            <p className="text-2xl font-black text-foreground">{classes.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/30 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Élèves</span>
            <p className="text-2xl font-black text-foreground">{totalStudents}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5">
        {!isActive && (
          <Button 
            variant="ghost" 
            onClick={handleActivate} 
            className="flex-1 rounded-xl h-12 font-bold hover:bg-white hover:shadow-sm"
          >
            Activer
          </Button>
        )}
        <Button 
          variant={isActive ? "default" : "secondary"} 
          onClick={handleViewClasses}
          className={cn(
            "flex-1 rounded-xl h-12 font-bold transition-all gap-2",
            isActive && "shadow-lg shadow-primary/20 hover:scale-[1.02]"
          )}
        >
          {isActive ? 'Ouvrir' : 'Explorer'}
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
};

export default YearCard;
