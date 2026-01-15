import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  BookOpen, 
  ClipboardList,
  GraduationCap,
  PanelLeftClose,
  PanelLeft,
  UserCog,
  LogOut,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  const navigate = useNavigate();
  const { schoolYears, activeYearId } = useApp();
  const { teacher, logout } = useAuth();
  const activeYear = schoolYears.find(y => y.id === activeYearId);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!teacher) return '?';
    return `${teacher.firstName.charAt(0)}${teacher.lastName.charAt(0)}`.toUpperCase();
  };

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord' },
    { to: '/years', icon: <Calendar size={20} />, label: 'Années scolaires' },
    { to: '/classes', icon: <Users size={20} />, label: 'Classes' },
    { to: '/students', icon: <UserCog size={20} />, label: 'Élèves' },
    { to: '/units', icon: <BookOpen size={20} />, label: 'Unités pédagogiques' },
    { to: '/grades', icon: <ClipboardList size={20} />, label: 'Notes' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Paramètres' },
  ];

  return (
    <TooltipProvider>
      <div className="h-screen flex bg-background overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "h-screen border-r bg-card flex flex-col transition-all duration-300 flex-shrink-0",
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
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map(item => (
              <NavItem
                key={item.to}
                {...item}
                isActive={location.pathname === item.to}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>

          {/* User Menu */}
          <div className={cn("p-3 border-t", isCollapsed && "flex justify-center")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start gap-3 h-auto py-2",
                    isCollapsed && "w-auto justify-center px-2"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && teacher && (
                    <div className="text-left">
                      <p className="text-sm font-medium truncate">{teacher.firstName} {teacher.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isCollapsed ? "center" : "start"} side="top" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{teacher?.firstName} {teacher?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{teacher?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut size={16} className="mr-2" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-screen overflow-auto">
          <div className="p-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default AppLayout;
