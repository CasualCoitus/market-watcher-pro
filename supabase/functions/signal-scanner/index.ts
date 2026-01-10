import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calculate Bollinger Bands
function calculateBB(prices: number[], period: number = 20, stdDev: number = 2) {
  if (prices.length < period) return null;
  
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: mean + (std * stdDev),
    middle: mean,
    lower: mean - (std * stdDev),
  };
}

// Calculate VWAP
function calculateVWAP(bars: { close: number; high: number; low: number; volume: number }[]) {
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (const bar of bars) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    cumulativeTPV += typicalPrice * bar.volume;
    cumulativeVolume += bar.volume;
  }
  
  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting signal scanner...');

    // Get all users with auto-trade enabled
    const { data: settings } = await supabase
      .from('trading_settings')
      .select('user_id')
      .eq('auto_trade_enabled', true);

    if (!settings || settings.length === 0) {
      console.log('No users with auto-trade enabled');
      return new Response(
        JSON.stringify({ message: 'No active traders' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userIds = settings.map(s => s.user_id);

    // Get all enabled watchlist items for these users
    const { data: watchlistItems } = await supabase
      .from('watchlist')
      .select('*')
      .in('user_id', userIds)
      .eq('enabled', true);

    if (!watchlistItems || watchlistItems.length === 0) {
      console.log('No enabled watchlist items');
      return new Response(
        JSON.stringify({ message: 'No watchlist items' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get signal rules for these users
    const { data: signalRules } = await supabase
      .from('signal_rules')
      .select('*')
      .in('user_id', userIds)
      .eq('enabled', true);

    const signalsGenerated = [];

    // Process each watchlist item
    for (const item of watchlistItems) {
      // In production, fetch real market data from IBKR
      // For now, generate mock data
      const mockBars = [];
      const now = Date.now();
      const basePrice = 150 + Math.random() * 50;
      
      for (let i = 100; i >= 0; i--) {
        const price = basePrice + Math.sin(i / 10) * 5 + (Math.random() - 0.5) * 2;
        mockBars.push({
          timestamp: now - i * 60000,
          open: price + (Math.random() - 0.5),
          high: price + Math.random() * 2,
          low: price - Math.random() * 2,
          close: price + (Math.random() - 0.5),
          volume: Math.floor(Math.random() * 1000000),
        });
      }

      const prices = mockBars.map(b => b.close);
      const currentPrice = prices[prices.length - 1];
      const previousPrice = prices[prices.length - 2];

      // Calculate indicators
      const bb = calculateBB(prices, item.bb_period, item.bb_std_dev);
      const vwap = item.vwap_enabled ? calculateVWAP(mockBars) : null;

      if (!bb) continue;

      // Detect signals
      const detectedSignals: string[] = [];

      // BB Breakout Up
      if (previousPrice <= bb.upper && currentPrice > bb.upper) {
        detectedSignals.push('bb_breakout_up');
      }
      // BB Breakout Down
      if (previousPrice >= bb.lower && currentPrice < bb.lower) {
        detectedSignals.push('bb_breakout_down');
      }
      // BB Mean Reversion Up
      if (previousPrice < bb.lower && currentPrice > bb.lower) {
        detectedSignals.push('bb_mean_reversion_up');
      }
      // BB Mean Reversion Down
      if (previousPrice > bb.upper && currentPrice < bb.upper) {
        detectedSignals.push('bb_mean_reversion_down');
      }

      if (vwap) {
        // VWAP Cross Up
        if (previousPrice <= vwap && currentPrice > vwap) {
          detectedSignals.push('vwap_cross_up');
        }
        // VWAP Cross Down
        if (previousPrice >= vwap && currentPrice < vwap) {
          detectedSignals.push('vwap_cross_down');
        }
      }

      // Create signal records and match with rules
      for (const signalType of detectedSignals) {
        // Find matching rules for this user and signal type
        const matchingRules = signalRules?.filter(
          r => r.user_id === item.user_id && r.signal_type === signalType
        );

        for (const rule of matchingRules || []) {
          // Create signal
          const { data: signal, error: signalError } = await supabase
            .from('signals')
            .insert({
              user_id: item.user_id,
              watchlist_id: item.id,
              signal_rule_id: rule.id,
              symbol: item.symbol,
              signal_type: signalType,
              price_at_signal: currentPrice,
              bb_upper: bb.upper,
              bb_lower: bb.lower,
              bb_middle: bb.middle,
              vwap: vwap,
              volume: mockBars[mockBars.length - 1].volume,
            })
            .select()
            .single();

          if (signalError) {
            console.error('Error creating signal:', signalError);
            continue;
          }

          signalsGenerated.push(signal);
          console.log(`Signal generated: ${signalType} for ${item.symbol}`);

          // Auto-execute if enabled
          // This would call the ibkr-orders function
          // For now, just log
          console.log(`Would execute: ${rule.option_strategy} for ${item.symbol}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Scan complete',
        signalsGenerated: signalsGenerated.length,
        signals: signalsGenerated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Signal Scanner Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
