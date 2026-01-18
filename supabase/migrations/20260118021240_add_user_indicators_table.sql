/*
  # Add User Indicators Table

  1. New Tables
    - `user_indicators` table for storing user's selected technical indicators and their configuration
    - `indicator_signals` table for tracking generated signals from indicators
  
  2. Tables
    - `user_indicators`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `indicator_type` (text) - RSI, MACD, EMA, SMA, Stochastic, ATR, ADX, CCI, Williams %R, MFI
      - `enabled` (boolean) - whether this indicator is active
      - `parameters` (jsonb) - indicator-specific settings (periods, thresholds, etc.)
      - `signal_conditions` (jsonb) - buy/sell signal conditions
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `indicator_signals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `user_indicator_id` (uuid, foreign key to user_indicators)
      - `symbol` (text) - stock symbol
      - `signal_type` (text) - 'buy', 'sell', 'neutral'
      - `indicator_value` (numeric) - the calculated indicator value
      - `price_at_signal` (numeric) - current price when signal generated
      - `triggered_at` (timestamptz)
      - `executed` (boolean) - whether trade was executed
      - `metadata` (jsonb) - additional signal context

  3. Security
    - Enable RLS on both tables
    - Users can only view/manage their own indicators and signals
*/

CREATE TABLE IF NOT EXISTS public.user_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  indicator_type VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  parameters JSONB DEFAULT '{}'::jsonb,
  signal_conditions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.indicator_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_indicator_id UUID REFERENCES public.user_indicators(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  signal_type VARCHAR(20) NOT NULL,
  indicator_value DECIMAL(12,4),
  price_at_signal DECIMAL(12,4) NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  executed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_indicators_user_id ON public.user_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_user_indicators_enabled ON public.user_indicators(enabled);
CREATE INDEX IF NOT EXISTS idx_indicator_signals_user_id ON public.indicator_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_indicator_signals_symbol ON public.indicator_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_indicator_signals_executed ON public.indicator_signals(executed);

ALTER TABLE public.user_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own indicators"
  ON public.user_indicators FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own indicators"
  ON public.user_indicators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own indicators"
  ON public.user_indicators FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own indicators"
  ON public.user_indicators FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own indicator signals"
  ON public.indicator_signals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own indicator signals"
  ON public.indicator_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own indicator signals"
  ON public.indicator_signals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own indicator signals"
  ON public.indicator_signals FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_indicators_updated_at BEFORE UPDATE ON public.user_indicators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_indicator_signals_updated_at BEFORE UPDATE ON public.indicator_signals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();