import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import YearCard from '@/components/years/YearCard';
import CreateYearDialog from '@/components/years/CreateYearDialog';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-h1 text-foreground">
              Années scolaires
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos années scolaires et leur structure
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus size={18} />
            Nouvelle année
          </Button>
        </div>

        {/* Years Grid */}
        {schoolYears.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <Calendar className="text-primary" size={48} />
            </div>
            <h2 className="font-display text-h2 mb-2">Aucune année scolaire</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Commencez par créer votre première année scolaire pour structurer vos classes et unités pédagogiques.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus size={18} />
              Créer une année scolaire
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schoolYears.map((year, index) => (
              <div 
                key={year.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
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
