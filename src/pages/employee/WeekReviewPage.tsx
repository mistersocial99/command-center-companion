import { useAuth } from '@/hooks/useAuth';
import { useWeeklyCheckin, useSaveWeekReview } from '@/hooks/useWeeklyCheckins';
import { getCurrentISOWeek } from '@/lib/utils';
import { WeeklyCheckinForm } from '@/components/shared/WeeklyCheckinForm';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

export function WeekReviewPage() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const currentWeek = getCurrentISOWeek();

  const { data: checkin, isLoading } = useWeeklyCheckin(userId, currentWeek);
  const saveWeekReview = useSaveWeekReview();

  const handleSubmit = (data: {
    review?: string;
    scoreEigen?: number | null;
  }) => {
    if (!userId || !data.review) return;
    saveWeekReview.mutate({
      userId,
      week: currentWeek,
      review: data.review,
      scoreEigen: data.scoreEigen ?? null,
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
        <h1 className="text-3xl font-bold text-slate-900">Weekreview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Week {currentWeek} | Reflecteer op je week
        </p>
      </div>

      {/* Warning if no plan was filled in */}
      {!checkin?.is_plan_ingevoerd && (
        <AlertBanner
          variant="info"
          title="Nog geen weekplan ingevuld"
          description="Je hebt nog geen weekplan voor deze week. Je kunt alsnog een review invullen, maar het is handig om eerst een plan te maken."
          action={{
            label: 'Weekplan invullen',
            onClick: () => {
              window.location.href = ROUTES.DASHBOARD_PLAN;
            },
          }}
        />
      )}

      {/* Success state after saving */}
      {checkin?.is_review_ingevoerd && !saveWeekReview.isPending && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-green-100 p-1">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                Review is ingevuld
              </p>
              <p className="text-xs text-green-600">
                Je kunt je review hieronder bijwerken of{' '}
                <Link
                  to={ROUTES.DASHBOARD}
                  className="underline font-medium"
                >
                  terug naar je dashboard
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <WeeklyCheckinForm
        type="review"
        week={currentWeek}
        existingPlan={checkin?.maandag_plan ?? undefined}
        initialData={{
          review: checkin?.vrijdag_review ?? undefined,
          scoreEigen: checkin?.score_eigen ?? undefined,
        }}
        onSubmit={handleSubmit}
        isLoading={saveWeekReview.isPending}
      />
    </div>
  );
}
