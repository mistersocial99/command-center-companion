import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useKpiEntries } from '@/hooks/useKpiEntries';
import { useScoreCache } from '@/hooks/useScoreCache';
import { calculateSubGoalScore, getTrafficLight } from '@/lib/scoring-engine';
import { getCurrentMonth, formatScore } from '@/lib/utils';
import { QUERY_STALE_TIME, ROUTES } from '@/lib/constants';
import type { SubGoal, KpiEntry } from '@/types/database';
import { SCORING_TYPE_LABELS, FREQUENCY_LABELS } from '@/types/scoring';
import { ScoreCard } from '@/components/shared/ScoreCard';
import { TrafficLightBadge } from '@/components/shared/TrafficLightBadge';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getInitials } from '@/lib/utils';

export function SubKpiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();

  // Fetch sub-goal with relations
  const { data: subGoal, isLoading: loadingSubGoal } = useQuery({
    queryKey: ['sub-goal-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('sub_goals')
        .select(
          '*, goals(naam, kpi_code, type, jaardoel, jaardoel_tekst, pillar_id, pillars(naam, code)), sub_goal_assignments(id, user_id, users(id, naam, email))'
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as SubGoal;
    },
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });

  // Fetch entries for this sub-goal
  const { data: entries = [], isLoading: loadingEntries } = useKpiEntries(
    id ?? undefined
  );

  // Calculate score from entries
  const calculatedScore = useMemo(() => {
    if (!subGoal || entries.length === 0) return null;
    const values = entries.map((e) => e.waarde);
    return calculateSubGoalScore(subGoal.type, values, subGoal.target_value);
  }, [subGoal, entries]);

  const trafficLight = getTrafficLight(calculatedScore);

  const assignedUsers = useMemo(
    () =>
      subGoal?.sub_goal_assignments
        ?.map((a) => a.users)
        .filter(Boolean) ?? [],
    [subGoal]
  );

  // Group entries by user
  const entriesByUser = useMemo(() => {
    const grouped = new Map<string, KpiEntry[]>();
    entries.forEach((entry) => {
      const existing = grouped.get(entry.user_id) ?? [];
      grouped.set(entry.user_id, [...existing, entry]);
    });
    return grouped;
  }, [entries]);

  if (loadingSubGoal) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!subGoal) {
    return (
      <EmptyState
        title="Sub-KPI niet gevonden"
        description="Deze sub-KPI bestaat niet of je hebt geen toegang."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to={ROUTES.DEPARTMENT_SUB_KPIS}
        className="inline-flex items-center text-sm text-sky-600 hover:underline"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Terug naar Sub-KPIs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-mono">
            {subGoal.goals?.kpi_code} / {subGoal.goals?.pillars?.code}
          </p>
          <h1 className="text-2xl font-bold text-slate-900">{subGoal.titel}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Onderdeel van: {subGoal.goals?.naam}
          </p>
        </div>
        <TrafficLightBadge status={trafficLight} size="md" />
      </div>

      {/* Score + metadata cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreCard
          title="Huidige score"
          score={calculatedScore}
          trafficLight={trafficLight}
          subtitle={`${entries.length} invoer(en)`}
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Type</span>
              <span className="font-medium">
                {SCORING_TYPE_LABELS[subGoal.type]}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Frequentie</span>
              <Badge variant="secondary" className="text-xs">
                {FREQUENCY_LABELS[subGoal.frequency]}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Gewicht</span>
              <span className="font-mono font-medium">{subGoal.gewicht_pct}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Target</span>
              <span className="font-medium">
                {subGoal.target_tekst ?? subGoal.target_value ?? 'NTB'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <CardTitle className="text-sm text-slate-500">
                Toegewezen ({assignedUsers.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {assignedUsers.length === 0 ? (
              <p className="text-sm text-slate-400">Geen teamleden toegewezen</p>
            ) : (
              <div className="space-y-2">
                {assignedUsers.map((user) =>
                  user ? (
                    <div key={user.id} className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-sky-100 text-sky-700">
                          {getInitials(user.naam)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.naam}</span>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress visualization */}
      {subGoal.target_value && calculatedScore !== null && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Voortgang naar target</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressBar
              value={calculatedScore}
              trafficLight={trafficLight}
              showPercentage
              height="md"
            />
          </CardContent>
        </Card>
      )}

      {/* Entries table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoergeschiedenis</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEntries ? (
            <Skeleton className="h-32 w-full" />
          ) : entries.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Nog geen data ingevoerd voor deze sub-KPI.
            </p>
          ) : (
            <Table aria-label="Invoergeschiedenis">
              <TableHeader>
                <TableRow>
                  <TableHead>Periode</TableHead>
                  <TableHead>Medewerker</TableHead>
                  <TableHead className="text-right">Waarde</TableHead>
                  <TableHead>Notitie</TableHead>
                  <TableHead>Ingevoerd op</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const assignedUser = assignedUsers.find(
                    (u) => u?.id === entry.user_id
                  );
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">
                        {entry.periode}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[9px] bg-slate-100">
                              {getInitials(assignedUser?.naam ?? '?')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {assignedUser?.naam ?? 'Onbekend'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {entry.waarde}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 max-w-xs truncate">
                        {entry.notitie ?? '--'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {new Date(entry.created_at).toLocaleDateString('nl-NL')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
