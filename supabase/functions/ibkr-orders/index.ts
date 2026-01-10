import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderRequest {
  action: 'place-order' | 'cancel-order' | 'get-orders' | 'modify-order';
  orderId?: string;
  order?: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    orderType: 'market' | 'limit' | 'stop' | 'stop_limit';
    limitPrice?: number;
    stopPrice?: number;
    optionType?: 'call' | 'put';
    strike?: number;
    expiry?: string;
    strategy?: string;
    trailingStopPercent?: number;
    stopLossPrice?: number;
    takeProfitPrice?: number;
    signalId?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid auth token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check IBKR session
    const { data: session } = await supabase
      .from('ibkr_sessions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!session?.is_authenticated) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated with IBKR' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check trading settings
    const { data: settings } = await supabase
      .from('trading_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { action, orderId, order }: OrderRequest = await req.json();
    console.log(`Order action: ${action} for user: ${user.id}`);

    const baseUrl = Deno.env.get('IBKR_BASE_URL') || 'https://localhost:5000';

    switch (action) {
      case 'place-order': {
        if (!order) {
          return new Response(
            JSON.stringify({ error: 'No order provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if auto-trade is enabled
        if (!settings?.auto_trade_enabled) {
          return new Response(
            JSON.stringify({ error: 'Auto-trading is not enabled' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // In production, you would call IBKR's order API
        // const response = await fetch(`${baseUrl}/v1/api/iserver/account/${accountId}/orders`, {
        //   method: 'POST',
        //   body: JSON.stringify(orderPayload),
        // });

        // Generate mock IBKR order ID
        const ibkrOrderId = `IBKR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create order record in database
        const { data: newOrder, error: insertError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            signal_id: order.signalId || null,
            ibkr_order_id: ibkrOrderId,
            symbol: order.symbol,
            option_type: order.optionType || null,
            strike: order.strike || null,
            expiry: order.expiry || null,
            side: order.side,
            quantity: order.quantity,
            limit_price: order.limitPrice || null,
            status: 'submitted',
            strategy: order.strategy || null,
            trailing_stop_percent: order.trailingStopPercent || null,
            stop_loss_price: order.stopLossPrice || null,
            take_profit_price: order.takeProfitPrice || null,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Update signal as executed
        if (order.signalId) {
          await supabase
            .from('signals')
            .update({ executed: true })
            .eq('id', order.signalId);
        }

        console.log(`Order placed: ${ibkrOrderId} for ${order.quantity} ${order.symbol}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            order: newOrder,
            ibkrOrderId,
            message: `Order submitted: ${order.side} ${order.quantity} ${order.symbol}`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'cancel-order': {
        if (!orderId) {
          return new Response(
            JSON.stringify({ error: 'No order ID provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // In production, call IBKR's cancel order API
        // await fetch(`${baseUrl}/v1/api/iserver/account/${accountId}/order/${orderId}`, {
        //   method: 'DELETE',
        // });

        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId)
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true, message: 'Order cancelled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-orders': {
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        return new Response(
          JSON.stringify({ orders }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'modify-order': {
        if (!orderId || !order) {
          return new Response(
            JSON.stringify({ error: 'Order ID and order details required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // In production, call IBKR's modify order API
        
        await supabase
          .from('orders')
          .update({
            limit_price: order.limitPrice,
            trailing_stop_percent: order.trailingStopPercent,
            stop_loss_price: order.stopLossPrice,
            take_profit_price: order.takeProfitPrice,
          })
          .eq('id', orderId)
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true, message: 'Order modified' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Order Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
