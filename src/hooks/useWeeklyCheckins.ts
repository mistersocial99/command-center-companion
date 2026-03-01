import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { WeeklyCheckin } from '@/types/database';
import { QUERY_STALE_TIME } from '@/lib/constants';
import { toast } from 'sonner';

export function useWeeklyCheckin(userId: string | undefined, week: string) {
  return useQuery({
    queryKey: ['weekly-checkin', userId, week],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('week', week)
        .maybeSingle();

      if (error) throw error;
      return data as WeeklyCheckin | null;
    },
    enabled: !!userId && !!week,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useTeamCheckins(departmentId: string | undefined, week: string) {
  return useQuery({
    queryKey: ['team-checkins', departmentId, week],
    queryFn: async () => {
      if (!departmentId) return [];

      // First get department users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, naam, email')
        .eq('afdeling_id', departmentId)
        .eq('is_actief', true)
        .order('naam');

      if (usersError) throw usersError;

      // Then get their checkins
      const userIds = users.map((u) => u.id);
      const { data: checkins, error: checkinsError } = await supabase
        .from('weekly_checkins')
        .select('*')
        .in('user_id', userIds)
        .eq('week', week);

      if (checkinsError) throw checkinsError;

      // Merge
      return users.map((user) => ({
        user,
        checkin: (checkins as WeeklyCheckin[]).find((c) => c.user_id === user.id) ?? null,
      }));
    },
    enabled: !!departmentId && !!week,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useSaveWeekPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      week,
      items,
    }: {
      userId: string;
      week: string;
      items: string[];
    }) => {
      // Check if record already exists to avoid overwriting review fields
      const { data: existing } = await supabase
        .from('weekly_checkins')
        .select('id')
        .eq('user_id', userId)
        .eq('week', week)
        .maybeSingle();

      let data;
      let error;

      if (existing) {
        // Update only plan fields, preserve review fields
        ({ data, error } = await supabase
          .from('weekly_checkins')
          .update({
            maandag_plan: items,
            is_plan_ingevoerd: true,
          })
          .eq('user_id', userId)
          .eq('week', week)
          .select()
          .single());
      } else {
        // Insert new record
        ({ data, error } = await supabase
          .from('weekly_checkins')
          .insert({
            user_id: userId,
            week,
            maandag_plan: items,
            is_plan_ingevoerd: true,
          })
          .select()
          .single());
      }

      if (error) throw error;
      return data as WeeklyCheckin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-checkin'] });
      queryClient.invalidateQueries({ queryKey: ['team-checkins'] });
      toast.success('Weekplan opgeslagen');
    },
    onError: () => {
      toast.error('Opslaan mislukt');
    },
  });
}

export function useSaveWeekReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      week,
      review,
      scoreEigen,
    }: {
      userId: string;
      week: string;
      review: string;
      scoreEigen: number | null;
    }) => {
      // Check if record already exists to avoid overwriting plan fields
      const { data: existing } = await supabase
        .from('weekly_checkins')
        .select('id')
        .eq('user_id', userId)
        .eq('week', week)
        .maybeSingle();

      let data;
      let error;

      if (existing) {
        // Update only review fields, preserve plan fields
        ({ data, error } = await supabase
          .from('weekly_checkins')
          .update({
            vrijdag_review: review,
            score_eigen: scoreEigen,
            is_review_ingevoerd: true,
          })
          .eq('user_id', userId)
          .eq('week', week)
          .select()
          .single());
      } else {
        // Insert new record
        ({ data, error } = await supabase
          .from('weekly_checkins')
          .insert({
            user_id: userId,
            week,
            vrijdag_review: review,
            score_eigen: scoreEigen,
            is_review_ingevoerd: true,
          })
          .select()
          .single());
      }

      if (error) throw error;
      return data as WeeklyCheckin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-checkin'] });
      queryClient.invalidateQueries({ queryKey: ['team-checkins'] });
      toast.success('Review opgeslagen');
    },
    onError: () => {
      toast.error('Opslaan mislukt');
    },
  });
}
