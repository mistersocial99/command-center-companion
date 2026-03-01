import { cn, formatScore } from '@/lib/utils';
import type { TrafficLight } from '@/types/scoring';
import { TrafficLightBadge } from './TrafficLightBadge';
import { ProgressBar } from './ProgressBar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface KPITableItem {
  id: string;
  code: string;
  name: string;
  score: number | null;
  trafficLight: TrafficLight;
  target: string;
  actual: string;
  weight: number;
}

interface KPITableProps {
  kpis: KPITableItem[];
  onRowClick?: (id: string) => void;
  showWeights?: boolean;
  compact?: boolean;
}

export function KPITable({
  kpis,
  onRowClick,
  showWeights = false,
  compact = false,
}: KPITableProps) {
  return (
    <Table aria-label="KPI overzicht">
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Code</TableHead>
          <TableHead>KPI</TableHead>
          <TableHead className="text-right w-20">Score</TableHead>
          <TableHead className="w-24">Status</TableHead>
          {!compact && <TableHead className="w-32">Voortgang</TableHead>}
          {!compact && <TableHead className="text-right">Target</TableHead>}
          {!compact && <TableHead className="text-right">Actueel</TableHead>}
          {showWeights && <TableHead className="text-right w-20">Gewicht</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {kpis.map((kpi) => (
          <TableRow
            key={kpi.id}
            className={cn(
              onRowClick && 'cursor-pointer hover:bg-slate-50'
            )}
            onClick={() => onRowClick?.(kpi.id)}
          >
            <TableCell className="font-mono text-sm text-slate-500">
              {kpi.code}
            </TableCell>
            <TableCell className="font-medium">{kpi.name}</TableCell>
            <TableCell className="text-right font-mono font-medium">
              {formatScore(kpi.score)}
            </TableCell>
            <TableCell>
              <TrafficLightBadge status={kpi.trafficLight} size="sm" />
            </TableCell>
            {!compact && (
              <TableCell>
                <ProgressBar
                  value={kpi.score ?? 0}
                  trafficLight={kpi.trafficLight}
                  showPercentage={false}
                  height="sm"
                />
              </TableCell>
            )}
            {!compact && (
              <TableCell className="text-right text-sm text-slate-500">
                {kpi.target}
              </TableCell>
            )}
            {!compact && (
              <TableCell className="text-right text-sm text-slate-700">
                {kpi.actual}
              </TableCell>
            )}
            {showWeights && (
              <TableCell className="text-right font-mono text-sm">
                {kpi.weight}%
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
