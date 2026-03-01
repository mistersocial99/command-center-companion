import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  direction: 'up' | 'down' | 'stable';
  value: number;
  label?: string;
  size?: 'sm' | 'md';
}

const directionConfig = {
  up: {
    Icon: TrendingUp,
    color: 'text-green-600',
    prefix: '+',
  },
  down: {
    Icon: TrendingDown,
    color: 'text-red-600',
    prefix: '',
  },
  stable: {
    Icon: Minus,
    color: 'text-gray-500',
    prefix: '',
  },
};

const sizeConfig = {
  sm: { icon: 'h-3 w-3', text: 'text-xs' },
  md: { icon: 'h-4 w-4', text: 'text-sm' },
};

export function TrendIndicator({
  direction,
  value,
  label,
  size = 'sm',
}: TrendIndicatorProps) {
  const dirConf = directionConfig[direction];
  const sizeConf = sizeConfig[size];

  return (
    <span className={cn('inline-flex items-center gap-1', dirConf.color)}>
      <dirConf.Icon className={sizeConf.icon} />
      <span className={cn('font-medium', sizeConf.text)}>
        {dirConf.prefix}
        {Math.abs(value)}
      </span>
      {label && (
        <span className={cn('text-slate-400', sizeConf.text)}>{label}</span>
      )}
    </span>
  );
}
