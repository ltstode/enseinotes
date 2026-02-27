import React, { useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  BookOpen, 
  ClipboardList, 
  GraduationCap, 
  TrendingUp,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  subValue: string;
  icon: LucideIcon;
  colorClass: string;
  delay?: number;
}

const StatCard = ({ title, value, subValue, icon: Icon, colorClass, delay = 0 }: StatCardProps) => (
  <div 
    className={cn(
      "apple-card p-6 flex flex-col justify-between group cursor-default animate-fade-in",
      colorClass
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex justify-between items-start mb-8">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">{title}</p>
        <p className="text-3xl font-semibold">{value}</p>
      </div>
      <div className="p-3 rounded-xl bg-card/50 border border-border/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
        <Icon size={24} />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-card/40 text-[10px] font-medium">
        <TrendingUp size={10} />
        <span>{subValue}</span>
      </div>
    </div>
  </div>
);

interface QuickActionProps {
  title: string;
  desc: string;
  icon: LucideIcon;
  to: string;
  colorClass: string;
}

const QuickAction = ({ title, desc, icon: Icon, to, colorClass }: QuickActionProps) => (
  <Link to={to} className="group">
    <div className={cn(
      "p-5 rounded-xl border border-border/60 bg-card backdrop-blur-md flex items-center gap-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-500 group-active:scale-95",
    )}>
      <div className={cn("p-4 rounded-xl shadow-lg", colorClass)}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500">
        <ArrowRight size={14} />
      </div>
    </div>
  </Link>
);

const Index = () => {
  const { teacher } = useAuth();
  const { classRooms, pedagogicalUnits, evaluations, grades, periods, activeYearId } = useApp();
  const navigate = useNavigate();

  // Real statistics computed from actual data
  const stats = useMemo(() => {
    const activeClasses = classRooms.filter(c => c.schoolYearId === activeYearId);
    const totalStudents = activeClasses.reduce((acc, cls) => acc + cls.students.filter(s => s.status === 'active').length, 0);
    const activeUnits = pedagogicalUnits.filter(u => u.schoolYearId === activeYearId);
    const unitIds = new Set(activeUnits.map(u => u.id));
    const activeEvals = evaluations.filter(e => unitIds.has(e.pedagogicalUnitId));
    const activePeriods = periods.filter(p => unitIds.has(p.pedagogicalUnitId));
    const activeGrades = grades.filter(g => activeEvals.some(e => e.id === g.evaluationId));

    // Period progress
    const totalPeriods = activePeriods.length;
    const completedPeriods = activePeriods.filter(p => p.status === 'completed').length;
    const periodProgress = totalPeriods > 0 ? Math.round((completedPeriods / totalPeriods) * 100) : 0;

    // Current active period label
    const currentActivePeriod = activePeriods.find(p => p.status === 'active');
    let periodLabel = 'Aucune période active';
    if (currentActivePeriod) {
      if (currentActivePeriod.endDate) {
        const daysLeft = differenceInDays(new Date(currentActivePeriod.endDate), new Date());
        periodLabel = daysLeft > 0 ? `${daysLeft}j restants` : 'Se termine bientôt';
      } else {
        periodLabel = currentActivePeriod.name;
      }
    }

    return {
      totalStudents,
      totalClasses: activeClasses.length,
      totalUnits: activeUnits.length,
      totalEvals: activeEvals.length,
      totalGrades: activeGrades.length,
      periodProgress,
      periodLabel,
      currentPeriodName: currentActivePeriod?.name || '',
    };
  }, [classRooms, pedagogicalUnits, evaluations, grades, periods, activeYearId]);

  // Recent evaluations
  const recentEvals = useMemo(() => {
    const activeUnits = pedagogicalUnits.filter(u => u.schoolYearId === activeYearId);
    const unitIds = new Set(activeUnits.map(u => u.id));
    return evaluations
      .filter(e => unitIds.has(e.pedagogicalUnitId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(ev => {
        const unit = activeUnits.find(u => u.id === ev.pedagogicalUnitId);
        const cls = classRooms.find(c => c.id === unit?.classRoomId);
        const gradeCount = grades.filter(g => g.evaluationId === ev.id).length;
        return { ...ev, unitName: unit?.name || '', className: cls?.name || '', gradeCount };
      });
  }, [evaluations, pedagogicalUnits, classRooms, grades, activeYearId]);

  return (
    <AppLayout>
      <div className="no-scroll-container gap-8 py-4">
        {/* Welcome Header */}
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1 animate-fade-in">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground leading-tight flex items-center gap-3">
              Ravi de vous revoir, <span className="text-primary">{teacher?.firstName}</span>
              <Sparkles className="text-soft-orange-foreground" size={28} />
            </h2>
            <p className="text-muted-foreground">Voici un aperçu de vos activités scolaires pour aujourd'hui.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 px-6 rounded-2xl gap-2 font-medium hover:bg-card transition-all shadow-sm" onClick={() => navigate('/calendar')}>
              <Calendar size={18} />
              Calendrier
            </Button>
            <Button className="h-11 px-6 rounded-2xl gap-2 font-medium shadow-lg shadow-primary/20 hover:scale-105 transition-all" onClick={() => navigate('/grades')}>
              <Plus size={18} />
              Nouvelle Note
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Élèves" 
            value={stats.totalStudents} 
            subValue={`${stats.totalClasses} classe${stats.totalClasses !== 1 ? 's' : ''}`}
            icon={Users} 
            colorClass="bg-soft-blue"
            delay={0}
          />
          <StatCard 
            title="Classes Gérées" 
            value={stats.totalClasses} 
            subValue="Année en cours"
            icon={GraduationCap} 
            colorClass="bg-soft-purple"
            delay={100}
          />
          <StatCard 
            title="Matières (UP)" 
            value={stats.totalUnits} 
            subValue={`${stats.totalEvals} éval${stats.totalEvals !== 1 ? 's' : ''}`}
            icon={BookOpen} 
            colorClass="bg-soft-green"
            delay={200}
          />
          <StatCard 
            title="Notes saisies" 
            value={stats.totalGrades} 
            subValue={`${stats.totalEvals} évaluations`}
            icon={ClipboardList} 
            colorClass="bg-soft-pink"
            delay={300}
          />
        </div>

        {/* Lower Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
          {/* Main Activity Area */}
          <div className="lg:col-span-2 space-y-6 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <Clock className="text-primary" size={18} />
                Actions Rapides
              </h3>
              <Button variant="link" className="text-primary font-medium hover:no-underline" onClick={() => navigate('/grades')}>Voir tout</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickAction 
                title="Saisir des notes" 
                desc="Ajoutez des évaluations" 
                icon={Plus} 
                to="/grades" 
                colorClass="bg-primary"
              />
              <QuickAction 
                title="Gérer les classes" 
                desc="Mise à jour des effectifs" 
                icon={Users} 
                to="/classes" 
                colorClass="bg-[hsl(270,70%,50%)]"
              />
              <QuickAction 
                title="Unités Pédagogiques" 
                desc="Configuration des coefficients" 
                icon={BookOpen} 
                to="/units" 
                colorClass="bg-[hsl(150,70%,35%)]"
              />
              <QuickAction 
                title="Années Scolaires" 
                desc="Paramètres du système (Sem/Tri)" 
                icon={Calendar} 
                to="/years" 
                colorClass="bg-[hsl(25,90%,45%)]"
              />
            </div>

            {/* Recent Evaluations */}
            <div className="apple-card flex-1 min-h-0 flex flex-col border border-border/60 bg-card backdrop-blur-md mt-2">
              <div className="p-6 border-b border-border/20 flex items-center justify-between">
                <h4 className="font-medium">Dernières évaluations</h4>
                <div className="flex gap-2">
                   <div className="w-8 h-8 rounded-full bg-soft-blue flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                     <TrendingUp size={14} />
                   </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden compact-scrollbar p-1">
                {recentEvals.length === 0 ? (
                  <div className="p-8 text-center space-y-4">
                     <div className="w-20 h-20 bg-soft-blue mx-auto rounded-3xl flex items-center justify-center opacity-50">
                       <ClipboardList size={32} className="text-primary" />
                     </div>
                     <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                       Aucun historique récent. Les dernières évaluations saisies apparaîtront ici.
                     </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/20">
                    {recentEvals.map(ev => (
                      <div key={ev.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/grades?unit=${ev.pedagogicalUnitId}`)}>
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          ev.type === 'devoir' ? 'bg-soft-purple' : 'bg-soft-blue'
                        )}>
                          <ClipboardList size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ev.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{ev.unitName} · {ev.className}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium">{ev.gradeCount} note{ev.gradeCount !== 1 ? 's' : ''}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Info Panel */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-display font-semibold text-lg">Statut des Périodes</h3>
            </div>
            
            <div className="apple-card p-6 border-none bg-gradient-to-br from-primary to-accent relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                      <Clock className="text-white" size={20} />
                    </div>
                    <span className="text-xs font-medium text-white/90">Progression globale</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-semibold text-white">{stats.periodProgress}%</p>
                    <p className="text-[10px] font-medium text-white/70 uppercase tracking-wide leading-loose">
                      {stats.currentPeriodName ? `${stats.currentPeriodName} · ${stats.periodLabel}` : 'Aucune période active'}
                    </p>
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${stats.periodProgress}%` }}></div>
                  </div>
                  <Button className="w-full bg-white text-primary rounded-xl font-medium hover:bg-white/90 shadow-lg" onClick={() => navigate('/calendar')}>
                    Détails du Calendrier
                  </Button>
               </div>
            </div>

            <div className="apple-card p-6 border border-border/60 bg-card shadow-sm space-y-6">
               <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Conseils de productivité</h4>
               <div className="space-y-4">
                  {[
                    { t: "Raccourcis clavier", d: "Ctrl+K pour rechercher, N pour nouvelle note", i: Sparkles },
                    { t: "Suivi des moyennes", d: "L'UP calcule vos moyennes en temps réel", i: TrendingUp },
                  ].map((tip, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <tip.i size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{tip.t}</p>
                        <p className="text-[10px] text-muted-foreground">{tip.d}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
