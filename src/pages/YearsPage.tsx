import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import YearCard from '@/components/years/YearCard';
import CreateYearDialog from '@/components/years/CreateYearDialog';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Sparkles } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const YearsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { schoolYears } = useApp();

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowCreateDialog(true);
    }
  }, [searchParams]);

  return (
    <AppLayout>
      <div className="no-scroll-container gap-8 py-4">
        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter text-foreground leading-tight flex items-center gap-3">
              Années <span className="text-primary">Scolaires</span>
              <Calendar className="text-soft-orange-foreground" size={32} />
            </h2>
            <p className="text-muted-foreground font-medium">Gérez la chronologie de votre enseignement.</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="h-12 px-8 rounded-2xl gap-2 font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
            <Plus size={18} />
            Nouvelle Année
          </Button>
        </div>

        {/* Content */}
        {schoolYears.length === 0 ? (
          <div className="apple-card p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-soft-orange mx-auto rounded-3xl flex items-center justify-center text-soft-orange-foreground">
              <Calendar size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black italic">Une nouvelle aventure commence ?</h3>
              <p className="text-muted-foreground mt-2">Initialisez votre première année scolaire pour configurer vos classes.</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="rounded-2xl h-12 px-8 font-bold">
              <Plus size={18} className="mr-2" /> Créer une année
            </Button>
          </div>
        ) : (
          <div className="dashboard-grid flex-1">
            {schoolYears.map((year, index) => (
              <div 
                key={year.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <YearCard year={year} />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateYearDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </AppLayout>
  );
};

export default YearsPage;
