import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useMySubGoals } from '@/hooks/useSubGoals';
import { useKpiEntries, useUpsertKpiEntry } from '@/hooks/useKpiEntries';
import { calculateSubGoalScore, getTrafficLight } from '@/lib/scoring-engine';
import { getCurrentMonth, formatScore } from '@/lib/utils';
import { KPI_ENTRY_LIMITS } from '@/lib/constants';
import { SCORING_TYPE_LABELS, FREQUENCY_LABELS } from '@/types/scoring';
import { TrafficLightBadge } from '@/components/shared/TrafficLightBadge';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const entrySchema = z.object({
  waarde: z.number().min(0, 'Waarde moet 0 of hoger zijn'),
  notitie: z
    .string()
    .max(KPI_ENTRY_LIMITS.MAX_NOTE_LENGTH, `Maximaal ${KPI_ENTRY_LIMITS.MAX_NOTE_LENGTH} tekens`)
    .nullable()
    .optional(),
  periode: z.string().min(1, 'Selecteer een periode'),
});

type EntryFormData = z.infer<typeof entrySchema>;

function generatePeriodeOptions(frequency: string): Array<{ key: string; label: string }> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based

  if (frequency === 'maandelijks') {
    // Current month and previous 2
    return Array.from({ length: 3 }, (_, i) => {
      const m = month - i;
      const y = m < 0 ? year - 1 : year;
      const adjustedMonth = ((m % 12) + 12) % 12;
      const key = `${y}-${String(adjustedMonth + 1).padStart(2, '0')}`;
      const monthNames = [
        'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
        'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
      ];
      return { key, label: `${monthNames[adjustedMonth]} ${y}` };
    });
  }

  if (frequency === 'wekelijks') {
    // Current and previous 3 weeks
    return Array.from({ length: 4 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const yearNum = d.getFullYear();
      const dayOfYear = Math.floor(
        (d.getTime() - new Date(yearNum, 0, 1).getTime()) / 86400000
      );
      const weekNum = Math.ceil((dayOfYear + new Date(yearNum, 0, 1).getDay() + 1) / 7);
      const key = `${yearNum}-W${String(weekNum).padStart(2, '0')}`;
      return { key, label: key };
    });
  }

  if (frequency === 'dagelijks') {
    // Today and previous 6 days
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      return {
        key,
        label: d.toLocaleDateString('nl-NL', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
      };
    });
  }

  return [];
}

