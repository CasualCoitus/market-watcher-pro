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

// Validate action input
function validateAction(action: unknown): action is 'authenticate' | 'logout' | 'check-session' | 'callback' {
  return typeof action === 'string' && 
    ['authenticate', 'logout', 'check-session', 'callback'].includes(action);
}

interface AuthRequest {
  action: 'authenticate' | 'logout' | 'check-session' | 'callback';
  code?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
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

    const body = await req.json();
    
    // Validate action
    if (!validateAction(body.action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be one of: authenticate, logout, check-session, callback' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { action, code }: AuthRequest = body;
    console.log(`IBKR Auth action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'authenticate': {
        // IBKR Client Portal API authentication flow
        const baseUrl = Deno.env.get('IBKR_BASE_URL') || 'https://localhost:5000';
        const authUrl = `${baseUrl}/v1/api/iserver/auth/status`;
        
        // Check if there's an existing session
        const { data: session } = await supabase
          .from('ibkr_sessions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!session) {
          // Create a new session record
          await supabase
            .from('ibkr_sessions')
            .insert({
              user_id: user.id,
              is_authenticated: false,
            });
        }

        return new Response(
          JSON.stringify({
            message: 'Please authenticate with IBKR Client Portal',
            instructions: [
              '1. Start IB Gateway or TWS on your machine',
              '2. Enable API access in settings',
              '3. The Client Portal API runs on localhost:5000',
              '4. Authenticate through the IBKR web interface',
            ],
            authUrl,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check-session': {
        // Check session status with IBKR
        const { data: session } = await supabase
          .from('ibkr_sessions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!session) {
          return new Response(
            JSON.stringify({ authenticated: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({
            authenticated: session.is_authenticated,
            accountId: session.account_id,
            lastAuthenticated: session.last_authenticated,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'callback': {
        // Handle OAuth callback from IBKR
        if (!code || typeof code !== 'string' || code.length > 1000) {
          return new Response(
            JSON.stringify({ error: 'Invalid authorization code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        await supabase
          .from('ibkr_sessions')
          .upsert({
            user_id: user.id,
            session_token: code,
            is_authenticated: true,
            last_authenticated: new Date().toISOString(),
            account_id: 'DEMO_ACCOUNT', // Would come from IBKR
          }, {
            onConflict: 'user_id',
          });

        return new Response(
          JSON.stringify({ success: true, message: 'Successfully authenticated with IBKR' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'logout': {
        await supabase
          .from('ibkr_sessions')
          .update({
            session_token: null,
            is_authenticated: false,
          })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true, message: 'Logged out from IBKR' }),
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
    console.error('IBKR Auth Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
