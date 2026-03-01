import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGoalsByDepartment } from '@/hooks/useGoals';
import {
  useSubGoals,
  useCreateSubGoal,
  useUpdateSubGoal,
  useDeleteSubGoal,
} from '@/hooks/useSubGoals';
import { SubGoalManager } from '@/components/shared/SubGoalManager';
import { TeamMemberSelector } from '@/components/shared/TeamMemberSelector';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SCORING_TYPE_LABELS, FREQUENCY_LABELS } from '@/types/scoring';
import type { ScoringType, } from '@/types/scoring';
import { ROUTES, WEIGHT_LIMITS, SUB_GOAL_LIMITS } from '@/lib/constants';

const subGoalSchema = z.object({
  titel: z.string().min(3, 'Minimaal 3 tekens').max(100, 'Maximaal 100 tekens'),
  type: z.enum([
    'volume',
    'waarde',
    'ratio',
    'ratio_lager_beter',
    'norm',
    'tijd_lager_beter',
    'mijlpaal',
  ]),
  gewicht_pct: z
    .number()
    .min(WEIGHT_LIMITS.MIN, `Minimaal ${WEIGHT_LIMITS.MIN}%`)
    .max(WEIGHT_LIMITS.MAX, `Maximaal ${WEIGHT_LIMITS.MAX}%`),
  target_value: z.number().min(0).nullable(),
  target_tekst: z.string().max(200).nullable(),
  frequency: z.enum(['dagelijks', 'wekelijks', 'maandelijks']),
});

type SubGoalFormData = z.infer<typeof subGoalSchema>;

