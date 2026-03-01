import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { User, UserUpdate } from '@/types/database';
import { QUERY_STALE_TIME } from '@/lib/constants';
import { toast } from 'sonner';

export function useUsers(filters?: {
  afdelingId?: string;
  rol?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*, departments(naam)')
        .order('naam');

      if (filters?.afdelingId) {
        query = query.eq('afdeling_id', filters.afdelingId);
      }
      if (filters?.rol) {
        query = query.eq('rol', filters.rol);
      }
      if (filters?.search) {
        query = query.or(
          `naam.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as User[];
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*, departments(naam)')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as User;
    },
    enabled: !!userId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UserUpdate;
    }) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Gebruiker bijgewerkt');
    },
    onError: () => {
      toast.error('Bijwerken mislukt');
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      naam,
      rol,
      afdelingId,
    }: {
      email: string;
      naam: string;
      rol: string;
      afdelingId: string | null;
    }) => {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, naam, rol, afdeling_id: afdelingId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Uitnodiging verstuurd');
    },
    onError: (error) => {
      toast.error(`Uitnodigen mislukt: ${error.message}`);
    },
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isActief,
    }: {
      id: string;
      isActief: boolean;
    }) => {
      const { data, error } = await supabase
        .from('users')
        .update({ is_actief: isActief })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(
        variables.isActief ? 'Gebruiker geactiveerd' : 'Gebruiker gedeactiveerd'
      );
    },
    onError: () => {
      toast.error('Actie mislukt');
    },
  });
}
