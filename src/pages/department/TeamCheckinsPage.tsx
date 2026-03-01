import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTeamCheckins } from '@/hooks/useWeeklyCheckins';
import { getCurrentISOWeek } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getInitials } from '@/lib/utils';
import type { WeeklyCheckin, User } from '@/types/database';

function getWeekOffset(baseWeek: string, offset: number): string {
  // Parse "2026-W09" format
  const match = baseWeek.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return baseWeek;

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  let newWeek = week + offset;
  let newYear = year;

  if (newWeek < 1) {
    newYear -= 1;
    newWeek = 52; // Simplified: assume 52 weeks
  } else if (newWeek > 53) {
    newYear += 1;
    newWeek = 1;
  }

  return `${newYear}-W${String(newWeek).padStart(2, '0')}`;
}

export function TeamCheckinsPage() {
  const { profile } = useAuth();
  const departmentId = profile?.afdeling_id;
  const [weekOffset, setWeekOffset] = useState(0);

  const currentWeek = getCurrentISOWeek();
  const displayWeek = getWeekOffset(currentWeek, weekOffset);

  const { data: teamCheckins = [], isLoading } = useTeamCheckins(
    departmentId ?? undefined,
    displayWeek
  );

  const [detailCheckin, setDetailCheckin] = useState<{
    user: Pick<User, 'id' | 'naam' | 'email'>;
    checkin: WeeklyCheckin | null;
  } | null>(null);

  const planCount = teamCheckins.filter(
    (tc) => tc.checkin?.is_plan_ingevoerd
  ).length;
  const reviewCount = teamCheckins.filter(
    (tc) => tc.checkin?.is_review_ingevoerd
  ).length;
  const totalTeam = teamCheckins.length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Team Check-ins</h1>

      {/* Week navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekOffset((o) => o - 1)}
          aria-label="Vorige week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">{displayWeek}</p>
          {weekOffset === 0 && (
            <p className="text-xs text-slate-500">Deze week</p>
          )}
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-sky-600 hover:underline"
            >
              Ga naar deze week
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekOffset((o) => o + 1)}
          disabled={weekOffset >= 0}
          aria-label="Volgende week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">
              Weekplannen ingevuld
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono text-slate-900">
              {planCount}
              <span className="text-lg text-slate-400">/{totalTeam}</span>
            </p>
            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{
                  width: totalTeam > 0 ? `${(planCount / totalTeam) * 100}%` : '0%',
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">
              Reviews ingevuld
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono text-slate-900">
              {reviewCount}
              <span className="text-lg text-slate-400">/{totalTeam}</span>
            </p>
            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{
                  width:
                    totalTeam > 0
                      ? `${(reviewCount / totalTeam) * 100}%`
                      : '0%',
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team members list */}
      {totalTeam === 0 ? (
        <EmptyState
          title="Geen teamleden gevonden"
          description="Er zijn geen actieve medewerkers in jouw afdeling."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Teamoverzicht - {displayWeek}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {teamCheckins.map(({ user, checkin }) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-sky-100 text-sky-700">
                        {getInitials(user.naam)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.naam}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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

                    {(checkin?.is_plan_ingevoerd ||
                      checkin?.is_review_ingevoerd) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDetailCheckin({ user, checkin })}
                        aria-label={`Bekijk check-in van ${user.naam}`}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail dialog */}
      <Dialog
        open={!!detailCheckin}
        onOpenChange={() => setDetailCheckin(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Check-in van {detailCheckin?.user.naam} - {displayWeek}
            </DialogTitle>
          </DialogHeader>

          {detailCheckin?.checkin && (
            <div className="space-y-6">
              {/* Plan section */}
              {detailCheckin.checkin.is_plan_ingevoerd &&
                detailCheckin.checkin.maandag_plan && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                      Weekplan
                    </h3>
                    <ol className="list-decimal list-inside space-y-1">
                      {detailCheckin.checkin.maandag_plan.map((item, i) => (
                        <li key={i} className="text-sm text-slate-600">
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

              {/* Review section */}
              {detailCheckin.checkin.is_review_ingevoerd && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Review
                  </h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {detailCheckin.checkin.vrijdag_review}
                  </p>
                  {detailCheckin.checkin.score_eigen !== null && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        Zelfscore:
                      </span>
                      <Badge variant="outline" className="font-mono">
                        {detailCheckin.checkin.score_eigen}/100
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
