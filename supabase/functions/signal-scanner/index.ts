import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Secure CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  Deno.env.get('FRONTEND_URL') || '',
].filter(Boolean);

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0] || 'http://localhost:3000',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

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
  const corsHeaders = getCorsHeaders(req);
  
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
      // Validate symbol format
      if (!/^[A-Z]{1,5}$/.test(item.symbol)) {
        console.log(`Skipping invalid symbol: ${item.symbol}`);
        continue;
      }

      // Validate BB parameters
      const bbPeriod = Math.max(5, Math.min(100, item.bb_period || 20));
      const bbStdDev = Math.max(0.5, Math.min(5, item.bb_std_dev || 2));

      // Generate mock market data
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
      const bb = calculateBB(prices, bbPeriod, bbStdDev);
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
          // Validate rule parameters
          const positionSizePercent = Math.max(0.1, Math.min(100, rule.position_size_percent || 5));
          const maxPositionValue = Math.max(100, Math.min(1000000, rule.max_position_value || 10000));
          const stopLossPercent = rule.stop_loss_percent ? Math.max(0.1, Math.min(50, rule.stop_loss_percent)) : null;
          const takeProfitPercent = rule.take_profit_percent ? Math.max(0.1, Math.min(100, rule.take_profit_percent)) : null;

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

          // Get user's trading settings for risk checks
          const { data: userSettings } = await supabase
            .from('trading_settings')
            .select('*')
            .eq('user_id', item.user_id)
            .single();

          if (userSettings?.auto_trade_enabled) {
            // Calculate order parameters
            const side = ['bb_breakout_up', 'bb_mean_reversion_up', 'vwap_cross_up'].includes(signalType)
              ? 'buy' : 'sell';
            
            const accountValue = 100000; // Mock - would come from broker
            const maxPositionSize = Math.min(
              userSettings.max_position_size || 10000,
              maxPositionValue,
              (accountValue * positionSizePercent) / 100
            );
            const quantity = Math.floor(maxPositionSize / currentPrice);
            
            if (quantity > 0 && quantity <= 1000000) {
              // Calculate stop prices with validated percentages
              const stopLossPrice = stopLossPercent
                ? currentPrice * (1 - (side === 'buy' ? 1 : -1) * stopLossPercent / 100)
                : null;
              const takeProfitPrice = takeProfitPercent
                ? currentPrice * (1 + (side === 'buy' ? 1 : -1) * takeProfitPercent / 100)
                : null;

              // Create order
              const ibkrOrderId = `SCAN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              
              const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                  user_id: item.user_id,
                  signal_id: signal.id,
                  ibkr_order_id: ibkrOrderId,
                  symbol: item.symbol,
                  side,
                  quantity,
                  limit_price: currentPrice,
                  status: 'submitted',
                  strategy: rule.option_strategy,
                  trailing_stop_percent: rule.trailing_stop_percent,
                  stop_loss_price: stopLossPrice,
                  take_profit_price: takeProfitPrice,
                  broker: userSettings.preferred_broker || 'ibkr',
                })
                .select()
                .single();

              if (!orderError && order) {
                // Mark signal as executed
                await supabase
                  .from('signals')
                  .update({ executed: true })
                  .eq('id', signal.id);

                // Create position
                await supabase
                  .from('positions')
                  .insert({
                    user_id: item.user_id,
                    order_id: order.id,
                    symbol: item.symbol,
                    quantity: side === 'buy' ? quantity : -quantity,
                    avg_cost: currentPrice,
                    current_price: currentPrice,
                    trailing_stop_price: rule.trailing_stop_percent
                      ? currentPrice * (1 - rule.trailing_stop_percent / 100)
                      : null,
                    stop_loss_price: stopLossPrice,
                    take_profit_price: takeProfitPrice,
                    is_open: true,
                    broker: userSettings.preferred_broker || 'ibkr',
                  });

                console.log(`Auto-executed: ${side} ${quantity} ${item.symbol} @ ${currentPrice.toFixed(2)}`);
              }
            }
          } else {
            console.log(`Signal ready for manual execution: ${rule.option_strategy} for ${item.symbol}`);
          }
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
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