export function SubKpiManagementPage() {
  const { profile } = useAuth();
  const departmentId = profile?.afdeling_id;

  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const { data: goals = [], isLoading: loadingGoals } = useGoalsByDepartment(
    departmentId ?? undefined
  );

  const { data: subGoals = [], isLoading: loadingSubGoals } = useSubGoals(
    selectedGoalId || undefined,
    departmentId ?? undefined
  );

  const createSubGoal = useCreateSubGoal();
  const updateSubGoal = useUpdateSubGoal();
  const deleteSubGoal = useDeleteSubGoal();

  const form = useForm<SubGoalFormData>({
    resolver: zodResolver(subGoalSchema),
    defaultValues: {
      titel: '',
      type: 'volume',
      gewicht_pct: 0,
      target_value: null,
      target_tekst: null,
      frequency: 'maandelijks',
    },
  });

  const activeSubGoals = useMemo(
    () => subGoals.filter((sg) => sg.is_actief),
    [subGoals]
  );

  const totalWeight = useMemo(
    () => activeSubGoals.reduce((sum, sg) => sum + sg.gewicht_pct, 0),
    [activeSubGoals]
  );

  // Filter sub-goals for the selected goal
  const filteredSubGoals = useMemo(() => {
    if (!selectedGoalId) return activeSubGoals;
    return activeSubGoals.filter((sg) => sg.goal_id === selectedGoalId);
  }, [activeSubGoals, selectedGoalId]);

  const filteredTotalWeight = useMemo(
    () => filteredSubGoals.reduce((sum, sg) => sum + sg.gewicht_pct, 0),
    [filteredSubGoals]
  );

  const handleAdd = () => {
    if (!selectedGoalId) return;
    setEditId(null);
    setSelectedUserIds([]);
    form.reset({
      titel: '',
      type: 'volume',
      gewicht_pct: Math.max(0, 100 - filteredTotalWeight),
      target_value: null,
      target_tekst: null,
      frequency: 'maandelijks',
    });
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    const sg = subGoals.find((s) => s.id === id);
    if (!sg) return;
    setEditId(id);
    setSelectedUserIds(
      sg.sub_goal_assignments?.map((a) => a.user_id) ?? []
    );
    form.reset({
      titel: sg.titel,
      type: sg.type,
      gewicht_pct: sg.gewicht_pct,
      target_value: sg.target_value,
      target_tekst: sg.target_tekst,
      frequency: sg.frequency,
    });
    setDialogOpen(true);
  };

  const handleSave = async (data: SubGoalFormData) => {
    if (!departmentId || !selectedGoalId) return;

    if (editId) {
      await updateSubGoal.mutateAsync({
        id: editId,
        updates: {
          titel: data.titel,
          type: data.type,
          gewicht_pct: data.gewicht_pct,
          target_value: data.target_value,
          target_tekst: data.target_tekst,
          frequency: data.frequency,
        },
      });
    } else {
      await createSubGoal.mutateAsync({
        subGoal: {
          goal_id: selectedGoalId,
          titel: data.titel,
          type: data.type,
          gewicht_pct: data.gewicht_pct,
          target_value: data.target_value,
          target_tekst: data.target_tekst,
          frequency: data.frequency,
          afdeling_id: departmentId,
          aangemaakt_door: profile?.id ?? '',
          is_actief: true,
        },
        userIds: selectedUserIds,
      });
    }

    setDialogOpen(false);
    setEditId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteSubGoal.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (loadingGoals) {
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Sub-KPI Beheer</h1>
        {selectedGoalId && filteredSubGoals.length < SUB_GOAL_LIMITS.MAX_PER_GOAL && (
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Sub-KPI toevoegen
          </Button>
        )}
      </div>

      {/* Goal selector */}
      <Select
        value={selectedGoalId}
        onValueChange={(v) => setSelectedGoalId(v)}
      >
        <SelectTrigger className="w-96">
          <SelectValue placeholder="Selecteer een KPI" />
        </SelectTrigger>
        <SelectContent>
          {goals.map((goal) => (
            <SelectItem key={goal.id} value={goal.id}>
              {goal.kpi_code} - {goal.naam}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sub-goals list */}
      {!selectedGoalId ? (
        <EmptyState
          title="Selecteer een KPI"
          description="Kies een KPI uit de dropdown om de bijbehorende sub-KPIs te beheren."
        />
      ) : loadingSubGoals ? (
        <Skeleton className="h-64 w-full" />
      ) : filteredSubGoals.length === 0 ? (
        <EmptyState
          title="Nog geen sub-KPIs"
          description="Voeg de eerste sub-KPI toe voor deze KPI."
          actionLabel="Sub-KPI toevoegen"
          onAction={handleAdd}
        />
      ) : (
        <SubGoalManager
          goalId={selectedGoalId}
          departmentId={departmentId ?? ''}
          subGoals={filteredSubGoals}
          totalWeight={filteredTotalWeight}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteId(id)}
        />
      )}

      {/* Sub-KPI links */}
      {filteredSubGoals.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Klik op een sub-KPI voor details en data-invoer:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredSubGoals.map((sg) => (
              <Link
                key={sg.id}
                to={ROUTES.DEPARTMENT_SUB_KPI_DETAIL.replace(':id', sg.id)}
                className="rounded-lg border p-3 hover:bg-slate-50 transition-colors"
              >
                <p className="text-sm font-medium">{sg.titel}</p>
                <p className="text-xs text-slate-500">
                  {sg.gewicht_pct}% gewicht | {FREQUENCY_LABELS[sg.frequency]}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? 'Sub-KPI bewerken' : 'Sub-KPI toevoegen'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titel">Titel</Label>
              <Input id="titel" {...form.register('titel')} />
              {form.formState.errors.titel && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.titel.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.watch('type')}
                  onValueChange={(v) =>
                    form.setValue('type', v as ScoringType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SCORING_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frequentie</Label>
                <Select
                  value={form.watch('frequency')}
                  onValueChange={(v) =>
                    form.setValue(
                      'frequency',
                      v as 'dagelijks' | 'wekelijks' | 'maandelijks'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gewicht_pct">Gewicht (%)</Label>
                <Input
                  id="gewicht_pct"
                  type="number"
                  min={WEIGHT_LIMITS.MIN}
                  max={WEIGHT_LIMITS.MAX}
                  {...form.register('gewicht_pct', { valueAsNumber: true })}
                  className="font-mono"
                />
                {form.formState.errors.gewicht_pct && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.gewicht_pct.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_value">Target waarde</Label>
                <Input
                  id="target_value"
                  type="number"
                  min={0}
                  {...form.register('target_value', { valueAsNumber: true })}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_tekst">Target omschrijving (optioneel)</Label>
              <Input
                id="target_tekst"
                {...form.register('target_tekst')}
                placeholder="bijv. 500 calls per maand"
              />
            </div>

            {/* Team member assignment */}
            {departmentId && (
              <div className="space-y-2">
                <Label>Teamleden toewijzen</Label>
                <TeamMemberSelector
                  departmentId={departmentId}
                  selectedUserIds={selectedUserIds}
                  onChange={setSelectedUserIds}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                disabled={createSubGoal.isPending || updateSubGoal.isPending}
              >
                {createSubGoal.isPending || updateSubGoal.isPending
                  ? 'Opslaan...'
                  : 'Opslaan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sub-KPI verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              De sub-KPI wordt gedeactiveerd. Bestaande data blijft bewaard,
              maar de sub-KPI wordt niet meer meegeteld in scores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
