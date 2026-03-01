import { cn } from '@/lib/utils';
import type { TrafficLight } from '@/types/scoring';

interface ProgressBarProps {
  value: number;
  max?: number;
  trafficLight: TrafficLight;
  showPercentage?: boolean;
  showTarget?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

const fillColorMap: Record<TrafficLight, string> = {
  groen: 'bg-green-500',
  oranje: 'bg-amber-500',
  rood: 'bg-red-500',
  geen_data: 'bg-gray-300',
};

const heightMap = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  max = 100,
  trafficLight,
  showPercentage = true,
  showTarget = false,
  height = 'md',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="w-full">
      <div className="relative">
        <div
          className={cn('w-full overflow-hidden rounded-full bg-slate-200', heightMap[height])}
          role="progressbar"
          aria-valuenow={Math.round(value)}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              fillColorMap[trafficLight]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showTarget && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white"
            style={{ left: '100%' }}
          />
        )}
      </div>
      {showPercentage && (
        <p className="mt-1 text-xs text-slate-500 text-right">
          {Math.round(value)}%
        </p>
      )}
    </div>
  );
}
