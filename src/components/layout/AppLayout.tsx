import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
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
  Settings,
  Bell,
  ChevronRight,
  Moon,
  Sun,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePeriodNotifications } from '@/hooks/usePeriodNotifications';
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
import GlobalSearchDialog from '@/components/search/GlobalSearchDialog';

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
        "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative",
        isCollapsed && "justify-center px-2",
        isActive
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          : "text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm"
      )}
    >
      <div className={cn("transition-transform duration-300 group-hover:scale-110", isActive && "text-primary-foreground")}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>
      {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
      {isActive && !isCollapsed && (
        <ChevronRight size={14} className="ml-auto opacity-50" />
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-foreground text-background border-none">
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
  const { schoolYears, activeYearId, syncStatus } = useApp();
  const { teacher, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { notifications, hasNotifications, urgentCount, totalCount } = usePeriodNotifications();
  const activeYear = schoolYears.find(y => y.id === activeYearId);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const syncLabel =
    syncStatus.state === 'saving'
      ? 'Enregistrement…'
      : syncStatus.state === 'saved'
        ? 'Enregistré'
        : syncStatus.state === 'error'
          ? 'Erreur de sauvegarde'
          : '';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!teacher) return '?';
    return `${teacher.firstName.charAt(0)}${teacher.lastName.charAt(0)}`.toUpperCase();
  };

  const navItems = [
    { to: '/', icon: <LayoutDashboard />, label: 'Tableau de bord' },
    { to: '/years', icon: <Calendar />, label: 'Années scolaires' },
    { to: '/classes', icon: <Users />, label: 'Classes' },
    { to: '/students', icon: <UserCog />, label: 'Élèves' },
    { to: '/units', icon: <BookOpen />, label: 'Unités pédagogiques' },
    { to: '/grades', icon: <ClipboardList />, label: 'Notes' },
    { to: '/calendar', icon: <Calendar />, label: 'Calendrier' },
    { to: '/settings', icon: <Settings />, label: 'Paramètres' },
  ];

  return (
    <TooltipProvider>
      <div className="h-screen flex bg-background overflow-hidden font-body">
        {/* Sidebar */}
        <aside className={cn(
          "h-screen glass-sidebar flex flex-col transition-all duration-500 ease-in-out z-30 bg-card/40",
          isCollapsed ? "w-[80px]" : "w-[260px]"
        )}>
          {/* Logo Section */}
          <div className="p-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                <GraduationCap className="text-white" size={24} />
              </div>
              {!isCollapsed && (
                <div className="animate-fade-in">
                  <h1 className="font-display text-xl font-semibold tracking-tight text-foreground leading-none">EnseiNotes</h1>
                  <p className="text-[10px] uppercase tracking-wide text-primary font-medium mt-1">Smart Management</p>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto compact-scrollbar">
            <div className={cn("px-3 mb-4 transition-opacity duration-300", isCollapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100")}>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Menu Principal</p>
            </div>
            {navItems.map(item => (
              <NavItem
                key={item.to}
                {...item}
                isActive={location.pathname === item.to}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>

          {/* User & Toggle Section */}
          <div className="p-4 border-t border-border/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn("w-full h-10 rounded-xl hover:bg-card/50 transition-colors mb-4", isCollapsed && "px-0 justify-center")}
            >
              {isCollapsed ? <PanelLeft size={18} /> : (
                <div className="flex items-center gap-2">
                  <PanelLeftClose size={18} />
                   <span className="text-xs font-medium">Réduire le menu</span>
                </div>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-2xl bg-card/50 border border-border/20 hover:bg-card transition-all duration-300 shadow-sm",
                  isCollapsed && "justify-center p-1.5"
                )}>
                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xs font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{teacher?.firstName} {teacher?.lastName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{teacher?.email}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isCollapsed ? "center" : "start"} side="top" className="w-[220px] rounded-2xl border-none shadow-2xl p-2">
                <DropdownMenuItem className="rounded-xl p-3 focus:bg-primary/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{teacher?.firstName} {teacher?.lastName}</span>
                    <span className="text-[10px] text-muted-foreground">Profil Enseignant</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2 bg-muted/50" />
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl p-3 text-destructive focus:bg-destructive/5 focus:text-destructive cursor-pointer">
                  <LogOut size={16} className="mr-3" />
                  <span className="text-xs font-medium">Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-[70px] flex items-center justify-between px-8 bg-card/30 backdrop-blur-md border-b border-border/20 z-20">
            <div className="flex items-center gap-6 flex-1 max-w-2xl">
              <GlobalSearchDialog />
            </div>

            <div className="flex items-center gap-4">
              {activeYear && (
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border/20 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                  <span className="text-xs font-medium text-foreground">{activeYear.name}</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-50 px-2 py-0.5 rounded-md bg-secondary">
                    {activeYear.mode === 'semester' ? 'Semestres' : 'Trimestres'}
                  </span>
                </div>
              )}

              {syncLabel && (
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm bg-card',
                    syncStatus.state === 'error' && 'border-destructive/30',
                    syncStatus.state !== 'error' && 'border-border/20',
                  )}
                  title={syncStatus.state === 'saved' && syncStatus.lastSavedAt ? `Dernière sauvegarde : ${syncStatus.lastSavedAt.toLocaleTimeString()}` : undefined}
                >
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      syncStatus.state === 'saving' && 'bg-muted-foreground animate-pulse',
                      syncStatus.state === 'saved' && 'bg-success',
                      syncStatus.state === 'error' && 'bg-destructive',
                    )}
                  />
                  <span className="text-xs font-medium text-foreground">{syncLabel}</span>
                </div>
              )}

              <Button 
                variant="ghost" 
                size="icon" 
                className="w-10 h-10 rounded-xl hover:bg-card"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <Sun size={20} className="text-muted-foreground" />
                ) : (
                  <Moon size={20} className="text-muted-foreground" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl relative hover:bg-card">
                    <Bell size={20} className="text-muted-foreground" />
                    {hasNotifications && (
                      <span className={cn(
                        "absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-card",
                        urgentCount > 0 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                      )}>
                        {totalCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 rounded-2xl border-none shadow-2xl p-2">
                  <div className="px-3 py-2 border-b border-border/20 mb-2">
                    <p className="text-xs font-medium text-foreground">Rappels de période</p>
                    <p className="text-[10px] text-muted-foreground">Périodes proches de leur fin</p>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center">
                      <Clock size={24} className="mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-xs text-muted-foreground">Aucune période à clôturer prochainement</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <DropdownMenuItem 
                        key={notif.periodId} 
                        className="rounded-xl p-3 cursor-pointer focus:bg-muted/50"
                        onClick={() => navigate(`/grades?unit=${notif.unitId}`)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            notif.daysRemaining <= 3 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                          )}>
                            {notif.daysRemaining <= 3 ? <AlertTriangle size={14} /> : <Clock size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{notif.unitName}</p>
                            <p className="text-[10px] text-muted-foreground">{notif.periodName}</p>
                            <p className={cn(
                              "text-[10px] font-medium mt-1",
                              notif.daysRemaining <= 3 ? "text-destructive" : "text-primary"
                            )}>
                              {notif.daysRemaining === 0 
                                ? "Fin aujourd'hui !" 
                                : notif.daysRemaining === 1 
                                  ? "Fin demain" 
                                  : `${notif.daysRemaining} jours restants`}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            <div className="h-full scrollable-content p-8">
              <div className="max-w-[1400px] mx-auto animate-page-transition">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AppLayout;
