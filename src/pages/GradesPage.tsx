import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import GradeSheet from '@/components/grades/GradeSheet';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardList, AlertCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const GradesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeYearId, schoolYears, pedagogicalUnits, classRooms } = useApp();

  const activeYear = schoolYears.find(y => y.id === activeYearId);
  const filteredUnits = pedagogicalUnits.filter(u => u.schoolYearId === activeYearId);
  
  const selectedUnitId = searchParams.get('unit');
  const selectedUnit = filteredUnits.find(u => u.id === selectedUnitId);

  const handleUnitChange = (unitId: string) => {
    setSearchParams({ unit: unitId });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-h1 text-foreground">
              Saisie des notes
            </h1>
            <p className="text-muted-foreground mt-2">
              {activeYear 
                ? `Année scolaire ${activeYear.name}`
                : 'Sélectionnez une année scolaire'
              }
            </p>
          </div>
          
          {filteredUnits.length > 0 && (
            <div className="w-72">
              <Select value={selectedUnitId || ''} onValueChange={handleUnitChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Sélectionnez une unité" />
                </SelectTrigger>
                <SelectContent>
                  {filteredUnits.map((unit) => {
                    const classRoom = classRooms.find(c => c.id === unit.classRoomId);
                    return (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({classRoom?.name})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
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
        ) : filteredUnits.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl">
            <div className="p-4 rounded-full bg-warning/10 w-fit mx-auto mb-4">
              <AlertCircle className="text-warning" size={48} />
            </div>
            <h2 className="font-display text-h2 mb-2">Aucune unité pédagogique</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Créez d'abord des unités pédagogiques pour pouvoir saisir des notes.
            </p>
          </div>
        ) : !selectedUnit ? (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <ClipboardList className="text-primary" size={48} />
            </div>
            <h2 className="font-display text-h2 mb-2">Sélectionnez une unité</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Choisissez une unité pédagogique dans le menu déroulant pour accéder au tableau de notes.
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <GradeSheet unit={selectedUnit} />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default GradesPage;
