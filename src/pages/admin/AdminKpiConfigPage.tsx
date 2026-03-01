import { useState, useMemo } from 'react';
import { usePillars, useUpdatePillarWeight } from '@/hooks/usePillars';
import { useGoals, useUpdateGoalWeight } from '@/hooks/useGoals';
import { useMonthlyTargets, useUpsertMonthlyTargets } from '@/hooks/useMonthlyTargets';
import { WeightEditor } from '@/components/shared/WeightEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const MONTHS_2026 = [
  { key: '2026-01', label: 'Januari 2026' },
  { key: '2026-02', label: 'Februari 2026' },
  { key: '2026-03', label: 'Maart 2026' },
  { key: '2026-04', label: 'April 2026' },
  { key: '2026-05', label: 'Mei 2026' },
  { key: '2026-06', label: 'Juni 2026' },
  { key: '2026-07', label: 'Juli 2026' },
  { key: '2026-08', label: 'Augustus 2026' },
  { key: '2026-09', label: 'September 2026' },
  { key: '2026-10', label: 'Oktober 2026' },
  { key: '2026-11', label: 'November 2026' },
  { key: '2026-12', label: 'December 2026' },
];

export function AdminKpiConfigPage() {
  const [selectedPillarId, setSelectedPillarId] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  const { data: pillars = [], isLoading: loadingPillars } = usePillars();
  const { data: goals = [], isLoading: loadingGoals } = useGoals(selectedPillarId || undefined);
  const { data: monthlyTargets = [] } = useMonthlyTargets(selectedGoalId || undefined);

  const updatePillarWeight = useUpdatePillarWeight();
  const updateGoalWeight = useUpdateGoalWeight();
  const upsertTargets = useUpsertMonthlyTargets();

  // Pillar weights state
  const [pillarWeights, setPillarWeights] = useState<Record<string, number>>({});
  const pillarItems = useMemo(() => {
    return pillars.map((p) => ({
      id: p.id,
      name: `${p.code}: ${p.naam}`,
      weight: pillarWeights[p.id] ?? p.gewicht_pct,
    }));
  }, [pillars, pillarWeights]);

  const pillarTotal = pillarItems.reduce((sum, p) => sum + p.weight, 0);

  // Goal weights state
  const [goalWeights, setGoalWeights] = useState<Record<string, number>>({});
  const goalItems = useMemo(() => {
    return goals.map((g) => ({
      id: g.id,
      name: `${g.kpi_code} ${g.naam}`,
      weight: goalWeights[g.id] ?? g.gewicht_pct,
    }));
  }, [goals, goalWeights]);

  const goalTotal = goalItems.reduce((sum, g) => sum + g.weight, 0);

  // Monthly targets state
  const [targetValues, setTargetValues] = useState<Record<string, number>>({});
  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  const handlePillarWeightChange = (id: string, weight: number) => {
    setPillarWeights((prev) => ({ ...prev, [id]: weight }));
  };

  const handleGoalWeightChange = (id: string, weight: number) => {
    setGoalWeights((prev) => ({ ...prev, [id]: weight }));
  };

  const savePillarWeights = async () => {
    const updates = pillarItems.map((p) => ({
      id: p.id,
      gewicht_pct: p.weight,
    }));
    await updatePillarWeight.mutateAsync(updates);
  };

  const saveGoalWeights = async () => {
    const updates = goalItems.map((g) => ({
      id: g.id,
      gewicht_pct: g.weight,
    }));
    await updateGoalWeight.mutateAsync(updates);
  };

  const saveMonthlyTargets = async () => {
    if (!selectedGoalId) return;
    const targets = Object.entries(targetValues)
      .filter(([_, value]) => value > 0)
      .map(([maand, value]) => ({
        goal_id: selectedGoalId,
        maand,
        target_value: value,
      }));
    await upsertTargets.mutateAsync(targets);
  };

  if (loadingPillars) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">KPI Configuratie</h1>

      <Tabs defaultValue="pilaren">
        <TabsList>
          <TabsTrigger value="pilaren">Pilaargewichten</TabsTrigger>
          <TabsTrigger value="kpis">KPI Gewichten</TabsTrigger>
          <TabsTrigger value="targets">Maandtargets</TabsTrigger>
        </TabsList>

        {/* Pilaargewichten */}
        <TabsContent value="pilaren" className="mt-6">
          <WeightEditor
            items={pillarItems}
            onChange={handlePillarWeightChange}
            onSave={savePillarWeights}
            isValid={pillarTotal === 100}
            totalWeight={pillarTotal}
            isSaving={updatePillarWeight.isPending}
          />
        </TabsContent>

        {/* KPI Gewichten */}
        <TabsContent value="kpis" className="mt-6 space-y-4">
          <Select
            value={selectedPillarId}
            onValueChange={(v) => {
              setSelectedPillarId(v);
              setGoalWeights({});
            }}
          >
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Selecteer pilaar" />
            </SelectTrigger>
            <SelectContent>
              {pillars.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code}: {p.naam}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPillarId && !loadingGoals && (
            <WeightEditor
              items={goalItems}
              onChange={handleGoalWeightChange}
              onSave={saveGoalWeights}
              isValid={goalTotal === 100}
              totalWeight={goalTotal}
              isSaving={updateGoalWeight.isPending}
            />
          )}
        </TabsContent>

        {/* Maandtargets */}
        <TabsContent value="targets" className="mt-6 space-y-4">
          <Select
            value={selectedGoalId}
            onValueChange={(v) => {
              setSelectedGoalId(v);
              setTargetValues({});
            }}
          >
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Selecteer KPI" />
            </SelectTrigger>
            <SelectContent>
              {pillars.flatMap((p) =>
                (goals.length > 0 ? goals : []).filter((g) => g.pillar_id === p.id).map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.kpi_code} {g.naam}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {selectedGoalId && selectedGoal && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Maandtargets voor {selectedGoal.kpi_code} {selectedGoal.naam}
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Jaardoel: {selectedGoal.jaardoel_tekst ?? selectedGoal.jaardoel ?? 'NTB'}
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Maand</TableHead>
                      <TableHead className="w-40">Target waarde</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MONTHS_2026.map((month) => {
                      const existing = monthlyTargets.find(
                        (t) => t.maand === month.key
                      );
                      const currentValue =
                        targetValues[month.key] ??
                        (existing ? Number(existing.target_value) : 0);

                      return (
                        <TableRow key={month.key}>
                          <TableCell>{month.label}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={currentValue || ''}
                              onChange={(e) =>
                                setTargetValues((prev) => ({
                                  ...prev,
                                  [month.key]:
                                    parseFloat(e.target.value) || 0,
                                }))
                              }
                              className="w-32 font-mono"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                currentValue > 0 ? 'default' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {currentValue > 0 ? 'Ingevuld' : 'Leeg'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <Button
                  onClick={saveMonthlyTargets}
                  className="mt-4"
                  disabled={upsertTargets.isPending}
                >
                  {upsertTargets.isPending ? 'Opslaan...' : 'Opslaan'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
