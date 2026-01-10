import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Position } from '@/types/trading';

export function usePositions() {
  const { data: positions, isLoading, error, refetch } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('is_open', true)
        .order('opened_at', { ascending: false });
      
      if (error) throw error;
      return data as Position[];
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: closedPositions } = useQuery({
    queryKey: ['closedPositions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('is_open', false)
        .order('closed_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Position[];
    },
  });

  return {
    positions: positions || [],
    closedPositions: closedPositions || [],
    isLoading,
    error,
    refetch,
  };
}
