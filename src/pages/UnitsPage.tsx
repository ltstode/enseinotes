import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import UnitCard from '@/components/units/UnitCard';
import CreateUnitDialog from '@/components/units/CreateUnitDialog';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, AlertCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const UnitsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { activeYearId, schoolYears, pedagogicalUnits, getClassesByYear } = useApp();

  const activeYear = schoolYears.find(y => y.id === activeYearId);
  const classes = activeYearId ? getClassesByYear(activeYearId) : [];
  
  // Filter units by active year
  const filteredUnits = pedagogicalUnits.filter(u => u.schoolYearId === activeYearId);
  
  // Check if there's a preselected class from URL
  const preselectedClassId = searchParams.get('class') || undefined;

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowCreateDialog(true);
    }
  }, [searchParams]);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-h1 text-foreground">
              Unités pédagogiques
            </h1>
            <p className="text-muted-foreground mt-2">
              {activeYear 
                ? `Année scolaire ${activeYear.name}`
                : 'Sélectionnez une année scolaire'
              }
            </p>
          </div>
          {activeYearId && classes.length > 0 && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus size={18} />
              Nouvelle unité
            </Button>
          )}
        </div>

        {/* Content */}
        {!activeYearId ? (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl">
            <div className="p-4 rounded-full bg-warning/10 w-fit mx-auto mb-4">
              <AlertCircle className="text-warning" size={48} />
            </div>
            <h2 className="font-display text-h2 mb-2">Aucune année active</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Veuillez d'abord créer et activer une année scolaire.
            </p>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl">
            <div className="p-4 rounded-full bg-warning/10 w-fit mx-auto mb-4">
              <AlertCircle className="text-warning" size={48} />
            </div>
            <h2 className="font-display text-h2 mb-2">Aucune classe disponible</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Créez d'abord au moins une classe avant de pouvoir créer des unités pédagogiques.
            </p>
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <BookOpen className="text-primary" size={48} />
            </div>
            <h2 className="font-display text-h2 mb-2">Aucune unité pédagogique</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Créez votre première unité pédagogique pour commencer à saisir les notes.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus size={18} />
              Créer une unité
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUnits.map((unit, index) => (
              <div 
                key={unit.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
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
