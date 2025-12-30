import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, Users, BookOpen, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'year' | 'class' | 'unit' | 'grade';
  title: string;
  description: string;
  timestamp: string;
}

const getActivityIcon = (type: ActivityItem['type']) => {
  const icons = {
    year: <Calendar size={16} />,
    class: <Users size={16} />,
    unit: <BookOpen size={16} />,
    grade: <ClipboardList size={16} />,
  };
  return icons[type];
};

const getActivityColor = (type: ActivityItem['type']) => {
  const colors = {
    year: 'bg-info/10 text-info',
    class: 'bg-success/10 text-success',
    unit: 'bg-primary/10 text-primary',
    grade: 'bg-warning/10 text-warning',
  };
  return colors[type];
};

interface RecentActivityProps {
  activities: ActivityItem[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune activité récente</p>
            <p className="text-small mt-1">Commencez par créer une année scolaire</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn("p-2 rounded-lg", getActivityColor(activity.type))}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{activity.title}</p>
                  <p className="text-small text-muted-foreground truncate">
                    {activity.description}
                  </p>
                </div>
                <p className="text-small text-muted-foreground whitespace-nowrap">
                  {activity.timestamp}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
