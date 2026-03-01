import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { KpiEntry } from '@/types/database';
import { QUERY_STALE_TIME } from '@/lib/constants';
import { toast } from 'sonner';

export function useKpiEntries(subGoalId?: string, userId?: string) {
  return useQuery({
    queryKey: ['kpi-entries', subGoalId, userId],
    queryFn: async () => {
      let query = supabase
        .from('kpi_entries')
        .select('*')
        .order('periode', { ascending: false })
        .limit(20);

      if (subGoalId) {
        query = query.eq('sub_goal_id', subGoalId);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KpiEntry[];
    },
    enabled: !!(subGoalId || userId),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useUpsertKpiEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: {
      sub_goal_id: string;
      user_id: string;
      periode: string;
      waarde: number;
      notitie?: string | null;
      ingevoerd_door?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('kpi_entries')
        .upsert(entry, { onConflict: 'sub_goal_id,user_id,periode' })
        .select()
        .single();

      if (error) throw error;
      return data as KpiEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-entries'] });
      toast.success('Invoer opgeslagen');
    },
    onError: () => {
      toast.error('Opslaan mislukt');
    },
  });
}
