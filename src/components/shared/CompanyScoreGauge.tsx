import { cn, formatScore } from '@/lib/utils';
import type { TrafficLight } from '@/types/scoring';
import { TrafficLightBadge } from './TrafficLightBadge';
import { TrendIndicator } from './TrendIndicator';

interface CompanyScoreGaugeProps {
  score: number | null;
  trafficLight: TrafficLight;
  trend?: { direction: 'up' | 'down' | 'stable'; value: number; period: string };
  size?: 'md' | 'lg' | 'xl';
}

const scoreColorMap: Record<TrafficLight, string> = {
  groen: 'text-green-600',
  oranje: 'text-amber-800',
  rood: 'text-red-600',
  geen_data: 'text-gray-400',
};

const sizeConfig = {
  md: 'text-2xl font-mono font-semibold',
  lg: 'text-4xl font-mono font-bold',
  xl: 'text-5xl font-mono font-bold',
};

export function CompanyScoreGauge({
  score,
  trafficLight,
  trend,
  size = 'lg',
}: CompanyScoreGaugeProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <p
        className={cn(sizeConfig[size], scoreColorMap[trafficLight])}
        aria-label={`Company score: ${formatScore(score)}`}
      >
        {formatScore(score)}
      </p>
      <div className="mt-2">
        <TrafficLightBadge status={trafficLight} size="md" />
      </div>
      <p className="mt-3 text-sm text-slate-500">Company Score</p>
      {trend && (
        <div className="mt-1">
          <TrendIndicator
            direction={trend.direction}
            value={trend.value}
            label={`vs ${trend.period}`}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}
