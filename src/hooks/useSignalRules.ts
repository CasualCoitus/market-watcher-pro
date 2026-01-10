import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SignalRule, SignalType, OptionStrategy } from '@/types/trading';
import { useToast } from '@/hooks/use-toast';

export function useSignalRules() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: signalRules, isLoading, error } = useQuery({
    queryKey: ['signalRules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signal_rules')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as SignalRule[];
    },
  });

  const addRule = useMutation({
    mutationFn: async (rule: {
      name: string;
      signal_type: SignalType;
      option_strategy: OptionStrategy;
      strike_offset_percent?: number;
      expiry_days?: number;
      position_size_percent?: number;
      max_position_value?: number;
      trailing_stop_percent?: number | null;
      stop_loss_percent?: number | null;
      take_profit_percent?: number | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('signal_rules')
        .insert({
          user_id: user.id,
          ...rule,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalRules'] });
      toast({
        title: 'Rule created',
        description: 'Signal rule has been created.',
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

  const updateRule = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SignalRule> }) => {
      const { data, error } = await supabase
        .from('signal_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalRules'] });
      toast({
        title: 'Rule updated',
        description: 'Signal rule has been updated.',
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

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('signal_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalRules'] });
      toast({
        title: 'Rule deleted',
        description: 'Signal rule has been deleted.',
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

  return {
    signalRules: signalRules || [],
    isLoading,
    error,
    addRule,
    updateRule,
    deleteRule,
  };
}
