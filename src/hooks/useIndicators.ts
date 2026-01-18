import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserIndicator {
  id: string;
  user_id: string;
  indicator_type: string;
  enabled: boolean;
  parameters: Record<string, any>;
  signal_conditions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface IndicatorSignal {
  id: string;
  user_id: string;
  user_indicator_id: string;
  symbol: string;
  signal_type: string;
  indicator_value: number | null;
  price_at_signal: number;
  triggered_at: string;
  executed: boolean;
  metadata: Record<string, any>;
}

export function useIndicators() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: indicators, isLoading, error } = useQuery({
    queryKey: ['userIndicators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_indicators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserIndicator[];
    },
  });

  const addIndicator = useMutation({
    mutationFn: async (indicator: {
      indicator_type: string;
      enabled?: boolean;
      parameters?: Record<string, any>;
      signal_conditions?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_indicators')
        .insert({
          user_id: user.id,
          ...indicator,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userIndicators'] });
      toast({
        title: 'Indicator added',
        description: 'Technical indicator has been added to your strategy.',
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

  const updateIndicator = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UserIndicator> }) => {
      const { data, error } = await supabase
        .from('user_indicators')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userIndicators'] });
      toast({
        title: 'Indicator updated',
        description: 'Technical indicator has been updated.',
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

  const deleteIndicator = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_indicators')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userIndicators'] });
      toast({
        title: 'Indicator removed',
        description: 'Technical indicator has been removed.',
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

  const { data: signals } = useQuery({
    queryKey: ['indicatorSignals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('indicator_signals')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as IndicatorSignal[];
    },
    refetchInterval: 5000,
  });

  return {
    indicators: indicators || [],
    signals: signals || [],
    isLoading,
    error,
    addIndicator,
    updateIndicator,
    deleteIndicator,
  };
}
