import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Calendar,
  Users,
  BookOpen,
  ClipboardList,
  UserCog,
  Settings,
  LayoutDashboard,
  GraduationCap,
  Search,
  Plus,
  Moon,
  Sun,
  Zap,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
}

const GlobalSearchDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { schoolYears, classRooms, pedagogicalUnits, evaluations, activeYearId } = useApp();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const go = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate],
  );

  const results = useMemo<SearchResult[]>(() => {
    const items: SearchResult[] = [];

    // Quick Actions
    items.push(
      {
        id: 'action-new-eval',
        label: 'Nouvelle évaluation',
        sublabel: 'Créer une évaluation rapidement',
        icon: <Plus size={16} />,
        category: '⚡ Actions rapides',
        action: () => go('/grades'),
      },
      {
        id: 'action-new-class',
        label: 'Nouvelle classe',
        sublabel: 'Ajouter une classe',
        icon: <Plus size={16} />,
        category: '⚡ Actions rapides',
        action: () => go('/classes'),
      },
      {
        id: 'action-toggle-theme',
        label: theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre',
        sublabel: 'Changer le thème de l\'interface',
        icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
        category: '⚡ Actions rapides',
        action: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); setOpen(false); },
      },
    );

    // Pages
    items.push(
      { id: 'nav-dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={16} />, category: 'Pages', action: () => go('/') },
      { id: 'nav-years', label: 'Années scolaires', icon: <Calendar size={16} />, category: 'Pages', action: () => go('/years') },
      { id: 'nav-classes', label: 'Classes', icon: <Users size={16} />, category: 'Pages', action: () => go('/classes') },
      { id: 'nav-students', label: 'Élèves', icon: <UserCog size={16} />, category: 'Pages', action: () => go('/students') },
      { id: 'nav-units', label: 'Unités pédagogiques', icon: <BookOpen size={16} />, category: 'Pages', action: () => go('/units') },
      { id: 'nav-grades', label: 'Notes', icon: <ClipboardList size={16} />, category: 'Pages', action: () => go('/grades') },
      { id: 'nav-calendar', label: 'Calendrier', icon: <Calendar size={16} />, category: 'Pages', action: () => go('/calendar') },
      { id: 'nav-settings', label: 'Paramètres', icon: <Settings size={16} />, category: 'Pages', action: () => go('/settings') },
    );

    // School years
    schoolYears.forEach((y) => {
      items.push({
        id: `year-${y.id}`,
        label: y.name,
        sublabel: y.mode === 'semester' ? 'Semestres' : 'Trimestres',
        icon: <Calendar size={16} />,
        category: 'Années scolaires',
        action: () => go('/years'),
      });
    });

    // Classes (active year)
    const yearClasses = activeYearId
      ? classRooms.filter((c) => c.schoolYearId === activeYearId)
      : classRooms;

    yearClasses.forEach((c) => {
      items.push({
        id: `class-${c.id}`,
        label: c.name,
        sublabel: `${c.students.length} élèves`,
        icon: <Users size={16} />,
        category: 'Classes',
        action: () => go('/classes'),
      });

      c.students.forEach((s) => {
        items.push({
          id: `student-${s.id}`,
          label: `${s.lastName} ${s.firstName}`,
          sublabel: c.name,
          icon: <UserCog size={16} />,
          category: 'Élèves',
          action: () => go('/students'),
        });
      });
    });

    // Pedagogical units
    const yearUnits = activeYearId
      ? pedagogicalUnits.filter((u) => u.schoolYearId === activeYearId)
      : pedagogicalUnits;

    yearUnits.forEach((u) => {
      const cls = classRooms.find((c) => c.id === u.classRoomId);
      items.push({
        id: `unit-${u.id}`,
        label: u.name,
        sublabel: cls?.name,
        icon: <BookOpen size={16} />,
        category: 'Unités pédagogiques',
        action: () => go(`/grades?unit=${u.id}`),
      });
    });

    // Evaluations
    evaluations.forEach((ev) => {
      const unit = pedagogicalUnits.find((u) => u.id === ev.pedagogicalUnitId);
      items.push({
        id: `eval-${ev.id}`,
        label: ev.name,
        sublabel: `${unit?.name ?? ''} · ${ev.type === 'devoir' ? 'Devoir' : 'Interrogation'}`,
        icon: <ClipboardList size={16} />,
        category: 'Évaluations',
        action: () => go(`/grades?unit=${ev.pedagogicalUnitId}`),
      });
    });

    return items;
  }, [schoolYears, classRooms, pedagogicalUnits, evaluations, activeYearId, go, theme, setTheme]);

  // Group results by category
  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    results.forEach((r) => {
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category)!.push(r);
    });
    return map;
  }, [results]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex-1 group cursor-pointer text-left"
      >
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
        <div className="w-full h-10 pl-11 pr-4 rounded-xl bg-card/50 border-none shadow-inner flex items-center text-sm text-muted-foreground group-hover:bg-card group-hover:shadow-md transition-all">
          Recherche rapide…
          <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border/40 bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Rechercher ou exécuter une action…" />
        <CommandList>
          <CommandEmpty>
            <div className="py-8 text-center space-y-2">
              <Search size={32} className="mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
            </div>
          </CommandEmpty>
          {Array.from(grouped.entries()).map(([category, items], idx) => (
            <React.Fragment key={category}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={category}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.sublabel ?? ''}`}
                    onSelect={item.action}
                    className="flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-xl"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      item.category === '⚡ Actions rapides'
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      {item.sublabel && (
                        <p className="text-[11px] text-muted-foreground truncate">{item.sublabel}</p>
                      )}
                    </div>
                    {item.category === '⚡ Actions rapides' && (
                      <Zap size={12} className="text-primary/40 shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default GlobalSearchDialog;
