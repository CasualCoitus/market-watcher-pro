import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WatchlistItem } from '@/types/trading';
import { useToast } from '@/hooks/use-toast';

export function useWatchlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: watchlist, isLoading, error } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .order('symbol', { ascending: true });
      
      if (error) throw error;
      return data as WatchlistItem[];
    },
  });

  const addSymbol = useMutation({
    mutationFn: async (symbol: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          symbol: symbol.toUpperCase(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast({
        title: 'Symbol added',
        description: 'Symbol has been added to your watchlist.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeSymbol = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast({
        title: 'Symbol removed',
        description: 'Symbol has been removed from your watchlist.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateSymbol = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WatchlistItem> }) => {
      const { data, error } = await supabase
        .from('watchlist')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    watchlist: watchlist || [],
    isLoading,
    error,
    addSymbol,
    removeSymbol,
    updateSymbol,
  };
}
