import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Signal } from '@/types/trading';

export function useSignals() {
  const { data: signals, isLoading, error, refetch } = useQuery({
    queryKey: ['signals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as Signal[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  return {
    signals: signals || [],
    isLoading,
    error,
    refetch,
  };
}
