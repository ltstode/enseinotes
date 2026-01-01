import React from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Users, ClipboardList } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: <BookOpen className="text-primary" size={24} />,
      title: 'Unités pédagogiques',
      description: 'Gérez vos matières avec des règles de calcul personnalisées',
    },
    {
      icon: <Users className="text-success" size={24} />,
      title: 'Classes & Élèves',
      description: 'Une liste d\'élèves unique par classe, réutilisée partout',
    },
    {
      icon: <ClipboardList className="text-warning" size={24} />,
      title: 'Notes sécurisées',
      description: 'Saisie rapide avec historique et verrouillage automatique',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-primary mx-auto flex items-center justify-center shadow-elevated mb-6">
            <GraduationCap className="text-primary-foreground" size={40} />
          </div>
          <h1 className="font-display text-h1 text-foreground mb-4">
            Bienvenue sur EnseiNotes
          </h1>
          <p className="text-body text-muted-foreground max-w-md mx-auto">
            Cet outil remplace votre cahier de notes. Configurez une fois, utilisez toute l'année.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-card border shadow-soft animate-fade-in"
              style={{ animationDelay: `${(index + 1) * 150}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
                {feature.icon}
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-small text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <Button 
            size="lg" 
            onClick={onGetStarted}
            className="h-14 px-8 text-lg font-display shadow-elevated hover:shadow-soft transition-shadow"
          >
            Créer ma première année scolaire
          </Button>
          <p className="text-small text-muted-foreground mt-4">
            Commencez par créer une année scolaire pour structurer votre travail
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
