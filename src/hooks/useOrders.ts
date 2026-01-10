import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/trading';

export function useOrders() {
  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as Order[];
    },
    refetchInterval: 5000,
  });

  const pendingOrders = orders?.filter(o => 
    ['pending', 'submitted', 'partial'].includes(o.status)
  ) || [];

  const filledOrders = orders?.filter(o => o.status === 'filled') || [];

  return {
    orders: orders || [],
    pendingOrders,
    filledOrders,
    isLoading,
    error,
    refetch,
  };
}
