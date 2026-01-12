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

// Input validation functions
function validateSymbol(symbol: unknown): { valid: boolean; value?: string; error?: string } {
  if (typeof symbol !== 'string') {
    return { valid: false, error: 'Symbol must be a string' };
  }
  const trimmed = symbol.trim().toUpperCase();
  if (!/^[A-Z]{1,5}$/.test(trimmed)) {
    return { valid: false, error: 'Symbol must be 1-5 uppercase letters' };
  }
  return { valid: true, value: trimmed };
}

function validatePositiveNumber(value: unknown, field: string, max = 1000000): { valid: boolean; value?: number; error?: string } {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { valid: false, error: `${field} must be a valid number` };
  }
  if (value <= 0) {
    return { valid: false, error: `${field} must be positive` };
  }
  if (value > max) {
    return { valid: false, error: `${field} cannot exceed ${max}` };
  }
  return { valid: true, value };
}

function validatePositiveInteger(value: unknown, field: string, max = 1000000): { valid: boolean; value?: number; error?: string } {
  const numResult = validatePositiveNumber(value, field, max);
  if (!numResult.valid) return numResult;
  if (!Number.isInteger(numResult.value)) {
    return { valid: false, error: `${field} must be a whole number` };
  }
  return numResult;
}

function validateUUID(value: unknown, field: string): { valid: boolean; value?: string; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: `${field} must be a string` };
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    return { valid: false, error: `${field} must be a valid UUID` };
  }
  return { valid: true, value };
}

interface OrderRequest {
  action: 'place-order' | 'cancel-order' | 'get-orders' | 'modify-order';
  orderId?: string;
  order?: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    orderType?: 'market' | 'limit' | 'stop' | 'stop_limit';
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
  const corsHeaders = getCorsHeaders(req);
  
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

    const body = await req.json();
    
    // Validate action
    const validActions = ['place-order', 'cancel-order', 'get-orders', 'modify-order'] as const;
    if (!validActions.includes(body.action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { action, orderId, order }: OrderRequest = body;
    console.log(`Order action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'place-order': {
        if (!order) {
          return new Response(
            JSON.stringify({ error: 'No order provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate order fields
        const errors: string[] = [];
        
        const symbolResult = validateSymbol(order.symbol);
        if (!symbolResult.valid) errors.push(symbolResult.error!);
        
        if (order.side !== 'buy' && order.side !== 'sell') {
          errors.push('Side must be "buy" or "sell"');
        }
        
        const quantityResult = validatePositiveInteger(order.quantity, 'quantity');
        if (!quantityResult.valid) errors.push(quantityResult.error!);
        
        if (order.limitPrice !== undefined) {
          const priceResult = validatePositiveNumber(order.limitPrice, 'limitPrice');
          if (!priceResult.valid) errors.push(priceResult.error!);
        }
        
        if (order.stopPrice !== undefined) {
          const stopResult = validatePositiveNumber(order.stopPrice, 'stopPrice');
          if (!stopResult.valid) errors.push(stopResult.error!);
        }
        
        if (order.strike !== undefined) {
          const strikeResult = validatePositiveNumber(order.strike, 'strike', 100000);
          if (!strikeResult.valid) errors.push(strikeResult.error!);
        }
        
        if (order.trailingStopPercent !== undefined) {
          const trailingResult = validatePositiveNumber(order.trailingStopPercent, 'trailingStopPercent', 100);
          if (!trailingResult.valid) errors.push(trailingResult.error!);
        }
        
        if (errors.length > 0) {
          return new Response(
            JSON.stringify({ error: 'Validation failed', details: errors }),
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

        // Generate mock IBKR order ID
        const ibkrOrderId = `IBKR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create order record in database
        const { data: newOrder, error: insertError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            signal_id: order.signalId || null,
            ibkr_order_id: ibkrOrderId,
            symbol: symbolResult.value,
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
            broker: 'ibkr',
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

        console.log(`Order placed: ${ibkrOrderId} for ${order.quantity} ${symbolResult.value}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            order: newOrder,
            ibkrOrderId,
            message: `Order submitted: ${order.side} ${order.quantity} ${symbolResult.value}`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'cancel-order': {
        const orderIdResult = validateUUID(orderId, 'orderId');
        if (!orderIdResult.valid) {
          return new Response(
            JSON.stringify({ error: orderIdResult.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderIdResult.value)
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
        const orderIdResult = validateUUID(orderId, 'orderId');
        if (!orderIdResult.valid || !order) {
          return new Response(
            JSON.stringify({ error: 'Order ID and order details required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        await supabase
          .from('orders')
          .update({
            limit_price: order.limitPrice,
            trailing_stop_percent: order.trailingStopPercent,
            stop_loss_price: order.stopLossPrice,
            take_profit_price: order.takeProfitPrice,
          })
          .eq('id', orderIdResult.value)
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
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
