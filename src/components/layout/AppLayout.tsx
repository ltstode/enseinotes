import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  BookOpen, 
  ClipboardList,
  GraduationCap,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, isCollapsed }) => {
  const content = (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg text-label transition-all duration-200",
        isCollapsed && "justify-center px-2",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {icon}
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { schoolYears, activeYearId } = useApp();
  const activeYear = schoolYears.find(y => y.id === activeYearId);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord' },
    { to: '/years', icon: <Calendar size={20} />, label: 'Années scolaires' },
    { to: '/classes', icon: <Users size={20} />, label: 'Classes' },
    { to: '/units', icon: <BookOpen size={20} />, label: 'Unités pédagogiques' },
    { to: '/grades', icon: <ClipboardList size={20} />, label: 'Notes' },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen flex bg-background">
        {/* Sidebar */}
        <aside className={cn(
          "border-r bg-card flex flex-col transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}>
          {/* Logo */}
          <div className="p-4 border-b">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-soft flex-shrink-0">
                <GraduationCap className="text-primary-foreground" size={22} />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="font-display text-xl font-bold text-foreground">EnseiNotes</h1>
                  <p className="text-small text-muted-foreground">Gestion scolaire</p>
                </div>
              )}
            </Link>
          </div>

          {/* Toggle Button */}
          <div className={cn("p-2 border-b", isCollapsed && "flex justify-center")}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn("w-full justify-start gap-2", isCollapsed && "w-auto justify-center px-2")}
            >
              {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
              {!isCollapsed && <span className="text-small">Réduire</span>}
            </Button>
          </div>

          {/* Active Year Badge */}
          {activeYear && !isCollapsed && (
            <div className="px-4 py-3 border-b">
              <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Année active</p>
                <p className="font-display font-semibold text-foreground text-sm">{activeYear.name}</p>
                <p className="text-xs text-primary capitalize">{activeYear.mode === 'semester' ? 'Semestres' : 'Trimestres'}</p>
              </div>
            </div>
          )}
          
          {activeYear && isCollapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="px-2 py-3 border-b flex justify-center">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Calendar size={18} className="text-primary" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold">{activeYear.name}</p>
                <p className="text-xs">{activeYear.mode === 'semester' ? 'Semestres' : 'Trimestres'}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            {navItems.map(item => (
              <NavItem
                key={item.to}
                {...item}
                isActive={location.pathname === item.to}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t">
            <p className={cn(
              "text-small text-muted-foreground text-center",
              isCollapsed && "text-xs"
            )}>
              {isCollapsed ? "v1.0" : "EnseiNotes v1.0"}
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
    </TooltipProvider>
  );
};

export default AppLayout;
