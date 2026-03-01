import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Department, DepartmentInsert, DepartmentUpdate } from '@/types/database';
import { QUERY_STALE_TIME } from '@/lib/constants';
import { toast } from 'sonner';

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*, manager:users!departments_manager_id_fkey(id, naam, email)')
        .order('naam');

      if (error) throw error;
      return data as (Department & { manager: { id: string; naam: string; email: string } | null })[];
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useDepartment(departmentId: string | undefined) {
  return useQuery({
    queryKey: ['department', departmentId],
    queryFn: async () => {
      if (!departmentId) return null;
      const { data, error } = await supabase
        .from('departments')
        .select('*, manager:users!departments_manager_id_fkey(id, naam, email)')
        .eq('id', departmentId)
        .single();

      if (error) throw error;
      return data as Department;
    },
    enabled: !!departmentId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DepartmentInsert) => {
      const { data, error } = await supabase
        .from('departments')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Afdeling aangemaakt');
    },
    onError: () => {
      toast.error('Aanmaken mislukt');
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: DepartmentUpdate;
    }) => {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Afdeling bijgewerkt');
    },
    onError: () => {
      toast.error('Bijwerken mislukt');
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Afdeling verwijderd');
    },
    onError: () => {
      toast.error('Verwijderen mislukt');
    },
  });
}
