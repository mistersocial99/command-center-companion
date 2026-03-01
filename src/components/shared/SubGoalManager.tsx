import { Pencil, Trash2, Users } from 'lucide-react';
import type { SubGoal } from '@/types/database';
import { FREQUENCY_LABELS } from '@/types/scoring';
import { ProgressBar } from './ProgressBar';
import { AlertBanner } from './AlertBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SubGoalManagerProps {
  goalId: string;
  departmentId: string;
  subGoals: SubGoal[];
  totalWeight: number;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SubGoalManager({
  subGoals,
  totalWeight,
  onAdd,
  onEdit,
  onDelete,
}: SubGoalManagerProps) {
  const isValid = totalWeight === 100;
  const trafficLight = isValid ? 'groen' : totalWeight > 100 ? 'rood' : 'oranje';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Gewichten</CardTitle>
            <span className="font-mono text-sm font-medium">
              Totaal: {totalWeight}/100%
            </span>
          </div>
          <ProgressBar
            value={totalWeight}
            trafficLight={trafficLight}
            showPercentage={false}
            height="sm"
          />
        </CardHeader>
        <CardContent>
          {!isValid && (
            <AlertBanner
              variant="warning"
              title={`Gewichten tellen op tot ${totalWeight}%.`}
              description="Voeg sub-KPIs toe of pas gewichten aan tot exact 100%."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sub-KPI</TableHead>
                <TableHead className="w-20 text-right">Gewicht</TableHead>
                <TableHead className="w-28">Target</TableHead>
                <TableHead className="w-24">Frequentie</TableHead>
                <TableHead className="w-16 text-center">Team</TableHead>
                <TableHead className="w-24">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subGoals.map((sg) => (
                <TableRow key={sg.id}>
                  <TableCell className="font-medium">{sg.titel}</TableCell>
                  <TableCell className="text-right font-mono">
                    {sg.gewicht_pct}%
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {sg.target_value ?? sg.target_tekst ?? 'NTB'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {FREQUENCY_LABELS[sg.frequency]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      <Users className="mr-1 h-3 w-3" />
                      {sg.sub_goal_assignments?.length ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(sg.id)}
                        aria-label={`Bewerk ${sg.titel}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => onDelete(sg.id)}
                        aria-label={`Verwijder ${sg.titel}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Resterend gewicht: {Math.max(0, 100 - totalWeight)}%
        </span>
        <Button onClick={onAdd} size="sm">
          + Sub-KPI toevoegen
        </Button>
      </div>
    </div>
  );
}
