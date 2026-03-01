import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { MonthlyTarget } from '@/types/database';
import { QUERY_STALE_TIME } from '@/lib/constants';
import { toast } from 'sonner';

export function useMonthlyTargets(goalId?: string) {
  return useQuery({
    queryKey: ['monthly-targets', goalId],
    queryFn: async () => {
      if (!goalId) return [];
      const { data, error } = await supabase
        .from('monthly_targets')
        .select('*')
        .eq('goal_id', goalId)
        .order('maand');

      if (error) throw error;
      return data as MonthlyTarget[];
    },
    enabled: !!goalId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useUpsertMonthlyTargets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      targets: Array<{ goal_id: string; maand: string; target_value: number }>
    ) => {
      const { data, error } = await supabase
        .from('monthly_targets')
        .upsert(targets, { onConflict: 'goal_id,maand' })
        .select();

      if (error) throw error;
      return data as MonthlyTarget[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-targets'] });
      toast.success('Maandtargets opgeslagen');
    },
    onError: () => {
      toast.error('Opslaan mislukt');
    },
  });
}
