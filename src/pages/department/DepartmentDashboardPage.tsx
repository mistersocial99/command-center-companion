import { useAuth } from '@/hooks/useAuth';
import { useGoalsByDepartment } from '@/hooks/useGoals';
import { useTeamCheckins } from '@/hooks/useWeeklyCheckins';
import { useScoreCache } from '@/hooks/useScoreCache';
import { getTrafficLight } from '@/lib/scoring-engine';
import { getCurrentISOWeek, getCurrentMonth } from '@/lib/utils';
import { ScoreCard } from '@/components/shared/ScoreCard';
import { TrafficLightBadge } from '@/components/shared/TrafficLightBadge';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

export function DepartmentDashboardPage() {
  const { profile } = useAuth();
  const departmentId = profile?.afdeling_id;
  const currentWeek = getCurrentISOWeek();

  const { data: goals = [], isLoading: loadingGoals } = useGoalsByDepartment(
    departmentId ?? undefined
  );
  const { data: teamCheckins = [], isLoading: loadingCheckins } = useTeamCheckins(
    departmentId ?? undefined,
    currentWeek
  );

  const goalIds = goals.map((g) => g.id);
  const { data: goalScores } = useScoreCache('goal', goalIds, getCurrentMonth());

  // Check for weight warnings
  const weightWarnings = goals
    .filter((g) => {
      const subGoals = g.sub_goals?.filter((sg) => sg.is_actief) ?? [];
      const totalWeight = subGoals.reduce((sum, sg) => sum + sg.gewicht_pct, 0);
      return subGoals.length > 0 && totalWeight !== 100;
    })
    .map((g) => {
      const subGoals = g.sub_goals?.filter((sg) => sg.is_actief) ?? [];
      const totalWeight = subGoals.reduce((sum, sg) => sum + sg.gewicht_pct, 0);
      return `KPI ${g.kpi_code} heeft sub-KPIs met totaal gewicht ${totalWeight}%.`;
    });

  if (loadingGoals) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const planCount = teamCheckins.filter((tc) => tc.checkin?.is_plan_ingevoerd).length;
  const reviewCount = teamCheckins.filter((tc) => tc.checkin?.is_review_ingevoerd).length;
  const totalTeam = teamCheckins.length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">
        {profile?.departments?.naam ?? 'Afdeling'} Dashboard
      </h1>

      {/* Weight warnings */}
      {weightWarnings.length > 0 && (
        <AlertBanner
          variant="warning"
          title="Gewichten kloppen niet"
          description={weightWarnings.join(' ')}
          action={{
            label: 'Gewichten aanpassen',
            onClick: () => {},
          }}
        />
      )}

      {/* KPI cards grid */}
      {goals.length === 0 ? (
        <EmptyState
          title="Geen KPIs voor deze afdeling"
          description="Er zijn nog geen KPIs gekoppeld aan jouw afdeling. Neem contact op met de admin."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const score = goalScores?.get(goal.id);
            const scoreValue = score ? Number(score.score) : null;
            const tl = score ? score.traffic_light : getTrafficLight(null);
            const subGoals = goal.sub_goals?.filter((sg) => sg.is_actief) ?? [];

            return (
              <Card key={goal.id} className="border-l-4 border-l-slate-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-mono">
                        KPI {goal.kpi_code}
                      </p>
                      <CardTitle className="text-base">{goal.naam}</CardTitle>
                    </div>
                    <TrafficLightBadge
                      status={tl as 'groen' | 'oranje' | 'rood' | 'geen_data'}
                      size="sm"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-semibold text-slate-900">
                      {scoreValue !== null ? Math.round(scoreValue) : '--'}
                    </span>
                  </div>
                  <ProgressBar
                    value={scoreValue ?? 0}
                    trafficLight={tl as 'groen' | 'oranje' | 'rood' | 'geen_data'}
                    showPercentage={false}
                    height="sm"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Target: {goal.jaardoel_tekst ?? goal.jaardoel ?? 'NTB'}
                    </span>
                    <span>{subGoals.length} sub-KPIs</span>
                  </div>
                  <Link
                    to={ROUTES.DEPARTMENT_SUB_KPIS}
                    className="text-xs text-sky-600 hover:underline"
                  >
                    Sub-KPIs beheren &rarr;
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Team check-ins preview */}
      {totalTeam > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Team check-ins deze week
              </CardTitle>
              <Link
                to={ROUTES.DEPARTMENT_CHECKINS}
                className="text-sm text-sky-600 hover:underline"
              >
                Alles bekijken &rarr;
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              Ingevuld: {planCount}/{totalTeam} plan, {reviewCount}/{totalTeam}{' '}
              review
            </p>
          </CardHeader>
          <CardContent>
            {loadingCheckins ? (
              <Skeleton className="h-20" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {teamCheckins.slice(0, 8).map(({ user, checkin }) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <span className="text-sm font-medium truncate">
                      {user.naam}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          checkin?.is_plan_ingevoerd ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {checkin?.is_plan_ingevoerd ? (
                          <Check className="mr-1 h-3 w-3" />
                        ) : (
                          <X className="mr-1 h-3 w-3" />
                        )}
                        Plan
                      </Badge>
                      <Badge
                        variant={
                          checkin?.is_review_ingevoerd ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {checkin?.is_review_ingevoerd ? (
                          <Check className="mr-1 h-3 w-3" />
                        ) : (
                          <X className="mr-1 h-3 w-3" />
                        )}
                        Review
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
