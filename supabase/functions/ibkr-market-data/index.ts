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

// Input validation
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

function validateSymbols(symbols: unknown): { valid: boolean; value?: string[]; error?: string } {
  if (!Array.isArray(symbols)) {
    return { valid: false, error: 'Symbols must be an array' };
  }
  if (symbols.length === 0 || symbols.length > 100) {
    return { valid: false, error: 'Must provide 1-100 symbols' };
  }
  
  const validated: string[] = [];
  for (const s of symbols) {
    const result = validateSymbol(s);
    if (!result.valid) return { valid: false, error: result.error };
    validated.push(result.value!);
  }
  return { valid: true, value: validated };
}

interface MarketDataRequest {
  action: 'get-quote' | 'get-bars' | 'get-options-chain';
  symbols?: string[];
  symbol?: string;
  period?: string;
  bar?: string;
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

    const body = await req.json();
    
    // Validate action
    const validActions = ['get-quote', 'get-bars', 'get-options-chain'] as const;
    if (!validActions.includes(body.action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { action, symbols, symbol }: MarketDataRequest = body;
    console.log(`Market Data action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'get-quote': {
        const symbolsResult = validateSymbols(symbols);
        if (!symbolsResult.valid) {
          return new Response(
            JSON.stringify({ error: symbolsResult.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Mock response for development
        const quotes = symbolsResult.value!.map(sym => ({
          symbol: sym,
          price: 150 + Math.random() * 50,
          open: 148 + Math.random() * 50,
          high: 155 + Math.random() * 50,
          low: 145 + Math.random() * 50,
          close: 150 + Math.random() * 50,
          volume: Math.floor(Math.random() * 10000000),
          change: (Math.random() - 0.5) * 10,
          changePercent: (Math.random() - 0.5) * 5,
          timestamp: Date.now(),
        }));

        return new Response(
          JSON.stringify({ quotes }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-bars': {
        const symbolResult = validateSymbol(symbol);
        if (!symbolResult.valid) {
          return new Response(
            JSON.stringify({ error: symbolResult.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Mock historical bars for BB/VWAP calculation
        const bars = [];
        const now = Date.now();
        const barCount = 100;
        
        for (let i = barCount; i >= 0; i--) {
          const basePrice = 150 + Math.sin(i / 10) * 10;
          bars.push({
            timestamp: now - i * 60000,
            open: basePrice + (Math.random() - 0.5) * 2,
            high: basePrice + Math.random() * 3,
            low: basePrice - Math.random() * 3,
            close: basePrice + (Math.random() - 0.5) * 2,
            volume: Math.floor(Math.random() * 1000000),
          });
        }

        return new Response(
          JSON.stringify({ symbol: symbolResult.value, bars }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-options-chain': {
        const symbolResult = validateSymbol(symbol);
        if (!symbolResult.valid) {
          return new Response(
            JSON.stringify({ error: symbolResult.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Mock options chain
        const underlyingPrice = 150;
        const strikes = [];
        for (let i = -10; i <= 10; i++) {
          const strike = Math.round(underlyingPrice + i * 2.5);
          strikes.push({
            strike,
            callBid: Math.max(0, underlyingPrice - strike) + Math.random() * 2,
            callAsk: Math.max(0, underlyingPrice - strike) + Math.random() * 2 + 0.1,
            putBid: Math.max(0, strike - underlyingPrice) + Math.random() * 2,
            putAsk: Math.max(0, strike - underlyingPrice) + Math.random() * 2 + 0.1,
            callVolume: Math.floor(Math.random() * 1000),
            putVolume: Math.floor(Math.random() * 1000),
            callOI: Math.floor(Math.random() * 5000),
            putOI: Math.floor(Math.random() * 5000),
          });
        }

        const expirations = [
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ];

        return new Response(
          JSON.stringify({ symbol: symbolResult.value, underlyingPrice, expirations, strikes }),
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
    console.error('Market Data Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
