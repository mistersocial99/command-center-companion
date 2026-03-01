import { cn, formatScore } from '@/lib/utils';
import type { TrafficLight } from '@/types/scoring';
import { TrafficLightBadge } from './TrafficLightBadge';
import { TrendIndicator } from './TrendIndicator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface ScoreCardProps {
  title: string;
  score: number | null;
  trafficLight: TrafficLight;
  subtitle?: string;
  trend?: { direction: 'up' | 'down' | 'stable'; value: number };
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const borderColorMap: Record<TrafficLight, string> = {
  groen: 'border-l-green-500',
  oranje: 'border-l-amber-500',
  rood: 'border-l-red-500',
  geen_data: 'border-l-gray-300',
};

const scoreColorMap: Record<TrafficLight, string> = {
  groen: 'text-green-600',
  oranje: 'text-amber-800',
  rood: 'text-red-600',
  geen_data: 'text-gray-400',
};

const sizeConfig = {
  sm: { score: 'text-lg font-mono font-semibold', padding: 'p-3' },
  md: { score: 'text-2xl font-mono font-semibold', padding: 'p-4' },
  lg: { score: 'text-5xl font-mono font-bold', padding: 'p-6' },
};

export function ScoreCard({
  title,
  score,
  trafficLight,
  subtitle,
  trend,
  size = 'md',
  onClick,
}: ScoreCardProps) {
  const conf = sizeConfig[size];

  return (
    <Card
      className={cn(
        'border-l-4 transition-shadow duration-200',
        borderColorMap[trafficLight],
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      onClick={onClick}
      aria-label={`Score: ${formatScore(score)} van 100. Status: ${trafficLight}`}
    >
      <CardHeader className={cn(conf.padding, 'pb-2')}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-600">{title}</h3>
          <TrafficLightBadge
            status={trafficLight}
            size={size === 'lg' ? 'md' : 'sm'}
          />
        </div>
      </CardHeader>
      <CardContent className={cn(conf.padding, 'pt-0')}>
        <p className={cn(conf.score, scoreColorMap[trafficLight])}>
          {formatScore(score)}
        </p>
        <div className="mt-2 flex items-center justify-between">
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <TrendIndicator
              direction={trend.direction}
              value={trend.value}
              size="sm"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
