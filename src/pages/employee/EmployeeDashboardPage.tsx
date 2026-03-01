import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, PenLine, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMySubGoals } from '@/hooks/useSubGoals';
import { useWeeklyCheckin } from '@/hooks/useWeeklyCheckins';
import { useKpiEntries } from '@/hooks/useKpiEntries';
import { calculateSubGoalScore, getTrafficLight } from '@/lib/scoring-engine';
import { getCurrentISOWeek, getGreeting, getFirstName, formatScore } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { ScoreCard } from '@/components/shared/ScoreCard';
import { TrafficLightBadge } from '@/components/shared/TrafficLightBadge';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function EmployeeDashboardPage() {
  const { profile } = useAuth();
  const currentWeek = getCurrentISOWeek();

  const { data: mySubGoals = [], isLoading: loadingSubGoals } = useMySubGoals(
    profile?.id
  );

  const { data: checkin, isLoading: loadingCheckin } = useWeeklyCheckin(
    profile?.id,
    currentWeek
  );

  // Calculate overall average score across sub-goals
  const greeting = getGreeting();
  const firstName = profile ? getFirstName(profile.naam) : '';

  if (loadingSubGoals) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Week {currentWeek} | {profile?.departments?.naam ?? 'Geen afdeling'}
        </p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to={ROUTES.DASHBOARD_PLAN}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-sky-500">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-lg bg-sky-50 p-2.5">
                <ClipboardList className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Weekplan
                </p>
                <p className="text-xs text-slate-500">
                  {checkin?.is_plan_ingevoerd ? (
                    <Badge variant="default" className="text-[10px] h-4">
                      Ingevuld
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] h-4">
                      Nog invullen
                    </Badge>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={ROUTES.DASHBOARD_REVIEW}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-lg bg-green-50 p-2.5">
                <PenLine className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Weekreview
                </p>
                <p className="text-xs text-slate-500">
                  {checkin?.is_review_ingevoerd ? (
                    <Badge variant="default" className="text-[10px] h-4">
                      Ingevuld
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] h-4">
                      Nog invullen
                    </Badge>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={ROUTES.DASHBOARD_INPUT}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-lg bg-amber-50 p-2.5">
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  KPI Data invoeren
                </p>
                <p className="text-xs text-slate-500">
                  {mySubGoals.length} sub-KPIs toegewezen
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* My Sub-KPIs overview */}
      {mySubGoals.length === 0 ? (
        <EmptyState
          title="Geen sub-KPIs toegewezen"
          description="Je hebt nog geen sub-KPIs toegewezen gekregen. Neem contact op met je manager."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mijn Sub-KPIs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {mySubGoals.map((sg) => (
                <SubGoalRow key={sg.id} subGoal={sg} userId={profile?.id} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current week plan */}
      {checkin?.is_plan_ingevoerd && checkin.maandag_plan && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Mijn weekplan - {currentWeek}
              </CardTitle>
              <Link
                to={ROUTES.DASHBOARD_PLAN}
                className="text-xs text-sky-600 hover:underline"
              >
                Bewerken
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-1">
              {checkin.maandag_plan.map((item, i) => (
                <li key={i} className="text-sm text-slate-700">
                  {item}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Sub-component: row per sub-goal with inline score
function SubGoalRow({
  subGoal,
  userId,
}: {
  subGoal: NonNullable<ReturnType<typeof useMySubGoals>['data']>[number];
  userId: string | undefined;
}) {
  const { data: entries = [] } = useKpiEntries(subGoal.id, userId);

  const score = useMemo(() => {
    if (entries.length === 0) return null;
    const values = entries.map((e) => e.waarde);
    return calculateSubGoalScore(subGoal.type, values, subGoal.target_value);
  }, [entries, subGoal.type, subGoal.target_value]);

  const trafficLight = getTrafficLight(score);

  return (
    <div className="flex items-center justify-between p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{subGoal.titel}</p>
        <p className="text-xs text-slate-500">
          {subGoal.goals?.kpi_code} | Gewicht: {subGoal.gewicht_pct}%
        </p>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <span className="text-lg font-mono font-semibold text-slate-900">
          {formatScore(score)}
        </span>
        <TrafficLightBadge status={trafficLight} size="sm" />
      </div>
    </div>
  );
}
