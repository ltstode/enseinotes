import React from 'react';
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
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, subValue, icon: Icon, colorClass, delay = 0 }: any) => (
  <div 
    className={cn(
      "apple-card p-6 flex flex-col justify-between group cursor-default animate-fade-in",
      colorClass
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex justify-between items-start mb-8">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest opacity-70">{title}</p>
        <p className="text-3xl font-black">{value}</p>
      </div>
      <div className="p-3 rounded-2xl bg-white/50 border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
        <Icon size={24} />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/40 text-[10px] font-bold">
        <TrendingUp size={10} />
        <span>{subValue}</span>
      </div>
      <span className="text-[10px] font-bold opacity-50">Depuis la semaine dernière</span>
    </div>
  </div>
);

const QuickAction = ({ title, desc, icon: Icon, to, colorClass }: any) => (
  <Link to={to} className="group">
    <div className={cn(
      "p-5 rounded-[2rem] border border-white/40 bg-white/40 backdrop-blur-md flex items-center gap-5 hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-500 group-active:scale-95",
    )}>
      <div className={cn("p-4 rounded-2xl shadow-lg", colorClass)}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-foreground">{title}</h4>
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
  const { classRooms, pedagogicalUnits, periods, grades } = useApp();

  const totalStudents = classRooms.reduce((acc, cls) => acc + cls.students.length, 0);
  const totalGrades = grades.length;
  
  return (
    <AppLayout>
      <div className="no-scroll-container gap-8 py-4">
        {/* Welcome Header */}
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1 animate-fade-in">
            <h2 className="text-4xl font-black tracking-tighter text-foreground leading-tight flex items-center gap-3">
              Ravi de vous revoir, <span className="text-primary">{teacher?.firstName}</span>
              <Sparkles className="text-soft-orange-foreground" size={32} />
            </h2>
            <p className="text-muted-foreground font-medium">Voici un aperçu de vos activités scolaires pour aujourd'hui.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 px-6 rounded-2xl gap-2 font-bold hover:bg-white transition-all shadow-sm">
              <Calendar size={18} />
              Calendrier
            </Button>
            <Button className="h-12 px-8 rounded-2xl gap-2 font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
              <Plus size={18} />
              Nouvelle Note
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid - Top part of image */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Élèves" 
            value={totalStudents} 
            subValue="+12" 
            icon={Users} 
            colorClass="bg-soft-blue"
            delay={0}
          />
          <StatCard 
            title="Classes Gérées" 
            value={classRooms.length} 
            subValue="+2" 
            icon={GraduationCap} 
            colorClass="bg-soft-purple"
            delay={100}
          />
          <StatCard 
            title="Matières (UP)" 
            value={pedagogicalUnits.length} 
            subValue="Actif" 
            icon={BookOpen} 
            colorClass="bg-soft-green"
            delay={200}
          />
          <StatCard 
            title="Evaluations" 
            value={totalGrades} 
            subValue="+85" 
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
              <h3 className="font-display font-black text-xl flex items-center gap-2">
                <Clock className="text-primary" size={20} />
                Actions Rapides
              </h3>
              <Button variant="link" className="text-primary font-bold hover:no-underline">Voir tout</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickAction 
                title="Saisir des notes" 
                desc="Ajoutez des évaluations S1/S2" 
                icon={Plus} 
                to="/grades" 
                colorClass="bg-primary"
              />
              <QuickAction 
                title="Gérer les classes" 
                desc="Mise à jour des effectifs" 
                icon={Users} 
                to="/classes" 
                colorClass="bg-soft-purple-foreground"
              />
              <QuickAction 
                title="Unités Pédagogiques" 
                desc="Configuration des coefficients" 
                icon={BookOpen} 
                to="/units" 
                colorClass="bg-soft-green-foreground"
              />
              <QuickAction 
                title="Années Scolaires" 
                desc="Paramètres du système (Sem/Tri)" 
                icon={Calendar} 
                to="/years" 
                colorClass="bg-soft-orange-foreground"
              />
            </div>

            {/* Recent Activity Table Sketch */}
            <div className="apple-card flex-1 min-h-0 flex flex-col border border-white/40 bg-white/20 backdrop-blur-md mt-2">
              <div className="p-6 border-b border-white/20 flex items-center justify-between">
                <h4 className="font-bold">Dernières évaluations</h4>
                <div className="flex gap-2">
                   <div className="w-8 h-8 rounded-full bg-soft-blue flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                     <TrendingUp size={14} />
                   </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden compact-scrollbar p-1">
                <div className="p-8 text-center space-y-4">
                   <div className="w-20 h-20 bg-soft-blue mx-auto rounded-3xl flex items-center justify-center opacity-50">
                     <ClipboardList size={32} className="text-primary" />
                   </div>
                   <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto">
                     Aucun historique récent. Les dernières évaluations saisies apparaîtront ici pour un accès rapide.
                   </p>
                </div>
              </div>
            </div>
          </div>

          {/* Side Info Panel */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-display font-black text-xl">Statut des Périodes</h3>
            </div>
            
            <div className="apple-card p-6 border-none bg-gradient-to-br from-primary to-accent relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                      <Clock className="text-white" size={20} />
                    </div>
                    <span className="text-xs font-bold text-white/90">Progression globale</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-black text-white">45%</p>
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-loose">Fin du 1er Semestre estimée</p>
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-[45%] bg-white rounded-full"></div>
                  </div>
                  <Button className="w-full bg-white text-primary rounded-xl font-bold hover:bg-white/90 shadow-lg">
                    Détails du Calendrier
                  </Button>
               </div>
            </div>

            <div className="apple-card p-6 border border-white/40 bg-white shadow-sm space-y-6">
               <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Conseils de productivité</h4>
               <div className="space-y-4">
                  {[
                    { t: "Raccourcis clavier", d: "Appuyez sur 'N' pour ajouter une note", i: Sparkles },
                    { t: "Suivi des moyennes", d: "L'UP calcule vos moyennes en temps réel", i: TrendingUp },
                  ].map((tip, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <tip.i size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{tip.t}</p>
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
