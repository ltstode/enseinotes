import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import UnitCard from '@/components/units/UnitCard';
import CreateUnitDialog from '@/components/units/CreateUnitDialog';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const UnitsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { activeYearId, schoolYears, pedagogicalUnits, getClassesByYear } = useApp();

  const activeYear = schoolYears.find(y => y.id === activeYearId);
  const classes = activeYearId ? getClassesByYear(activeYearId) : [];
  const filteredUnits = pedagogicalUnits.filter(u => u.schoolYearId === activeYearId);
  const preselectedClassId = searchParams.get('class') || undefined;

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
            <h2 className="text-3xl font-semibold tracking-tight text-foreground leading-tight flex items-center gap-3">
              Unités <span className="text-primary">Pédagogiques</span>
              <BookOpen className="text-soft-blue-foreground" size={28} />
            </h2>
            <p className="text-muted-foreground">
              {activeYear 
                ? `Programmes pour l'année scolaire ${activeYear.name}`
                : 'Sélectionnez une année dans les paramètres pour commencer.'
              }
            </p>
          </div>
          {activeYearId && classes.length > 0 && (
            <Button onClick={() => setShowCreateDialog(true)} className="h-11 px-6 rounded-2xl gap-2 font-medium shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              <Plus size={18} />
              Nouvelle Unité
            </Button>
          )}
        </div>

        {/* Content */}
        {!activeYearId ? (
          <div className="apple-card p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-soft-orange mx-auto rounded-3xl flex items-center justify-center text-soft-orange-foreground">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-semibold">Année Scolaire Requise</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Veuillez d'abord créer et activer une année scolaire pour gérer vos unités.</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="apple-card p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-soft-purple mx-auto rounded-3xl flex items-center justify-center text-soft-purple-foreground">
              <Sparkles size={32} />
            </div>
            <h3 className="text-xl font-semibold">Classes Manquantes</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Créez d'abord au moins une classe pour y associer des unités pédagogiques.</p>
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="apple-card p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-soft-blue mx-auto rounded-3xl flex items-center justify-center text-primary">
              <BookOpen size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Lancez votre programme !</h3>
              <p className="text-muted-foreground mt-2">Créez votre première unité pédagogique (Français, Mathématiques...) pour commencer à suivre vos élèves.</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="rounded-2xl h-11 px-6 font-medium">
              <Plus size={18} className="mr-2" /> Créer une unité
            </Button>
          </div>
        ) : (
          <div className="dashboard-grid flex-1">
            {filteredUnits.map((unit, index) => (
              <div 
                key={unit.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <UnitCard unit={unit} />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateUnitDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        preselectedClassId={preselectedClassId}
      />
    </AppLayout>
  );
};

export default UnitsPage;
