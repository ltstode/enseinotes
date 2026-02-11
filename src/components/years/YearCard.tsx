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
      "rounded-2xl p-6 border transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between h-full",
      isActive 
        ? "border-white/25 bg-card ring-4 ring-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.4),0_2px_4px_0_rgba(9,9,11,0.08),0_4px_8px_0_rgba(9,9,11,0.12),inset_0_1px_20px_0_rgba(255,255,255,0.16)]" 
        : "border-white/25 bg-card/70 backdrop-blur-md shadow-[0_0_0_1px_hsl(var(--border)),0_1px_2px_0_rgba(9,9,11,0.06),0_2px_4px_0_rgba(9,9,11,0.1),inset_0_1px_20px_0_rgba(255,255,255,0.12)] hover:shadow-[0_0_0_1px_hsl(var(--border)),0_4px_8px_0_rgba(9,9,11,0.08),0_8px_16px_0_rgba(9,9,11,0.14),inset_0_1px_20px_0_rgba(255,255,255,0.18)]"
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
              <h3 className="text-xl font-semibold tracking-tight text-foreground">{year.name}</h3>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-0.5">
                Système {year.mode === 'semester' ? 'Semestriel' : 'Trimestriel'}
              </p>
            </div>
          </div>
          {isActive && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-medium uppercase tracking-tight border border-success/20">
              <Check size={12} />
              Active
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="p-4 rounded-2xl bg-secondary/30 flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Classes</span>
            <p className="text-2xl font-semibold text-foreground">{classes.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/30 flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Élèves</span>
            <p className="text-2xl font-semibold text-foreground">{totalStudents}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5">
        {!isActive && (
          <Button 
            variant="ghost" 
            onClick={handleActivate} 
            className="flex-1 rounded-xl h-11 font-medium hover:bg-card hover:shadow-sm"
          >
            Activer
          </Button>
        )}
        <Button 
          variant={isActive ? "default" : "secondary"} 
          onClick={handleViewClasses}
          className={cn(
            "flex-1 rounded-xl h-11 font-medium transition-all gap-2",
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
