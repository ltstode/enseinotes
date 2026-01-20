import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ClassCard from '@/components/classes/ClassCard';
import CreateClassDialog from '@/components/classes/CreateClassDialog';
import { Button } from '@/components/ui/button';
import { Plus, Users, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const ClassesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { activeYearId, schoolYears, getClassesByYear } = useApp();

  const activeYear = schoolYears.find(y => y.id === activeYearId);
  const classes = activeYearId ? getClassesByYear(activeYearId) : [];

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
              Mes <span className="text-primary">Classes</span>
              <Users className="text-soft-purple-foreground" size={32} />
            </h2>
            <p className="text-muted-foreground font-medium">
              {activeYear 
                ? `Liste des classes pour l'année ${activeYear.name}`
                : 'Sélectionnez une année scolaire active.'
              }
            </p>
          </div>
          {activeYearId && (
            <Button onClick={() => setShowCreateDialog(true)} className="h-12 px-8 rounded-2xl gap-2 font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
              <Plus size={18} />
              Nouvelle Classe
            </Button>
          )}
        </div>

        {/* Content */}
        {!activeYearId ? (
          <div className="apple-card p-20 text-center space-y-4">
             <div className="w-16 h-16 bg-soft-orange mx-auto rounded-3xl flex items-center justify-center text-soft-orange-foreground">
               <AlertCircle size={32} />
             </div>
             <h3 className="text-xl font-bold">Configuration Requise</h3>
             <p className="text-muted-foreground max-w-sm mx-auto">Veuillez d'abord définir une année scolaire active dans les paramètres.</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="apple-card p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-soft-purple mx-auto rounded-3xl flex items-center justify-center text-primary">
              <Users size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black italic">Bienvenue dans votre espace !</h3>
              <p className="text-muted-foreground mt-2">Commencez par créer votre première classe (ex: 3ème A, Terminale S...)</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="rounded-2xl h-12 px-8 font-bold">
              <Plus size={18} className="mr-2" /> Créer une classe
            </Button>
          </div>
        ) : (
          <div className="dashboard-grid flex-1">
            {classes.map((classRoom, index) => (
              <div 
                key={classRoom.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ClassCard classRoom={classRoom} />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateClassDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </AppLayout>
  );
};

export default ClassesPage;
