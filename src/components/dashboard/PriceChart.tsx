import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { format } from 'date-fns';
import { LineChart as LineChartIcon, RefreshCw, Loader2 } from 'lucide-react';

interface PriceBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  vwap?: number;
}

interface PriceChartProps {
  symbol: string;
  bbPeriod?: number;
  bbStdDev?: number;
  vwapEnabled?: boolean;
}

// Calculate Bollinger Bands
function calculateBB(prices: number[], period: number = 20, stdDev: number = 2) {
  const results: { upper: number; middle: number; lower: number }[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      results.push({ upper: prices[i], middle: prices[i], lower: prices[i] });
      continue;
    }
    
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    results.push({
      upper: mean + (std * stdDev),
      middle: mean,
      lower: mean - (std * stdDev),
    });
  }
  
  return results;
}

// Calculate VWAP
function calculateVWAP(bars: PriceBar[]) {
  const results: number[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (const bar of bars) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    cumulativeTPV += typicalPrice * bar.volume;
    cumulativeVolume += bar.volume;
    results.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : bar.close);
  }
  
  return results;
}

// Generate mock price data
function generateMockData(symbol: string, bars: number = 100): PriceBar[] {
  const data: PriceBar[] = [];
  const now = Date.now();
  const basePrice = 150 + (symbol.charCodeAt(0) % 50);
  
  for (let i = bars; i >= 0; i--) {
    const time = now - i * 60000; // 1 minute bars
    const noise = Math.sin(i / 10) * 5 + (Math.random() - 0.5) * 3;
    const price = basePrice + noise + (Math.random() - 0.5) * 2;
    
    data.push({
      timestamp: time,
      open: price + (Math.random() - 0.5),
      high: price + Math.random() * 2,
      low: price - Math.random() * 2,
      close: price + (Math.random() - 0.5),
      volume: Math.floor(Math.random() * 1000000) + 100000,
    });
  }
  
  return data;
}

export function PriceChart({ symbol, bbPeriod = 20, bbStdDev = 2, vwapEnabled = true }: PriceChartProps) {
  const [data, setData] = useState<PriceBar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('1m');

  const loadData = () => {
    setIsLoading(true);
    // Simulate loading - in production this would call the IBKR market data API
    setTimeout(() => {
      const rawData = generateMockData(symbol, 100);
      const prices = rawData.map(d => d.close);
      const bbValues = calculateBB(prices, bbPeriod, bbStdDev);
      const vwapValues = vwapEnabled ? calculateVWAP(rawData) : [];
      
      const enrichedData = rawData.map((bar, i) => ({
        ...bar,
        bbUpper: bbValues[i]?.upper,
        bbMiddle: bbValues[i]?.middle,
        bbLower: bbValues[i]?.lower,
        vwap: vwapValues[i],
      }));
      
      setData(enrichedData);
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [symbol, bbPeriod, bbStdDev, vwapEnabled, timeframe]);

  const currentPrice = data[data.length - 1]?.close ?? 0;
  const previousPrice = data[data.length - 2]?.close ?? currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const minPrice = Math.min(...data.map(d => Math.min(d.low, d.bbLower ?? d.low)));
  const maxPrice = Math.max(...data.map(d => Math.max(d.high, d.bbUpper ?? d.high)));
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5" />
            <span>{symbol}</span>
            <Badge variant={priceChange >= 0 ? 'default' : 'destructive'}>
              ${currentPrice.toFixed(2)} ({priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1m</SelectItem>
                <SelectItem value="5m">5m</SelectItem>
                <SelectItem value="15m">15m</SelectItem>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="1d">1D</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={loadData} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex gap-4 text-xs mt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span className="text-muted-foreground">Price</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-purple-500 opacity-50"></div>
            <span className="text-muted-foreground">BB ({bbPeriod}, {bbStdDev})</span>
          </div>
          {vwapEnabled && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-orange-500"></div>
              <span className="text-muted-foreground">VWAP</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="bbFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={[minPrice - padding, maxPrice + padding]}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                width={50}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const bar = payload[0]?.payload as PriceBar;
                  return (
                    <div className="bg-background border rounded-lg p-2 shadow-lg text-xs">
                      <div className="font-medium">{format(new Date(bar.timestamp), 'MMM d, HH:mm')}</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                        <span className="text-muted-foreground">O:</span>
                        <span>${bar.open.toFixed(2)}</span>
                        <span className="text-muted-foreground">H:</span>
                        <span>${bar.high.toFixed(2)}</span>
                        <span className="text-muted-foreground">L:</span>
                        <span>${bar.low.toFixed(2)}</span>
                        <span className="text-muted-foreground">C:</span>
                        <span className="font-medium">${bar.close.toFixed(2)}</span>
                        {bar.bbUpper && (
                          <>
                            <span className="text-purple-500">BB Upper:</span>
                            <span>${bar.bbUpper.toFixed(2)}</span>
                            <span className="text-purple-500">BB Mid:</span>
                            <span>${bar.bbMiddle?.toFixed(2)}</span>
                            <span className="text-purple-500">BB Lower:</span>
                            <span>${bar.bbLower?.toFixed(2)}</span>
                          </>
                        )}
                        {bar.vwap && (
                          <>
                            <span className="text-orange-500">VWAP:</span>
                            <span>${bar.vwap.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              
              {/* Bollinger Bands */}
              <Area
                type="monotone"
                dataKey="bbUpper"
                stroke="hsl(280, 70%, 60%)"
                strokeWidth={1}
                strokeDasharray="3 3"
                fill="url(#bbFill)"
                fillOpacity={0.3}
              />
              <Line
                type="monotone"
                dataKey="bbMiddle"
                stroke="hsl(280, 70%, 60%)"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="bbLower"
                stroke="hsl(280, 70%, 60%)"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
              
              {/* VWAP */}
              {vwapEnabled && (
                <Line
                  type="monotone"
                  dataKey="vwap"
                  stroke="hsl(30, 100%, 50%)"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              
              {/* Price line */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="hsl(210, 100%, 60%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}