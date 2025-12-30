import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Users, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: <Calendar size={20} />,
      label: 'Nouvelle année scolaire',
      description: 'Créer une année scolaire',
      action: () => navigate('/years?new=true'),
      variant: 'default' as const,
    },
    {
      icon: <Users size={20} />,
      label: 'Nouvelle classe',
      description: 'Ajouter une classe',
      action: () => navigate('/classes?new=true'),
      variant: 'outline' as const,
    },
    {
      icon: <BookOpen size={20} />,
      label: 'Nouvelle unité',
      description: 'Créer une unité pédagogique',
      action: () => navigate('/units?new=true'),
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className="w-full justify-start h-auto py-4 px-4"
            onClick={action.action}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {action.icon}
              </div>
              <div className="text-left">
                <p className="font-medium">{action.label}</p>
                <p className="text-small text-muted-foreground font-normal">
                  {action.description}
                </p>
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
