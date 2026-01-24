import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  ClipboardList, 
  ChevronRight, 
  CalendarDays, 
  Timer,
  LayoutDashboard,
  Settings
} from 'lucide-react';
import EditUnitDialog from './EditUnitDialog';
import { PedagogicalUnit } from '@/types/enseinotes';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface UnitCardProps {
  unit: PedagogicalUnit;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit }) => {
  const { classRooms, getStudentsByClass, getEvaluationsByUnit, getPeriodsByUnit } = useApp();
  const navigate = useNavigate();
  
  const classRoom = classRooms.find(c => c.id === unit.classRoomId);
  const students = getStudentsByClass(unit.classRoomId);
  const evaluations = getEvaluationsByUnit(unit.id);
  const periods = getPeriodsByUnit(unit.id);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const displayModeLabels = {
    numeric: 'Note /20',
    percentage: 'Pourcentage',
    letter: 'Lettre',
  };

  const activePeriod = periods.find(p => p.status === 'active');

  return (
    <Card className="group overflow-hidden border-none shadow-soft hover:shadow-xl transition-all duration-500 rounded-3xl bg-card">
      {/* Decorative top bar */}
      <div className="h-2 w-full bg-gradient-to-r from-primary/40 via-primary to-info/40 group-hover:via-info transition-all duration-500"></div>
      
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-primary/5 group-hover:bg-primary/10 transition-colors shadow-inner">
              <BookOpen className="text-primary" size={26} />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {unit.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="rounded-full bg-secondary/30 border-none text-[10px] font-medium px-2 py-0">
                  {classRoom?.name || 'Inconnue'}
                </Badge>
                <div className="h-1 w-1 rounded-full bg-muted-foreground/30"></div>
                <span className="text-xs text-muted-foreground font-medium">
                  Système : {unit.periodSystem}s
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className="rounded-xl bg-primary/10 text-primary border-none shadow-none font-semibold">
              Coef. {unit.rules.coefficient}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary transition-colors hover:bg-secondary/50 shadow-none border-none"
              onClick={() => setShowEditDialog(true)}
            >
              <Settings size={14} />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-secondary/20 border border-secondary-foreground/5 space-y-1 group-hover:bg-card group-hover:shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between">
              <Users size={16} className="text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Effectif</span>
            </div>
            <p className="font-display text-2xl font-semibold text-foreground">{students.length}</p>
            <p className="text-[10px] text-muted-foreground">élèves inscrits</p>
          </div>
          
          <div className="p-4 rounded-2xl bg-secondary/20 border border-secondary-foreground/5 space-y-1 group-hover:bg-card group-hover:shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between">
              <ClipboardList size={16} className="text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Évals</span>
            </div>
            <p className="font-display text-2xl font-semibold text-foreground">{evaluations.length}</p>
            <p className="text-[10px] text-muted-foreground">notes saisies</p>
          </div>
        </div>

        {/* Current Status */}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2">
            <Timer size={14} className="text-primary" />
            <span className="text-xs font-semibold text-primary">
              {activePeriod ? `En cours : ${activePeriod.name}` : 'Période cloturée'}
            </span>
          </div>
          <div className="flex -space-x-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-secondary flex items-center justify-center">
                 <div className={cn("h-1.5 w-1.5 rounded-full", i < (periods.filter(p => p.status === 'completed').length) ? "bg-success" : (i === periods.filter(p => p.status === 'completed').length ? "bg-primary animate-pulse" : "bg-muted"))}></div>
              </div>
            ))}
          </div>
        </div>

        <Button 
          variant="default" 
          className="w-full h-12 rounded-2xl font-display font-medium shadow-soft hover:shadow-lg transition-all duration-300 gap-2 group-hover:gap-4 bg-gradient-to-r from-primary to-info border-none"
          onClick={() => navigate(`/grades?unit=${unit.id}`)}
        >
          <LayoutDashboard size={18} />
          Accéder à la feuille de notes
          <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
        </Button>
      </div>

      <EditUnitDialog 
        unit={unit} 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
      />
    </Card>
  );
};

export default UnitCard;
