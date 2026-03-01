import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Pillar, PillarUpdate } from '@/types/database';
import { QUERY_STALE_TIME } from '@/lib/constants';
import { toast } from 'sonner';

export function usePillars() {
  return useQuery({
    queryKey: ['pillars'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pillars')
        .select('*')
        .order('volgorde');

      if (error) throw error;
      return data as Pillar[];
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useUpdatePillarWeight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; gewicht_pct: number }>) => {
      const promises = updates.map(({ id, gewicht_pct }) =>
        supabase
          .from('pillars')
          .update({ gewicht_pct })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pillars'] });
      toast.success('Pilaargewichten opgeslagen');
    },
    onError: () => {
      toast.error('Opslaan mislukt');
    },
  });
}
