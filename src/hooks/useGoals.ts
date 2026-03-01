import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Goal, GoalUpdate } from '@/types/database';
import { QUERY_STALE_TIME } from '@/lib/constants';
import { toast } from 'sonner';

export function useGoals(pillarId?: string) {
  return useQuery({
    queryKey: ['goals', pillarId],
    queryFn: async () => {
      let query = supabase
        .from('goals')
        .select('*, pillars(naam, code)')
        .order('volgorde');

      if (pillarId) {
        query = query.eq('pillar_id', pillarId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Goal[];
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useGoalsByDepartment(departmentId: string | undefined) {
  return useQuery({
    queryKey: ['goals-by-department', departmentId],
    queryFn: async () => {
      if (!departmentId) return [];
      const { data, error } = await supabase
        .from('goals')
        .select('*, pillars(naam, code), sub_goals(id, titel, gewicht_pct, type, target_value, frequency, is_actief, sub_goal_assignments(id, user_id))')
        .contains('afdeling_ids', [departmentId])
        .order('volgorde');

      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!departmentId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useUpdateGoalWeight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; gewicht_pct: number }>) => {
      const promises = updates.map(({ id, gewicht_pct }) =>
        supabase
          .from('goals')
          .update({ gewicht_pct })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('KPI gewichten opgeslagen');
    },
    onError: () => {
      toast.error('Opslaan mislukt');
    },
  });
}
