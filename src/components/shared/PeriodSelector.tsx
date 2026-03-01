import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Period } from '@/types/database';
import { QUERY_STALE_TIME } from '@/lib/constants';

interface PeriodSelectorProps {
  type: 'week' | 'maand' | 'kwartaal';
  value: string;
  onChange: (value: string) => void;
  showNavigation?: boolean;
}

export function PeriodSelector({
  type,
  value,
  onChange,
  showNavigation = true,
}: PeriodSelectorProps) {
  const { data: periods = [] } = useQuery({
    queryKey: ['periods', type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periods')
        .select('*')
        .eq('type', type)
        .eq('jaar', 2026)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as Period[];
    },
    staleTime: QUERY_STALE_TIME,
  });

  const currentIndex = periods.findIndex((p) => p.start_date === value || p.label === value);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prev = periods[currentIndex - 1];
      onChange(prev.start_date);
    }
  };

  const handleNext = () => {
    if (currentIndex < periods.length - 1) {
      const next = periods[currentIndex + 1];
      onChange(next.start_date);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {showNavigation && (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handlePrevious}
          disabled={currentIndex <= 0}
          aria-label="Vorige periode"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Selecteer periode" />
        </SelectTrigger>
        <SelectContent>
          {periods.map((period) => (
            <SelectItem key={period.id} value={period.start_date}>
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showNavigation && (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleNext}
          disabled={currentIndex >= periods.length - 1}
          aria-label="Volgende periode"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
