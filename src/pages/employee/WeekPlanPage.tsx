import { useAuth } from '@/hooks/useAuth';
import { useWeeklyCheckin, useSaveWeekPlan } from '@/hooks/useWeeklyCheckins';
import { getCurrentISOWeek } from '@/lib/utils';
import { WeeklyCheckinForm } from '@/components/shared/WeeklyCheckinForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

export function WeekPlanPage() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const currentWeek = getCurrentISOWeek();

  const { data: checkin, isLoading } = useWeeklyCheckin(userId, currentWeek);
  const saveWeekPlan = useSaveWeekPlan();

  const handleSubmit = (data: { plan?: string[] }) => {
    if (!userId || !data.plan) return;
    saveWeekPlan.mutate({
      userId,
      week: currentWeek,
      items: data.plan,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Weekplan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Week {currentWeek} | Vul je commitments in voor deze week
        </p>
      </div>

      {/* Success state after saving */}
      {checkin?.is_plan_ingevoerd && !saveWeekPlan.isPending && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-green-100 p-1">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                Weekplan is ingevuld
              </p>
              <p className="text-xs text-green-600">
                Je kunt je plan hieronder bijwerken of{' '}
                <Link
                  to={ROUTES.DASHBOARD_REVIEW}
                  className="underline font-medium"
                >
                  je weekreview invullen
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <WeeklyCheckinForm
        type="plan"
        week={currentWeek}
        initialData={{
          plan: checkin?.maandag_plan ?? undefined,
        }}
        onSubmit={handleSubmit}
        isLoading={saveWeekPlan.isPending}
      />
    </div>
  );
}
