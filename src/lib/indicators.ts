import { BollingerBands, SignalType } from '@/types/trading';

// Calculate Simple Moving Average
export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const slice = prices.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

// Calculate Standard Deviation
export function calculateStdDev(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const slice = prices.slice(-period);
  const mean = slice.reduce((sum, price) => sum + price, 0) / period;
  const squaredDiffs = slice.map(price => Math.pow(price - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
  return Math.sqrt(variance);
}

// Calculate Bollinger Bands
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBands | null {
  if (prices.length < period) return null;
  
  const middle = calculateSMA(prices, period);
  const stdDev = calculateStdDev(prices, period);
  
  return {
    upper: middle + (stdDev * stdDevMultiplier),
    middle,
    lower: middle - (stdDev * stdDevMultiplier),
  };
}

// Calculate VWAP (Volume Weighted Average Price)
export function calculateVWAP(
  prices: number[],
  volumes: number[],
  highs: number[],
  lows: number[]
): number {
  if (prices.length === 0 || prices.length !== volumes.length) return 0;
  
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (let i = 0; i < prices.length; i++) {
    const typicalPrice = (highs[i] + lows[i] + prices[i]) / 3;
    cumulativeTPV += typicalPrice * volumes[i];
    cumulativeVolume += volumes[i];
  }
  
  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0;
}

// Detect signals based on Bollinger Bands and VWAP
export function detectSignals(
  currentPrice: number,
  previousPrice: number,
  bb: BollingerBands,
  vwap: number,
  prevBb: BollingerBands | null
): SignalType[] {
  const signals: SignalType[] = [];
  
  // BB Breakout Up: Price crosses above upper band
  if (previousPrice <= bb.upper && currentPrice > bb.upper) {
    signals.push('bb_breakout_up');
  }
  
  // BB Breakout Down: Price crosses below lower band
  if (previousPrice >= bb.lower && currentPrice < bb.lower) {
    signals.push('bb_breakout_down');
  }
  
  // BB Mean Reversion Up: Price was below lower band and crosses back above
  if (prevBb && previousPrice < prevBb.lower && currentPrice > bb.lower) {
    signals.push('bb_mean_reversion_up');
  }
  
  // BB Mean Reversion Down: Price was above upper band and crosses back below
  if (prevBb && previousPrice > prevBb.upper && currentPrice < bb.upper) {
    signals.push('bb_mean_reversion_down');
  }
  
  // VWAP Cross Up: Price crosses above VWAP
  if (previousPrice <= vwap && currentPrice > vwap) {
    signals.push('vwap_cross_up');
  }
  
  // VWAP Cross Down: Price crosses below VWAP
  if (previousPrice >= vwap && currentPrice < vwap) {
    signals.push('vwap_cross_down');
  }
  
  return signals;
}

// Format price for display
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '-';
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Format percentage
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// Get signal display name
export function getSignalDisplayName(type: SignalType): string {
  const names: Record<SignalType, string> = {
    'bb_breakout_up': 'BB Breakout Up',
    'bb_breakout_down': 'BB Breakout Down',
    'bb_mean_reversion_up': 'BB Mean Reversion Up',
    'bb_mean_reversion_down': 'BB Mean Reversion Down',
    'vwap_cross_up': 'VWAP Cross Up',
    'vwap_cross_down': 'VWAP Cross Down',
    'custom': 'Custom Signal',
  };
  return names[type];
}

// Get strategy display name
export function getStrategyDisplayName(strategy: string): string {
  const names: Record<string, string> = {
    'buy_call': 'Buy Call',
    'buy_put': 'Buy Put',
    'sell_call': 'Sell Call',
    'sell_put': 'Sell Put',
    'bull_call_spread': 'Bull Call Spread',
    'bear_put_spread': 'Bear Put Spread',
    'iron_condor': 'Iron Condor',
    'straddle': 'Straddle',
    'strangle': 'Strangle',
  };
  return names[strategy] || strategy;
}
