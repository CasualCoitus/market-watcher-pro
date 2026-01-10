import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IBKRSession } from '@/types/trading';
import { useToast } from '@/hooks/use-toast';

export function useIBKR() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['ibkrSession'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('ibkr_sessions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as IBKRSession | null;
    },
    refetchInterval: 30000, // Check session status every 30 seconds
  });

  const authenticate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ibkr-auth', {
        body: { action: 'authenticate' },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ibkrSession'] });
      if (data.authUrl) {
        // Open IBKR authentication in new window
        window.open(data.authUrl, 'ibkr-auth', 'width=800,height=600');
      }
      toast({
        title: 'Authentication started',
        description: 'Please complete authentication in the popup window.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Authentication failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('ibkr-auth', {
        body: { action: 'logout' },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ibkrSession'] });
      toast({
        title: 'Logged out',
        description: 'Disconnected from Interactive Brokers.',
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

  const checkSession = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ibkr-auth', {
        body: { action: 'check-session' },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ibkrSession'] });
    },
  });

  return {
    session,
    isLoading,
    error,
    isAuthenticated: session?.is_authenticated ?? false,
    accountId: session?.account_id,
    authenticate,
    logout,
    checkSession,
  };
}
