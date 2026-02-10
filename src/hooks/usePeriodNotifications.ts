import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { differenceInDays, isWithinInterval, addDays } from 'date-fns';

export type NotificationType = 'period-ending' | 'upcoming-event' | 'low-grades';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  subtitle: string;
  daysRemaining?: number;
  severity: 'urgent' | 'warning' | 'info';
  navigateTo?: string;
}

export const usePeriodNotifications = () => {
  const {
    pedagogicalUnits,
    activeYearId,
    getPeriodsByUnit,
    customEvents,
    classRooms,
    grades,
    evaluations,
  } = useApp();

  const notifications = useMemo(() => {
    const results: AppNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter units for active year
    const activeUnits = pedagogicalUnits.filter(u => u.schoolYearId === activeYearId);

    // 1. Period ending notifications (use real endDate)
    activeUnits.forEach(unit => {
      const periods = getPeriodsByUnit(unit.id);
      if (!periods || periods.length === 0) return;

      periods.forEach(period => {
        if (period.status !== 'active') return;

        let daysRemaining: number | null = null;

        if (period.endDate) {
          const end = new Date(period.endDate);
          end.setHours(0, 0, 0, 0);
          daysRemaining = differenceInDays(end, today);
        }

        if (daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 14) {
          results.push({
            id: `period-${period.id}`,
            type: 'period-ending',
            title: `${period.name} - ${unit.name}`,
            subtitle: daysRemaining === 0
              ? "Se termine aujourd'hui !"
              : daysRemaining === 1
                ? 'Se termine demain'
                : `${daysRemaining} jours restants`,
            daysRemaining,
            severity: daysRemaining <= 3 ? 'urgent' : daysRemaining <= 7 ? 'warning' : 'info',
            navigateTo: `/grades?unit=${unit.id}`,
          });
        }
      });
    });

    // 2. Upcoming custom events (within next 7 days)
    customEvents.forEach(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const daysUntil = differenceInDays(eventDate, today);

      if (daysUntil >= 0 && daysUntil <= 7) {
        results.push({
          id: `event-${event.id}`,
          type: 'upcoming-event',
          title: event.title,
          subtitle: daysUntil === 0
            ? "Aujourd'hui"
            : daysUntil === 1
              ? 'Demain'
              : `Dans ${daysUntil} jours`,
          daysRemaining: daysUntil,
          severity: daysUntil <= 1 ? 'warning' : 'info',
          navigateTo: '/calendar',
        });
      }
    });

    // 3. Low average alerts (students below 8/20 in any active period)
    activeUnits.forEach(unit => {
      const periods = getPeriodsByUnit(unit.id);
      const activePeriod = periods.find(p => p.status === 'active');
      if (!activePeriod) return;

      const classroom = classRooms.find(c => c.id === unit.classRoomId);
      if (!classroom) return;

      const activeStudents = classroom.students.filter(s => s.status === 'active');
      const periodEvals = evaluations.filter(e => e.pedagogicalUnitId === unit.id && e.periodId === activePeriod.id);
      if (periodEvals.length === 0) return;

      let lowCount = 0;
      activeStudents.forEach(student => {
        const studentGrades = grades.filter(
          g => g.studentId === student.id && periodEvals.some(e => e.id === g.evaluationId)
        );
        if (studentGrades.length === 0) return;

        let totalWeighted = 0;
        let totalCoeff = 0;
        studentGrades.forEach(grade => {
          const ev = periodEvals.find(e => e.id === grade.evaluationId);
          if (ev) {
            totalWeighted += (grade.value / ev.maxScore) * 20 * ev.coefficient;
            totalCoeff += ev.coefficient;
          }
        });

        if (totalCoeff > 0) {
          const avg = totalWeighted / totalCoeff;
          if (avg < 8) lowCount++;
        }
      });

      if (lowCount > 0) {
        results.push({
          id: `low-grades-${unit.id}`,
          type: 'low-grades',
          title: `${lowCount} élève${lowCount > 1 ? 's' : ''} en difficulté`,
          subtitle: `${unit.name} - ${activePeriod.name}`,
          severity: lowCount >= 3 ? 'urgent' : 'warning',
          navigateTo: `/grades?unit=${unit.id}`,
        });
      }
    });

    // Sort: urgent first, then warning, then info
    const severityOrder = { urgent: 0, warning: 1, info: 2 };
    return results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [pedagogicalUnits, activeYearId, getPeriodsByUnit, customEvents, classRooms, grades, evaluations]);

  const hasNotifications = notifications.length > 0;
  const urgentCount = notifications.filter(n => n.severity === 'urgent').length;

  return {
    notifications,
    hasNotifications,
    urgentCount,
    totalCount: notifications.length,
  };
};
