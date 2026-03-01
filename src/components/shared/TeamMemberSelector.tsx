import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QUERY_STALE_TIME } from '@/lib/constants';

interface TeamMemberSelectorProps {
  departmentId: string;
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
  maxSelections?: number;
}

export function TeamMemberSelector({
  departmentId,
  selectedUserIds,
  onChange,
  maxSelections,
}: TeamMemberSelectorProps) {
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['department-users', departmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('afdeling_id', departmentId)
        .eq('is_actief', true)
        .order('naam');

      if (error) throw error;
      return data as User[];
    },
    staleTime: QUERY_STALE_TIME,
    enabled: !!departmentId,
  });

  const availableMembers = teamMembers.filter(
    (m) => !selectedUserIds.includes(m.id)
  );

  const selectedMembers = teamMembers.filter((m) =>
    selectedUserIds.includes(m.id)
  );

  const handleAdd = (userId: string) => {
    if (maxSelections && selectedUserIds.length >= maxSelections) return;
    onChange([...selectedUserIds, userId]);
  };

  const handleRemove = (userId: string) => {
    onChange(selectedUserIds.filter((id) => id !== userId));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedMembers.map((member) => (
          <Badge
            key={member.id}
            variant="secondary"
            className="flex items-center gap-1.5 py-1 pl-1 pr-2"
          >
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px] bg-sky-100 text-sky-700">
                {getInitials(member.naam)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs">{member.naam}</span>
            <button
              type="button"
              onClick={() => handleRemove(member.id)}
              className="ml-1 rounded-full p-0.5 hover:bg-slate-300 transition-colors"
              aria-label={`Verwijder ${member.naam}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {availableMembers.length > 0 && (
        <Select onValueChange={handleAdd}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="+ Teamlid toevoegen" />
          </SelectTrigger>
          <SelectContent>
            {availableMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.naam}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
