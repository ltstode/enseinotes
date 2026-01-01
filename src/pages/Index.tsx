import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import StatCard from '@/components/dashboard/StatCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuickActions from '@/components/dashboard/QuickActions';
import CreateYearDialog from '@/components/years/CreateYearDialog';
import { Calendar, Users, BookOpen, GraduationCap } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const Index: React.FC = () => {
  const { schoolYears, classRooms, pedagogicalUnits } = useApp();
  const [showYearDialog, setShowYearDialog] = useState(false);
  
  const totalStudents = classRooms.reduce((sum, c) => sum + c.students.filter(s => s.status === 'active').length, 0);

  // Show onboarding if no school years exist
  if (schoolYears.length === 0) {
    return (
      <>
        <WelcomeScreen onGetStarted={() => setShowYearDialog(true)} />
        <CreateYearDialog open={showYearDialog} onOpenChange={setShowYearDialog} />
      </>
    );
  }

  const stats = [
    {
      icon: <Calendar size={24} />,
      label: 'Années scolaires',
      value: schoolYears.length,
      colorClass: 'bg-info/10 text-info',
    },
    {
      icon: <Users size={24} />,
      label: 'Classes',
      value: classRooms.length,
      colorClass: 'bg-success/10 text-success',
    },
    {
      icon: <GraduationCap size={24} />,
      label: 'Élèves',
      value: totalStudents,
      colorClass: 'bg-primary/10 text-primary',
    },
    {
      icon: <BookOpen size={24} />,
      label: 'Unités pédagogiques',
      value: pedagogicalUnits.length,
      colorClass: 'bg-warning/10 text-warning',
    },
  ];

  const activities = [
    ...schoolYears.slice(-3).map(y => ({
      id: `year-${y.id}`,
      type: 'year' as const,
      title: `Année ${y.name} créée`,
      description: `Mode ${y.mode === 'semester' ? 'semestre' : 'trimestre'}`,
      timestamp: 'Récemment',
    })),
    ...classRooms.slice(-3).map(c => ({
      id: `class-${c.id}`,
      type: 'class' as const,
      title: `Classe ${c.name} ajoutée`,
      description: `${c.students.length} élèves`,
      timestamp: 'Récemment',
    })),
  ].slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-h1 text-foreground">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground mt-2">
            Bienvenue dans EnseiNotes. Gérez vos classes et notes en toute simplicité.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} style={{ animationDelay: `${index * 100}ms` }}>
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity activities={activities} />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
