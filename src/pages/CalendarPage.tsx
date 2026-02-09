import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BookOpen, ClipboardList, Clock, Plus, Trash2, MapPin, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isToday, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import CreateEventDialog from '@/components/calendar/CreateEventDialog';

interface CalendarEvent {
  id: string;
  title: string;
  subtitle?: string;
  date: Date;
  type: 'evaluation' | 'period-start' | 'period-end' | 'period-range' | 'custom';
  color: string;
  customEventId?: string;
}

const eventTypeIcons: Record<string, React.ReactNode> = {
  reunion: <UsersIcon size={14} />,
  conseil: <UsersIcon size={14} />,
  formation: <BookOpen size={14} />,
  sortie: <MapPin size={14} />,
  autre: <CalendarIcon size={14} />,
};

const CalendarPage: React.FC = () => {
  const { evaluations, pedagogicalUnits, periods, classRooms, activeYearId, customEvents, deleteCustomEvent } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const events = useMemo<CalendarEvent[]>(() => {
    const items: CalendarEvent[] = [];

    const yearUnits = activeYearId
      ? pedagogicalUnits.filter((u) => u.schoolYearId === activeYearId)
      : pedagogicalUnits;

    const unitIds = new Set(yearUnits.map((u) => u.id));

    // Evaluations
    evaluations
      .filter((e) => unitIds.has(e.pedagogicalUnitId))
      .forEach((ev) => {
        const unit = pedagogicalUnits.find((u) => u.id === ev.pedagogicalUnitId);
        const cls = classRooms.find((c) => c.id === unit?.classRoomId);
        items.push({
          id: `eval-${ev.id}`,
          title: ev.name,
          subtitle: `${unit?.name ?? ''} · ${cls?.name ?? ''}`,
          date: new Date(ev.date),
          type: 'evaluation',
          color: ev.type === 'devoir' ? 'bg-soft-purple' : 'bg-soft-blue',
        });
      });

    // Periods with date ranges
    periods
      .filter((p) => unitIds.has(p.pedagogicalUnitId))
      .forEach((p) => {
        const unit = pedagogicalUnits.find((u) => u.id === p.pedagogicalUnitId);
        if (p.startDate) {
          items.push({
            id: `period-start-${p.id}`,
            title: `Début: ${p.name}`,
            subtitle: unit?.name,
            date: new Date(p.startDate),
            type: 'period-start',
            color: 'bg-soft-green',
          });
        }
        if (p.endDate) {
          items.push({
            id: `period-end-${p.id}`,
            title: `Fin: ${p.name}`,
            subtitle: unit?.name,
            date: new Date(p.endDate),
            type: 'period-end',
            color: 'bg-soft-orange',
          });
        }
        if (!p.startDate && !p.endDate) {
          items.push({
            id: `period-${p.id}`,
            title: p.name,
            subtitle: unit?.name,
            date: new Date(p.createdAt),
            type: 'period-start',
            color: 'bg-soft-green',
          });
        }
      });

    // Custom events
    customEvents.forEach((ce) => {
      items.push({
        id: `custom-${ce.id}`,
        title: ce.title,
        subtitle: ce.description,
        date: new Date(ce.date),
        type: 'custom',
        color: 'bg-soft-pink',
        customEventId: ce.id,
      });
    });

    return items;
  }, [evaluations, pedagogicalUnits, periods, classRooms, activeYearId, customEvents]);

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (getDay(monthStart) + 6) % 7;
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  // Check if a day falls within a period range
  const isDayInPeriodRange = (date: Date) => {
    return periods.some((p) => {
      if (!p.startDate || !p.endDate) return false;
      return isWithinInterval(date, { start: new Date(p.startDate), end: new Date(p.endDate) });
    });
  };

  const getEventsForDay = (date: Date) => events.filter((e) => isSameDay(e.date, date));

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <AppLayout>
      <div className="no-scroll-container gap-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h2 className="text-4xl font-semibold tracking-tighter text-foreground leading-tight flex items-center gap-3">
              Calendrier <span className="text-primary">Scolaire</span>
              <CalendarIcon className="text-soft-blue-foreground" size={32} />
            </h2>
            <p className="text-muted-foreground font-medium">Visualisez vos évaluations, périodes et événements.</p>
          </div>
          <Button
            onClick={() => setShowCreateEvent(true)}
            className="h-11 px-6 rounded-2xl gap-2 font-medium shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus size={18} />
            Nouvel événement
          </Button>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Calendar */}
          <div className="lg:col-span-2 apple-card p-6 flex flex-col">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="w-9 h-9 rounded-xl" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl px-4 text-xs font-medium" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}>
                  Aujourd'hui
                </Button>
                <Button variant="outline" size="icon" className="w-9 h-9 rounded-xl" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            {/* Week headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wide py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 flex-1">
              {paddingDays.map((i) => (
                <div key={`pad-${i}`} className="rounded-xl" />
              ))}

              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentDay = isToday(day);
                const inPeriodRange = isDayInPeriodRange(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-h-[72px] group hover:bg-card',
                      isSelected && 'bg-primary/10 ring-2 ring-primary/30',
                      isCurrentDay && !isSelected && 'bg-card shadow-sm',
                      inPeriodRange && !isSelected && !isCurrentDay && 'bg-soft-green/30',
                    )}
                  >
                    <span className={cn(
                      'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors',
                      isCurrentDay && 'bg-primary text-primary-foreground',
                      isSelected && !isCurrentDay && 'text-primary font-semibold',
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 flex-wrap justify-center">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div key={ev.id} className={cn('w-1.5 h-1.5 rounded-full', ev.color)} title={ev.title} />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4 flex flex-col min-h-0">
            <div className="apple-card p-6 flex-1 flex flex-col min-h-0">
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                {selectedDate
                  ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
                  : "Sélectionnez un jour"}
              </h4>

              {!selectedDate ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <CalendarIcon size={40} className="mx-auto text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Cliquez sur un jour pour voir les événements</p>
                  </div>
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <CalendarIcon size={40} className="mx-auto text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Aucun événement ce jour</p>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowCreateEvent(true)}>
                      <Plus size={14} className="mr-1" /> Ajouter
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto compact-scrollbar space-y-3">
                  {selectedEvents.map((ev) => (
                    <div key={ev.id} className={cn('p-4 rounded-2xl border border-border/20 transition-all hover:shadow-sm', ev.color)}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-card/60 flex items-center justify-center shrink-0">
                          {ev.type === 'evaluation' ? <ClipboardList size={14} /> :
                           ev.type === 'custom' ? (eventTypeIcons[customEvents.find(ce => ce.id === ev.customEventId)?.eventType || 'autre'] || <CalendarIcon size={14} />) :
                           <BookOpen size={14} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{ev.title}</p>
                          {ev.subtitle && <p className="text-[11px] opacity-70 truncate">{ev.subtitle}</p>}
                          <p className="text-[10px] font-medium mt-1 opacity-60 uppercase">
                            {ev.type === 'evaluation' ? 'Évaluation' :
                             ev.type === 'custom' ? 'Événement' :
                             ev.type === 'period-end' ? 'Fin de période' : 'Début de période'}
                          </p>
                        </div>
                        {ev.customEventId && (
                          <button
                            onClick={() => deleteCustomEvent(ev.customEventId!)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="apple-card p-5 space-y-3">
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Légende</h4>
              <div className="space-y-2">
                {[
                  { color: 'bg-soft-purple', label: 'Devoir' },
                  { color: 'bg-soft-blue', label: 'Interrogation' },
                  { color: 'bg-soft-green', label: 'Début de période' },
                  { color: 'bg-soft-orange', label: 'Fin de période' },
                  { color: 'bg-soft-pink', label: 'Événement personnel' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={cn('w-3 h-3 rounded-full', item.color)} />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateEventDialog
        open={showCreateEvent}
        onOpenChange={setShowCreateEvent}
        defaultDate={selectedDate || undefined}
      />
    </AppLayout>
  );
};

export default CalendarPage;
