import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Users, Award, AlertTriangle, Target } from 'lucide-react';
import { Student, Evaluation } from '@/types/enseinotes';
import { cn } from '@/lib/utils';

interface ClassStatisticsProps {
  students: Student[];
  evaluations: Evaluation[];
  calculateFinalAverage: (studentId: string) => number | null;
  periodName: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-soft-blue text-soft-blue-foreground',
    success: 'bg-soft-green text-soft-green-foreground',
    warning: 'bg-soft-orange text-soft-orange-foreground',
    danger: 'bg-soft-pink text-soft-pink-foreground'
  };

  return (
    <div className="p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-xl", colorClasses[color])}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend === 'up' ? 'bg-soft-green/20 text-soft-green-foreground' : 
            trend === 'down' ? 'bg-soft-pink/20 text-soft-pink-foreground' : 
            'bg-muted/20 text-muted-foreground'
          )}>
            {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : null}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs font-medium text-muted-foreground mt-1">{title}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

const ClassStatistics: React.FC<ClassStatisticsProps> = ({
  students,
  evaluations,
  calculateFinalAverage,
  periodName
}) => {
  const statistics = useMemo(() => {
    const averages = students
      .map(s => ({ id: s.id, name: `${s.lastName} ${s.firstName}`, average: calculateFinalAverage(s.id) }))
      .filter((s): s is { id: string; name: string; average: number } => s.average !== null);

    if (averages.length === 0) {
      return null;
    }

    const values = averages.map(a => a.average);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    
    // Standard deviation
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquaredDiff);
    
    // Min, Max, Median
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 
      : sorted[Math.floor(sorted.length / 2)];

    // Distribution brackets
    const distribution = {
      excellent: values.filter(v => v >= 16).length,
      good: values.filter(v => v >= 12 && v < 16).length,
      average: values.filter(v => v >= 10 && v < 12).length,
      insufficient: values.filter(v => v < 10).length
    };

    // Histogram data (0-4, 4-8, 8-10, 10-12, 12-14, 14-16, 16-18, 18-20)
    const histogramBrackets = [
      { range: '0-4', min: 0, max: 4 },
      { range: '4-8', min: 4, max: 8 },
      { range: '8-10', min: 8, max: 10 },
      { range: '10-12', min: 10, max: 12 },
      { range: '12-14', min: 12, max: 14 },
      { range: '14-16', min: 14, max: 16 },
      { range: '16-18', min: 16, max: 18 },
      { range: '18-20', min: 18, max: 20 }
    ];

    const histogramData = histogramBrackets.map(bracket => ({
      range: bracket.range,
      count: values.filter(v => v >= bracket.min && v < bracket.max).length + 
             (bracket.max === 20 ? values.filter(v => v === 20).length : 0)
    }));

    // Pie chart data
    const pieData = [
      { name: 'Excellent (≥16)', value: distribution.excellent, color: '#38A169' },
      { name: 'Bon (12-16)', value: distribution.good, color: '#63B3ED' },
      { name: 'Passable (10-12)', value: distribution.average, color: '#F6AD55' },
      { name: 'Insuffisant (<10)', value: distribution.insufficient, color: '#FC8181' }
    ].filter(d => d.value > 0);

    // Top and bottom students
    const topStudents = [...averages].sort((a, b) => b.average - a.average).slice(0, 3);
    const bottomStudents = [...averages].sort((a, b) => a.average - b.average).slice(0, 3);

    return {
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      distribution,
      histogramData,
      pieData,
      topStudents,
      bottomStudents,
      totalEvaluated: averages.length,
      totalStudents: students.length,
      passRate: Math.round((values.filter(v => v >= 10).length / values.length) * 100)
    };
  }, [students, calculateFinalAverage]);

  if (!statistics) {
    return (
      <div className="p-8 text-center bg-white/50 rounded-2xl border border-white/40">
        <Target className="mx-auto text-muted-foreground mb-3" size={32} />
        <p className="text-sm font-medium text-muted-foreground">
          Aucune note disponible pour calculer les statistiques.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Statistiques de classe</h3>
          <p className="text-xs text-muted-foreground">{periodName} • {statistics.totalEvaluated} élèves évalués</p>
        </div>
        <div className={cn(
          "px-4 py-2 rounded-xl text-xs font-medium",
          statistics.passRate >= 80 ? "bg-soft-green/20 text-soft-green-foreground" :
          statistics.passRate >= 60 ? "bg-soft-blue/20 text-soft-blue-foreground" :
          statistics.passRate >= 40 ? "bg-soft-orange/20 text-soft-orange-foreground" :
          "bg-soft-pink/20 text-soft-pink-foreground"
        )}>
          Taux de réussite: {statistics.passRate}%
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Moyenne de classe"
          value={statistics.mean.toFixed(2)}
          subtitle="/ 20"
          icon={<Target size={20} />}
          color={statistics.mean >= 12 ? 'success' : statistics.mean >= 10 ? 'primary' : 'danger'}
        />
        <StatCard
          title="Médiane"
          value={statistics.median.toFixed(2)}
          subtitle="50% au-dessus"
          icon={<Users size={20} />}
          color="primary"
        />
        <StatCard
          title="Écart-type"
          value={statistics.stdDev.toFixed(2)}
          subtitle={statistics.stdDev < 3 ? 'Homogène' : statistics.stdDev < 5 ? 'Modéré' : 'Hétérogène'}
          icon={statistics.stdDev < 4 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          color={statistics.stdDev < 4 ? 'success' : 'warning'}
        />
        <StatCard
          title="Amplitude"
          value={`${statistics.min} - ${statistics.max}`}
          subtitle={`Δ ${(statistics.max - statistics.min).toFixed(1)}`}
          icon={<Award size={20} />}
          color="primary"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histogram */}
        <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Distribution des notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statistics.histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }} 
                  formatter={(value: number) => [`${value} élève${value > 1 ? 's' : ''}`, 'Effectif']}
                />
                <Bar 
                  dataKey="count" 
                  fill="#63B3ED" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Répartition par niveau</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statistics.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statistics.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value} élève${value > 1 ? 's' : ''}`, '']}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px' }}
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top/Bottom Students */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Students */}
        <div className="p-4 rounded-2xl bg-soft-green/10 border border-soft-green/20">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-soft-green-foreground" />
            <span className="text-xs font-semibold text-soft-green-foreground uppercase tracking-wide">Meilleures moyennes</span>
          </div>
          <div className="space-y-2">
            {statistics.topStudents.map((student, idx) => (
              <div key={student.id} className="flex items-center justify-between p-2 rounded-xl bg-white/50">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-soft-green text-soft-green-foreground text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium truncate max-w-32">{student.name}</span>
                </div>
                <span className="text-xs font-bold text-soft-green-foreground">{student.average.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Students */}
        <div className="p-4 rounded-2xl bg-soft-orange/10 border border-soft-orange/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-soft-orange-foreground" />
            <span className="text-xs font-semibold text-soft-orange-foreground uppercase tracking-wide">À surveiller</span>
          </div>
          <div className="space-y-2">
            {statistics.bottomStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-2 rounded-xl bg-white/50">
                <span className="text-xs font-medium truncate max-w-40">{student.name}</span>
                <span className={cn(
                  "text-xs font-bold",
                  student.average >= 10 ? "text-soft-green-foreground" : "text-soft-pink-foreground"
                )}>
                  {student.average.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassStatistics;
