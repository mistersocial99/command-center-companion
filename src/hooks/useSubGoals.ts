import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SubGoal, SubGoalInsert, SubGoalUpdate } from '@/types/database';
import { QUERY_STALE_TIME } from '@/lib/constants';
import { toast } from 'sonner';

export function useSubGoals(goalId?: string, departmentId?: string) {
  return useQuery({
    queryKey: ['sub-goals', goalId, departmentId],
    queryFn: async () => {
      let query = supabase
        .from('sub_goals')
        .select(
          '*, goals(naam, kpi_code, type, pillar_id), sub_goal_assignments(id, user_id, users(id, naam, email))'
        )
        .eq('is_actief', true)
        .order('created_at');

      if (goalId) {
        query = query.eq('goal_id', goalId);
      }
      if (departmentId) {
        query = query.eq('afdeling_id', departmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SubGoal[];
    },
    enabled: !!(goalId || departmentId),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useMySubGoals(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-sub-goals', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('sub_goal_assignments')
        .select(
          'sub_goals(id, titel, type, gewicht_pct, target_value, target_tekst, frequency, goal_id, goals(naam, kpi_code, pillar_id, pillars(naam, code)))'
        )
        .eq('user_id', userId);

      if (error) throw error;
      return (data ?? []).map((d) => d.sub_goals).filter(Boolean) as SubGoal[];
    },
    enabled: !!userId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateSubGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subGoal,
      userIds,
    }: {
      subGoal: Omit<SubGoalInsert, 'id'>;
      userIds?: string[];
    }) => {
      const { data, error } = await supabase
        .from('sub_goals')
        .insert(subGoal)
        .select()
        .single();

      if (error) throw error;

      // Create assignments
      if (userIds && userIds.length > 0) {
        const assignments = userIds.map((userId) => ({
          sub_goal_id: data.id,
          user_id: userId,
        }));
        const { error: assignError } = await supabase
          .from('sub_goal_assignments')
          .insert(assignments);

        if (assignError) throw assignError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-goals'] });
      queryClient.invalidateQueries({ queryKey: ['my-sub-goals'] });
      toast.success('Sub-KPI aangemaakt');
    },
    onError: (error: Error) => {
      if (error.message.includes('100%')) {
        toast.error('Gewichten overschrijden 100%. Pas gewichten aan.');
      } else {
        toast.error('Aanmaken mislukt');
      }
    },
  });
}

export function useUpdateSubGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: SubGoalUpdate;
    }) => {
      const { data, error } = await supabase
        .from('sub_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-goals'] });
      queryClient.invalidateQueries({ queryKey: ['my-sub-goals'] });
      toast.success('Sub-KPI bijgewerkt');
    },
    onError: () => {
      toast.error('Bijwerken mislukt');
    },
  });
}

export function useDeleteSubGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete via is_actief
      const { error } = await supabase
        .from('sub_goals')
        .update({ is_actief: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-goals'] });
      queryClient.invalidateQueries({ queryKey: ['my-sub-goals'] });
      toast.success('Sub-KPI verwijderd');
    },
    onError: () => {
      toast.error('Verwijderen mislukt');
    },
  });
}
