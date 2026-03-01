import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ScoreCache } from '@/types/database';
import type { ScoreEntityType } from '@/types/scoring';
import { QUERY_STALE_TIME } from '@/lib/constants';

export function useScoreCache(
  entityType: ScoreEntityType,
  entityIds: string[],
  periode?: string
) {
  return useQuery({
    queryKey: ['score-cache', entityType, entityIds, periode],
    queryFn: async () => {
      let query = supabase
        .from('score_cache')
        .select('*')
        .eq('entity_type', entityType)
        .in('entity_id', entityIds);

      if (periode) {
        query = query.eq('periode', periode);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Return as a map for easy lookup
      const scoreMap = new Map<string, ScoreCache>();
      (data as ScoreCache[]).forEach((score) => {
        scoreMap.set(score.entity_id, score);
      });

      return scoreMap;
    },
    enabled: entityIds.length > 0,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCompanyScore(periode?: string) {
  return useQuery({
    queryKey: ['company-score', periode],
    queryFn: async () => {
      let query = supabase
        .from('score_cache')
        .select('*')
        .eq('entity_type', 'company');

      if (periode) {
        query = query.eq('periode', periode);
      }

      const { data, error } = await query
        .order('berekend_op', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ScoreCache | null;
    },
    staleTime: QUERY_STALE_TIME,
  });
}
