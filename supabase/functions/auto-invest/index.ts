import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradingSettings {
  user_id: string;
  auto_trade_enabled: boolean;
  max_daily_trades: number;
  max_daily_loss: number;
  max_position_size: number;
  trading_hours_start: string;
  trading_hours_end: string;
}

interface Position {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  avg_cost: number;
  current_price: number | null;
  unrealized_pnl: number | null;
  trailing_stop_price: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  is_open: boolean;
}

interface Signal {
  id: string;
  user_id: string;
  symbol: string;
  signal_type: string;
  price_at_signal: number;
  executed: boolean;
  signal_rule_id: string | null;
}

interface SignalRule {
  id: string;
  user_id: string;
  option_strategy: string;
  trailing_stop_percent: number | null;
  stop_loss_percent: number | null;
  take_profit_percent: number | null;
  position_size_percent: number;
  max_position_value: number;
}

// Check if current time is within trading hours
function isWithinTradingHours(start: string, end: string): boolean {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/New_York' });
  return currentTime >= start && currentTime <= end;
}

// Calculate position size based on settings and rules
function calculatePositionSize(
  settings: TradingSettings,
  rule: SignalRule,
  currentPrice: number,
  accountValue: number = 100000 // Default mock account value
): number {
  const maxFromSettings = settings.max_position_size;
  const maxFromRule = rule.max_position_value;
  const percentageSize = (accountValue * rule.position_size_percent) / 100;
  
  const maxValue = Math.min(maxFromSettings, maxFromRule, percentageSize);
  return Math.floor(maxValue / currentPrice);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();
    console.log(`Auto-invest action: ${action}`);

    switch (action) {
      case 'update-trailing-stops': {
        // Get all open positions with trailing stops
        const { data: positions, error: posError } = await supabase
          .from('positions')
          .select('*, orders!inner(trailing_stop_percent)')
          .eq('is_open', true)
          .not('orders.trailing_stop_percent', 'is', null);

        if (posError) throw posError;
        if (!positions || positions.length === 0) {
          return new Response(
            JSON.stringify({ message: 'No positions with trailing stops' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updates = [];
        for (const position of positions) {
          // Get mock current price (in production, fetch from IBKR)
          const currentPrice = position.avg_cost * (1 + (Math.random() - 0.5) * 0.1);
          const trailingPercent = position.orders?.trailing_stop_percent || 5;
          
          // Calculate new trailing stop price
          const newTrailingStop = currentPrice * (1 - trailingPercent / 100);
          
          // Only update if new stop is higher than current (for long positions)
          if (!position.trailing_stop_price || newTrailingStop > position.trailing_stop_price) {
            const { error: updateError } = await supabase
              .from('positions')
              .update({
                current_price: currentPrice,
                unrealized_pnl: (currentPrice - position.avg_cost) * position.quantity,
                trailing_stop_price: newTrailingStop,
              })
              .eq('id', position.id);

            if (!updateError) {
              updates.push({
                symbol: position.symbol,
                oldStop: position.trailing_stop_price,
                newStop: newTrailingStop,
                currentPrice,
              });
              console.log(`Updated trailing stop for ${position.symbol}: ${newTrailingStop.toFixed(2)}`);
            }
          }

          // Check if stop loss or take profit hit
          if (position.stop_loss_price && currentPrice <= position.stop_loss_price) {
            console.log(`STOP LOSS HIT for ${position.symbol} at ${currentPrice}`);
            // Would close position here
          }
          if (position.take_profit_price && currentPrice >= position.take_profit_price) {
            console.log(`TAKE PROFIT HIT for ${position.symbol} at ${currentPrice}`);
            // Would close position here
          }
          if (position.trailing_stop_price && currentPrice <= position.trailing_stop_price) {
            console.log(`TRAILING STOP HIT for ${position.symbol} at ${currentPrice}`);
            // Would close position here
          }
        }

        return new Response(
          JSON.stringify({ 
            message: 'Trailing stops updated',
            updates,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'execute-pending-signals': {
        // Get all users with auto-trade enabled
        const { data: allSettings, error: settingsError } = await supabase
          .from('trading_settings')
          .select('*')
          .eq('auto_trade_enabled', true);

        if (settingsError) throw settingsError;
        if (!allSettings || allSettings.length === 0) {
          return new Response(
            JSON.stringify({ message: 'No users with auto-trade enabled' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const executed = [];
        const skipped = [];

        for (const settings of allSettings) {
          // Check trading hours
          if (!isWithinTradingHours(settings.trading_hours_start, settings.trading_hours_end)) {
            skipped.push({ user_id: settings.user_id, reason: 'Outside trading hours' });
            continue;
          }

          // Count today's trades
          const today = new Date().toISOString().split('T')[0];
          const { count: todaysTrades } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', settings.user_id)
            .gte('created_at', `${today}T00:00:00Z`);

          if ((todaysTrades || 0) >= settings.max_daily_trades) {
            skipped.push({ user_id: settings.user_id, reason: 'Max daily trades reached' });
            continue;
          }

          // Calculate today's P&L
          const { data: todaysOrders } = await supabase
            .from('orders')
            .select('filled_price, quantity, side')
            .eq('user_id', settings.user_id)
            .eq('status', 'filled')
            .gte('created_at', `${today}T00:00:00Z`);

          // Simple P&L calculation (in production, use actual prices)
          let dailyPnL = 0;
          for (const order of todaysOrders || []) {
            if (order.filled_price && order.quantity) {
              dailyPnL += order.side === 'buy' ? -order.filled_price * order.quantity : order.filled_price * order.quantity;
            }
          }

          if (dailyPnL <= -settings.max_daily_loss) {
            skipped.push({ user_id: settings.user_id, reason: 'Max daily loss reached' });
            continue;
          }

          // Get unexecuted signals with rules
          const { data: signals } = await supabase
            .from('signals')
            .select('*, signal_rules!inner(*)')
            .eq('user_id', settings.user_id)
            .eq('executed', false)
            .not('signal_rule_id', 'is', null);

          if (!signals || signals.length === 0) continue;

          for (const signal of signals) {
            const rule = signal.signal_rules as unknown as SignalRule;
            
            // Calculate position size
            const quantity = calculatePositionSize(settings, rule, signal.price_at_signal);
            
            if (quantity <= 0) {
              skipped.push({ signal_id: signal.id, reason: 'Position size too small' });
              continue;
            }

            // Determine order side based on signal type
            const side = ['bb_breakout_up', 'bb_mean_reversion_up', 'vwap_cross_up'].includes(signal.signal_type)
              ? 'buy' : 'sell';

            // Calculate stop/take profit prices
            const stopLossPrice = rule.stop_loss_percent
              ? signal.price_at_signal * (1 - (side === 'buy' ? 1 : -1) * rule.stop_loss_percent / 100)
              : null;
            const takeProfitPrice = rule.take_profit_percent
              ? signal.price_at_signal * (1 + (side === 'buy' ? 1 : -1) * rule.take_profit_percent / 100)
              : null;

            // Create order
            const ibkrOrderId = `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const { data: order, error: orderError } = await supabase
              .from('orders')
              .insert({
                user_id: settings.user_id,
                signal_id: signal.id,
                ibkr_order_id: ibkrOrderId,
                symbol: signal.symbol,
                side,
                quantity,
                limit_price: signal.price_at_signal,
                status: 'submitted',
                strategy: rule.option_strategy,
                trailing_stop_percent: rule.trailing_stop_percent,
                stop_loss_price: stopLossPrice,
                take_profit_price: takeProfitPrice,
              })
              .select()
              .single();

            if (orderError) {
              console.error('Order creation error:', orderError);
              continue;
            }

            // Mark signal as executed
            await supabase
              .from('signals')
              .update({ executed: true })
              .eq('id', signal.id);

            // Create position record
            await supabase
              .from('positions')
              .insert({
                user_id: settings.user_id,
                order_id: order.id,
                symbol: signal.symbol,
                quantity: side === 'buy' ? quantity : -quantity,
                avg_cost: signal.price_at_signal,
                current_price: signal.price_at_signal,
                trailing_stop_price: rule.trailing_stop_percent
                  ? signal.price_at_signal * (1 - rule.trailing_stop_percent / 100)
                  : null,
                stop_loss_price: stopLossPrice,
                take_profit_price: takeProfitPrice,
                is_open: true,
              });

            executed.push({
              symbol: signal.symbol,
              side,
              quantity,
              price: signal.price_at_signal,
              orderId: order.id,
            });

            console.log(`Auto-executed: ${side} ${quantity} ${signal.symbol} @ ${signal.price_at_signal}`);
          }
        }

        return new Response(
          JSON.stringify({
            message: 'Signal execution complete',
            executed,
            skipped,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check-risk-limits': {
        // Get all users with auto-trade enabled
        const { data: allSettings } = await supabase
          .from('trading_settings')
          .select('*')
          .eq('auto_trade_enabled', true);

        if (!allSettings) {
          return new Response(
            JSON.stringify({ message: 'No users to check' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const riskStatus = [];

        for (const settings of allSettings) {
          const today = new Date().toISOString().split('T')[0];
          
          // Count trades
          const { count: tradesCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', settings.user_id)
            .gte('created_at', `${today}T00:00:00Z`);

          // Get open positions value
          const { data: openPositions } = await supabase
            .from('positions')
            .select('current_price, quantity')
            .eq('user_id', settings.user_id)
            .eq('is_open', true);

          let totalPositionValue = 0;
          for (const pos of openPositions || []) {
            totalPositionValue += Math.abs((pos.current_price || 0) * pos.quantity);
          }

          riskStatus.push({
            user_id: settings.user_id,
            trades_today: tradesCount || 0,
            max_trades: settings.max_daily_trades,
            position_value: totalPositionValue,
            max_position: settings.max_position_size,
            within_limits: (tradesCount || 0) < settings.max_daily_trades && 
                          totalPositionValue < settings.max_position_size,
          });
        }

        return new Response(
          JSON.stringify({ riskStatus }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: update-trailing-stops, execute-pending-signals, check-risk-limits' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Auto-invest Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
