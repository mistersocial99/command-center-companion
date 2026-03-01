import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn, formatScore } from '@/lib/utils';
import type { TrafficLight } from '@/types/scoring';
import { TrafficLightBadge } from './TrafficLightBadge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface DrillDownPanelProps {
  title: string;
  subtitle?: string;
  score?: number | null;
  trafficLight?: TrafficLight;
  isExpanded?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

export function DrillDownPanel({
  title,
  subtitle,
  score,
  trafficLight,
  isExpanded: controlledExpanded,
  onToggle,
  children,
}: DrillDownPanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="cursor-pointer p-4 hover:bg-slate-50 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
            <div>
              <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
              {subtitle && (
                <p className="text-xs text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {score !== undefined && (
              <span className="font-mono text-base font-medium text-slate-700">
                {formatScore(score ?? null)}
              </span>
            )}
            {trafficLight && (
              <TrafficLightBadge status={trafficLight} size="sm" showLabel={false} />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          'overflow-hidden transition-all duration-300',
          isExpanded ? 'max-h-[1000px] p-4 pt-0' : 'max-h-0 p-0'
        )}
      >
        {isExpanded && <div className="border-t pt-4">{children}</div>}
      </CardContent>
    </Card>
  );
}
