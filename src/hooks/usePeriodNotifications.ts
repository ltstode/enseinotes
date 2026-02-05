import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { differenceInDays, parseISO, isValid } from 'date-fns';
import { Period } from '@/types/enseinotes';

export interface PeriodNotification {
  periodId: string;
  periodName: string;
  unitId: string;
  unitName: string;
  daysRemaining: number;
  endDate: Date;
}

export const usePeriodNotifications = () => {
  const { pedagogicalUnits, activeYearId, getPeriodsByUnit } = useApp();

  const notifications = useMemo(() => {
    const results: PeriodNotification[] = [];
    const today = new Date();

    // Filter units for active year
    const activeUnits = pedagogicalUnits.filter(u => u.schoolYearId === activeYearId);

    activeUnits.forEach(unit => {
      const periods = getPeriodsByUnit(unit.id);
      if (!periods || periods.length === 0) return;

      periods.forEach((period: Period) => {
        // Only check active periods
        if (period.status !== 'active') return;

        // Period type has endDate based on creation - we need to check if periods have date info
        // For now, we estimate based on the order and creation date
        // Since Period doesn't have endDate, we'll use a different approach:
        // Notify when evaluations are less than expected as a reminder
        
        // For demo purposes, let's check if period was created more than 60 days ago
        const createdDate = new Date(period.createdAt);
        if (!isValid(createdDate)) return;

        const daysSinceCreation = differenceInDays(today, createdDate);
        
        // Assume a period lasts ~90 days, so notify when 83+ days have passed
        const estimatedDaysRemaining = Math.max(0, 90 - daysSinceCreation);
        
        if (estimatedDaysRemaining <= 7 && estimatedDaysRemaining >= 0) {
          results.push({
            periodId: period.id,
            periodName: period.name,
            unitId: unit.id,
            unitName: unit.name,
            daysRemaining: estimatedDaysRemaining,
            endDate: new Date(createdDate.getTime() + 90 * 24 * 60 * 60 * 1000),
          });
        }
      });
    });

    // Sort by days remaining (most urgent first)
    return results.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [pedagogicalUnits, activeYearId, getPeriodsByUnit]);

  const hasNotifications = notifications.length > 0;
  const urgentCount = notifications.filter(n => n.daysRemaining <= 3).length;

  return {
    notifications,
    hasNotifications,
    urgentCount,
    totalCount: notifications.length,
  };
};
