import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: string;
  colorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  label, 
  value, 
  trend,
  colorClass = 'bg-primary/10 text-primary'
}) => {
  return (
    <Card className="p-6 animate-scale-in">
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-xl", colorClass)}>
          {icon}
        </div>
        {trend && (
          <span className="text-small text-success font-medium">{trend}</span>
        )}
      </div>
      <div className="mt-4">
        <p className="font-display text-h1 font-bold text-foreground">{value}</p>
        <p className="text-small text-muted-foreground mt-1">{label}</p>
      </div>
    </Card>
  );
};

export default StatCard;
