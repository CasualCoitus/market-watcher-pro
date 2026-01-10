-- Create enum types for the trading system
CREATE TYPE public.signal_type AS ENUM ('bb_breakout_up', 'bb_breakout_down', 'bb_mean_reversion_up', 'bb_mean_reversion_down', 'vwap_cross_up', 'vwap_cross_down', 'custom');
CREATE TYPE public.order_side AS ENUM ('buy', 'sell');
CREATE TYPE public.order_status AS ENUM ('pending', 'submitted', 'filled', 'partial', 'cancelled', 'rejected');
CREATE TYPE public.option_type AS ENUM ('call', 'put');
CREATE TYPE public.option_strategy AS ENUM ('buy_call', 'buy_put', 'sell_call', 'sell_put', 'bull_call_spread', 'bear_put_spread', 'iron_condor', 'straddle', 'strangle');

-- Watchlist table for tickers to monitor
CREATE TABLE public.watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    bb_period INTEGER DEFAULT 20,
    bb_std_dev DECIMAL(3,2) DEFAULT 2.0,
    vwap_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, symbol)
);

-- Signal rules configuration
CREATE TABLE public.signal_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    signal_type signal_type NOT NULL,
    enabled BOOLEAN DEFAULT true,
    option_strategy option_strategy NOT NULL,
    strike_offset_percent DECIMAL(5,2) DEFAULT 0, -- % from current price
    expiry_days INTEGER DEFAULT 30, -- DTE target
    position_size_percent DECIMAL(5,2) DEFAULT 5, -- % of account
    max_position_value DECIMAL(12,2) DEFAULT 10000,
    trailing_stop_percent DECIMAL(5,2), -- null means no trailing stop
    stop_loss_percent DECIMAL(5,2),
    take_profit_percent DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Generated signals history
CREATE TABLE public.signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    watchlist_id UUID REFERENCES public.watchlist(id) ON DELETE CASCADE,
    signal_rule_id UUID REFERENCES public.signal_rules(id) ON DELETE SET NULL,
    symbol VARCHAR(10) NOT NULL,
    signal_type signal_type NOT NULL,
    price_at_signal DECIMAL(12,4) NOT NULL,
    bb_upper DECIMAL(12,4),
    bb_lower DECIMAL(12,4),
    bb_middle DECIMAL(12,4),
    vwap DECIMAL(12,4),
    volume BIGINT,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    executed BOOLEAN DEFAULT false
);

-- Orders placed through IBKR
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    signal_id UUID REFERENCES public.signals(id) ON DELETE SET NULL,
    ibkr_order_id VARCHAR(50),
    symbol VARCHAR(10) NOT NULL,
    option_type option_type,
    strike DECIMAL(12,2),
    expiry DATE,
    side order_side NOT NULL,
    quantity INTEGER NOT NULL,
    limit_price DECIMAL(12,4),
    filled_price DECIMAL(12,4),
    status order_status DEFAULT 'pending',
    strategy option_strategy,
    trailing_stop_percent DECIMAL(5,2),
    stop_loss_price DECIMAL(12,4),
    take_profit_price DECIMAL(12,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    filled_at TIMESTAMP WITH TIME ZONE
);

-- Active positions tracking
CREATE TABLE public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    symbol VARCHAR(10) NOT NULL,
    option_type option_type,
    strike DECIMAL(12,2),
    expiry DATE,
    quantity INTEGER NOT NULL,
    avg_cost DECIMAL(12,4) NOT NULL,
    current_price DECIMAL(12,4),
    unrealized_pnl DECIMAL(12,4),
    trailing_stop_price DECIMAL(12,4),
    stop_loss_price DECIMAL(12,4),
    take_profit_price DECIMAL(12,4),
    is_open BOOLEAN DEFAULT true,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- IBKR session management
CREATE TABLE public.ibkr_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    session_token TEXT,
    is_authenticated BOOLEAN DEFAULT false,
    last_authenticated TIMESTAMP WITH TIME ZONE,
    account_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trading settings per user
CREATE TABLE public.trading_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    auto_trade_enabled BOOLEAN DEFAULT false,
    max_daily_trades INTEGER DEFAULT 10,
    max_daily_loss DECIMAL(12,2) DEFAULT 1000,
    max_position_size DECIMAL(12,2) DEFAULT 10000,
    trading_hours_start TIME DEFAULT '09:30:00',
    trading_hours_end TIME DEFAULT '16:00:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ibkr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for watchlist
CREATE POLICY "Users can view their own watchlist" ON public.watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert to their own watchlist" ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own watchlist" ON public.watchlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from their own watchlist" ON public.watchlist FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for signal_rules
CREATE POLICY "Users can view their own signal rules" ON public.signal_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own signal rules" ON public.signal_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own signal rules" ON public.signal_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own signal rules" ON public.signal_rules FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for signals
CREATE POLICY "Users can view their own signals" ON public.signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own signals" ON public.signals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own signals" ON public.signals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own signals" ON public.signals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own orders" ON public.orders FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for positions
CREATE POLICY "Users can view their own positions" ON public.positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own positions" ON public.positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own positions" ON public.positions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own positions" ON public.positions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ibkr_sessions
CREATE POLICY "Users can view their own IBKR session" ON public.ibkr_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own IBKR session" ON public.ibkr_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own IBKR session" ON public.ibkr_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own IBKR session" ON public.ibkr_sessions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for trading_settings
CREATE POLICY "Users can view their own trading settings" ON public.trading_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trading settings" ON public.trading_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trading settings" ON public.trading_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trading settings" ON public.trading_settings FOR DELETE USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_watchlist_updated_at BEFORE UPDATE ON public.watchlist FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_signal_rules_updated_at BEFORE UPDATE ON public.signal_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ibkr_sessions_updated_at BEFORE UPDATE ON public.ibkr_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trading_settings_updated_at BEFORE UPDATE ON public.trading_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();