export type SignalType = 
  | 'bb_breakout_up' 
  | 'bb_breakout_down' 
  | 'bb_mean_reversion_up' 
  | 'bb_mean_reversion_down' 
  | 'vwap_cross_up' 
  | 'vwap_cross_down' 
  | 'custom';

export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'submitted' | 'filled' | 'partial' | 'cancelled' | 'rejected';
export type OptionType = 'call' | 'put';
export type OptionStrategy = 
  | 'buy_call' 
  | 'buy_put' 
  | 'sell_call' 
  | 'sell_put' 
  | 'bull_call_spread' 
  | 'bear_put_spread' 
  | 'iron_condor' 
  | 'straddle' 
  | 'strangle';

export interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  enabled: boolean;
  bb_period: number;
  bb_std_dev: number;
  vwap_enabled: boolean;
  created_at: string;
  updated_at: string;
  // Real-time data
  currentPrice?: number;
  bbUpper?: number;
  bbLower?: number;
  bbMiddle?: number;
  vwap?: number;
  volume?: number;
  change?: number;
  changePercent?: number;
}

export interface SignalRule {
  id: string;
  user_id: string;
  name: string;
  signal_type: SignalType;
  enabled: boolean;
  option_strategy: OptionStrategy;
  strike_offset_percent: number;
  expiry_days: number;
  position_size_percent: number;
  max_position_value: number;
  trailing_stop_percent: number | null;
  stop_loss_percent: number | null;
  take_profit_percent: number | null;
  created_at: string;
  updated_at: string;
}

export interface Signal {
  id: string;
  user_id: string;
  watchlist_id: string | null;
  signal_rule_id: string | null;
  symbol: string;
  signal_type: SignalType;
  price_at_signal: number;
  bb_upper: number | null;
  bb_lower: number | null;
  bb_middle: number | null;
  vwap: number | null;
  volume: number | null;
  triggered_at: string;
  executed: boolean;
}

export interface Order {
  id: string;
  user_id: string;
  signal_id: string | null;
  ibkr_order_id: string | null;
  symbol: string;
  option_type: OptionType | null;
  strike: number | null;
  expiry: string | null;
  side: OrderSide;
  quantity: number;
  limit_price: number | null;
  filled_price: number | null;
  status: OrderStatus;
  strategy: OptionStrategy | null;
  trailing_stop_percent: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  created_at: string;
  updated_at: string;
  filled_at: string | null;
}

export interface Position {
  id: string;
  user_id: string;
  order_id: string | null;
  symbol: string;
  option_type: OptionType | null;
  strike: number | null;
  expiry: string | null;
  quantity: number;
  avg_cost: number;
  current_price: number | null;
  unrealized_pnl: number | null;
  trailing_stop_price: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  is_open: boolean;
  opened_at: string;
  closed_at: string | null;
}

export interface IBKRSession {
  id: string;
  user_id: string;
  session_token: string | null;
  is_authenticated: boolean;
  last_authenticated: string | null;
  account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradingSettings {
  id: string;
  user_id: string;
  auto_trade_enabled: boolean;
  max_daily_trades: number;
  max_daily_loss: number;
  max_position_size: number;
  trading_hours_start: string;
  trading_hours_end: string;
  created_at: string;
  updated_at: string;
}

// Indicator calculations
export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}
