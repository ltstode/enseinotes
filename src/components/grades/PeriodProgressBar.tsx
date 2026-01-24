import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Period, Evaluation } from '@/types/enseinotes';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, FileText, HelpCircle } from 'lucide-react';

interface PeriodProgressBarProps {
  period: Period;
  evaluations: Evaluation[];
}

const PeriodProgressBar: React.FC<PeriodProgressBarProps> = ({ period, evaluations }) => {
  const expectedDevoirs = period.expectedDevoirs || 2;
  const expectedInterros = period.expectedInterros || 2;

  const stats = useMemo(() => {
    const devoirsCreated = evaluations.filter(e => e.type === 'devoir').length;
    const interrosCreated = evaluations.filter(e => e.type === 'interro').length;

    const devoirsComplete = devoirsCreated >= expectedDevoirs;
    const interrosComplete = interrosCreated >= expectedInterros;
    const allComplete = devoirsComplete && interrosComplete;

    const totalExpected = expectedDevoirs + expectedInterros;
    const totalCreated = devoirsCreated + interrosCreated;
    const progressPercent = totalExpected > 0 ? Math.min((totalCreated / totalExpected) * 100, 100) : 0;

    return {
      devoirsCreated,
      interrosCreated,
      devoirsComplete,
      interrosComplete,
      allComplete,
      progressPercent,
      totalExpected,
      totalCreated,
    };
  }, [evaluations, expectedDevoirs, expectedInterros]);

  if (period.status === 'locked') return null;

  return (
    <div className={cn(
      "p-4 rounded-2xl border transition-all duration-300",
      stats.allComplete 
        ? "bg-success/5 border-success/20" 
        : "bg-secondary/20 border-secondary/30"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {stats.allComplete ? (
            <CheckCircle2 size={16} className="text-success" />
          ) : (
            <AlertCircle size={16} className="text-muted-foreground" />
          )}
          <span className="text-xs font-medium text-foreground">
            Progression {period.name}
          </span>
        </div>
        <span className={cn(
          "text-xs font-semibold px-2 py-0.5 rounded-full",
          stats.allComplete 
            ? "bg-success/10 text-success" 
            : "bg-muted text-muted-foreground"
        )}>
          {stats.totalCreated}/{stats.totalExpected}
        </span>
      </div>

      {/* Progress bar */}
      <Progress 
        value={stats.progressPercent} 
        className={cn(
          "h-2 mb-4",
          stats.allComplete && "[&>[data-state=filled]]:bg-success"
        )}
      />

      {/* Detail pills */}
      <div className="flex gap-3">
        <div className={cn(
          "flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
          stats.devoirsComplete 
            ? "bg-success/10 text-success border border-success/20" 
            : "bg-soft-pink/30 text-foreground border border-border/10"
        )}>
          <FileText size={14} />
          <span>Devoirs</span>
          <span className="ml-auto font-semibold">
            {stats.devoirsCreated}/{expectedDevoirs}
          </span>
          {stats.devoirsComplete && <CheckCircle2 size={12} />}
        </div>

        <div className={cn(
          "flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
          stats.interrosComplete 
            ? "bg-success/10 text-success border border-success/20" 
            : "bg-soft-blue/30 text-foreground border border-border/10"
        )}>
          <HelpCircle size={14} />
          <span>Interros</span>
          <span className="ml-auto font-semibold">
            {stats.interrosCreated}/{expectedInterros}
          </span>
          {stats.interrosComplete && <CheckCircle2 size={12} />}
        </div>
      </div>

      {/* Completion alert */}
      {stats.allComplete && (
        <div className="mt-3 p-2 rounded-xl bg-success/10 border border-success/20 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={14} className="text-success" />
          <span className="text-xs font-medium text-success">
            Période complète ! Vous pouvez la clôturer.
          </span>
        </div>
      )}
    </div>
  );
};

export default PeriodProgressBar;