export function DataInputPage() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const [selectedSubGoalId, setSelectedSubGoalId] = useState<string>('');

  const { data: mySubGoals = [], isLoading: loadingSubGoals } = useMySubGoals(
    userId
  );

  const selectedSubGoal = mySubGoals.find((sg) => sg.id === selectedSubGoalId);

  const { data: entries = [], isLoading: loadingEntries } = useKpiEntries(
    selectedSubGoalId || undefined,
    userId
  );

  const upsertEntry = useUpsertKpiEntry();

  const periodeOptions = useMemo(() => {
    if (!selectedSubGoal) return [];
    return generatePeriodeOptions(selectedSubGoal.frequency);
  }, [selectedSubGoal]);

  const form = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      waarde: 0,
      notitie: null,
      periode: '',
    },
  });

  // Calculate current score
  const score = useMemo(() => {
    if (!selectedSubGoal || entries.length === 0) return null;
    const values = entries.map((e) => e.waarde);
    return calculateSubGoalScore(
      selectedSubGoal.type,
      values,
      selectedSubGoal.target_value
    );
  }, [selectedSubGoal, entries]);

  const trafficLight = getTrafficLight(score);

  const handleSubmit = async (data: EntryFormData) => {
    if (!userId || !selectedSubGoalId) return;

    await upsertEntry.mutateAsync({
      sub_goal_id: selectedSubGoalId,
      user_id: userId,
      periode: data.periode,
      waarde: data.waarde,
      notitie: data.notitie ?? null,
      ingevoerd_door: userId,
    });

    form.reset({ waarde: 0, notitie: null, periode: '' });
  };

  if (loadingSubGoals) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">KPI Data Invoeren</h1>

      {mySubGoals.length === 0 ? (
        <EmptyState
          title="Geen sub-KPIs toegewezen"
          description="Je hebt nog geen sub-KPIs toegewezen gekregen. Neem contact op met je manager."
        />
      ) : (
        <>
          {/* Sub-goal selector */}
          <Select
            value={selectedSubGoalId}
            onValueChange={(v) => {
              setSelectedSubGoalId(v);
              form.reset({ waarde: 0, notitie: null, periode: '' });
            }}
          >
            <SelectTrigger className="w-96">
              <SelectValue placeholder="Selecteer een sub-KPI" />
            </SelectTrigger>
            <SelectContent>
              {mySubGoals.map((sg) => (
                <SelectItem key={sg.id} value={sg.id}>
                  {sg.goals?.kpi_code} - {sg.titel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!selectedSubGoalId ? (
            <EmptyState
              title="Selecteer een sub-KPI"
              description="Kies een sub-KPI uit de dropdown om data in te voeren."
            />
          ) : (
            <>
              {/* Sub-goal info + current score */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {selectedSubGoal?.titel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {selectedSubGoal
                          ? SCORING_TYPE_LABELS[selectedSubGoal.type]
                          : ''}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {selectedSubGoal
                          ? FREQUENCY_LABELS[selectedSubGoal.frequency]
                          : ''}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      Target:{' '}
                      {selectedSubGoal?.target_tekst ??
                        selectedSubGoal?.target_value ??
                        'NTB'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-slate-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-slate-500">
                        Huidige score
                      </CardTitle>
                      <TrafficLightBadge status={trafficLight} size="sm" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-mono font-bold text-slate-900">
                      {formatScore(score)}
                    </p>
                    <ProgressBar
                      value={score ?? 0}
                      trafficLight={trafficLight}
                      showPercentage={false}
                      height="sm"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Input form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nieuwe invoer</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Periode</Label>
                        <Select
                          value={form.watch('periode')}
                          onValueChange={(v) => form.setValue('periode', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer periode" />
                          </SelectTrigger>
                          <SelectContent>
                            {periodeOptions.map((opt) => (
                              <SelectItem key={opt.key} value={opt.key}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.periode && (
                          <p className="text-xs text-red-600">
                            {form.formState.errors.periode.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="waarde">Waarde</Label>
                        <Input
                          id="waarde"
                          type="number"
                          step="any"
                          min={0}
                          {...form.register('waarde', { valueAsNumber: true })}
                          className="font-mono"
                        />
                        {form.formState.errors.waarde && (
                          <p className="text-xs text-red-600">
                            {form.formState.errors.waarde.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notitie">Notitie (optioneel)</Label>
                      <Textarea
                        id="notitie"
                        {...form.register('notitie')}
                        placeholder="Toelichting bij deze invoer..."
                        rows={2}
                      />
                      {form.formState.errors.notitie && (
                        <p className="text-xs text-red-600">
                          {form.formState.errors.notitie.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={upsertEntry.isPending}
                    >
                      {upsertEntry.isPending ? 'Opslaan...' : 'Opslaan'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* History table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Invoergeschiedenis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingEntries ? (
                    <Skeleton className="h-32 w-full" />
                  ) : entries.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">
                      Nog geen data ingevoerd.
                    </p>
                  ) : (
                    <Table aria-label="Invoergeschiedenis">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Periode</TableHead>
                          <TableHead className="text-right">Waarde</TableHead>
                          <TableHead>Notitie</TableHead>
                          <TableHead>Datum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-mono text-sm">
                              {entry.periode}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {entry.waarde}
                            </TableCell>
                            <TableCell className="text-sm text-slate-500 max-w-xs truncate">
                              {entry.notitie ?? '--'}
                            </TableCell>
                            <TableCell className="text-sm text-slate-400">
                              {new Date(entry.created_at).toLocaleDateString(
                                'nl-NL'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
