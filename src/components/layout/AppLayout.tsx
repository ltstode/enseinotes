import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  BookOpen, 
  ClipboardList,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg text-label transition-all duration-200",
      isActive
        ? "bg-primary/10 text-primary font-medium"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    )}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { schoolYears, activeYearId } = useApp();
  const activeYear = schoolYears.find(y => y.id === activeYearId);

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord' },
    { to: '/years', icon: <Calendar size={20} />, label: 'Années scolaires' },
    { to: '/classes', icon: <Users size={20} />, label: 'Classes' },
    { to: '/units', icon: <BookOpen size={20} />, label: 'Unités pédagogiques' },
    { to: '/grades', icon: <ClipboardList size={20} />, label: 'Notes' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-soft">
              <GraduationCap className="text-primary-foreground" size={22} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">EnseiNotes</h1>
              <p className="text-small text-muted-foreground">Gestion scolaire</p>
            </div>
          </Link>
        </div>

        {/* Active Year Badge */}
        {activeYear && (
          <div className="px-6 py-4 border-b">
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
              <p className="text-small text-muted-foreground">Année active</p>
              <p className="font-display font-semibold text-foreground">{activeYear.name}</p>
              <p className="text-small text-primary capitalize">{activeYear.mode === 'semester' ? 'Semestres' : 'Trimestres'}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <NavItem
              key={item.to}
              {...item}
              isActive={location.pathname === item.to}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <p className="text-small text-muted-foreground text-center">
            EnseiNotes v1.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
