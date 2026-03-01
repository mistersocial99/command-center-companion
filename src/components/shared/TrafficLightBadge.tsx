import { Check, AlertTriangle, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrafficLight } from '@/types/scoring';
import { TRAFFIC_LIGHT_LABELS } from '@/types/scoring';

interface TrafficLightBadgeProps {
  status: TrafficLight;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeConfig = {
  sm: { dot: 'w-2 h-2', icon: 'h-2.5 w-2.5', text: 'text-xs', gap: 'gap-1' },
  md: { dot: 'w-3 h-3', icon: 'h-3 w-3', text: 'text-sm', gap: 'gap-1.5' },
  lg: { dot: 'w-4 h-4', icon: 'h-3.5 w-3.5', text: 'text-base', gap: 'gap-2' },
};

const statusConfig: Record<
  TrafficLight,
  { dotColor: string; bgColor: string; textColor: string; Icon: React.ElementType }
> = {
  groen: {
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    Icon: Check,
  },
  oranje: {
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800', // RT-025 fix: amber-800 voor contrast
    Icon: AlertTriangle,
  },
  rood: {
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    Icon: X,
  },
  geen_data: {
    dotColor: 'bg-gray-400',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    Icon: Minus,
  },
};

export function TrafficLightBadge({
  status,
  size = 'md',
  showLabel = true,
}: TrafficLightBadgeProps) {
  const sizeConf = sizeConfig[size];
  const statusConf = statusConfig[status];
  const label = TRAFFIC_LIGHT_LABELS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5',
        sizeConf.gap,
        statusConf.bgColor
      )}
      aria-label={`Status: ${label}`}
    >
      <span
        className={cn('flex-shrink-0 rounded-full', sizeConf.dot, statusConf.dotColor)}
      />
      <statusConf.Icon
        className={cn('flex-shrink-0', sizeConf.icon, statusConf.textColor)}
      />
      {showLabel && (
        <span className={cn('font-medium', sizeConf.text, statusConf.textColor)}>
          {label}
        </span>
      )}
    </span>
  );
}
