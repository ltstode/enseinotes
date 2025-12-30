import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ClassCard from '@/components/classes/ClassCard';
import CreateClassDialog from '@/components/classes/CreateClassDialog';
import { Button } from '@/components/ui/button';
import { Plus, Users, AlertCircle } from 'lucide-react';
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-h1 text-foreground">
              Classes
            </h1>
            <p className="text-muted-foreground mt-2">
              {activeYear 
                ? `Année scolaire ${activeYear.name}`
                : 'Sélectionnez une année scolaire'
              }
            </p>
          </div>
          {activeYearId && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus size={18} />
              Nouvelle classe
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
              Veuillez d'abord créer et activer une année scolaire pour gérer vos classes.
            </p>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl">
            <div className="p-4 rounded-full bg-success/10 w-fit mx-auto mb-4">
              <Users className="text-success" size={48} />
            </div>
            <h2 className="font-display text-h2 mb-2">Aucune classe</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Créez votre première classe pour commencer à gérer vos élèves et unités pédagogiques.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus size={18} />
              Créer une classe
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classRoom, index) => (
              <div 
                key={classRoom.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
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
