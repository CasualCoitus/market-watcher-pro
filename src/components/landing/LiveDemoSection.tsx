import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, Activity, BarChart3, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: string;
  isActive: boolean;
}

interface Signal {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  signalType: string;
  price: number;
  change: number;
  timestamp: Date;
  confidence: number;
}

const STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.42, change: 2.34, volume: '52.3M', isActive: false },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: -1.23, volume: '28.1M', isActive: false },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: 1.87, volume: '31.2M', isActive: false },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.28, change: 4.52, volume: '45.8M', isActive: false },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -2.18, volume: '89.4M', isActive: false },
  { symbol: 'META', name: 'Meta Platforms', price: 505.75, change: 3.21, volume: '22.6M', isActive: false },
];

const SIGNAL_TYPES = ['BB Breakout', 'VWAP Cross', 'Mean Reversion', 'Momentum Surge', 'Volume Spike'];

const generateSignal = (stock: Stock): Signal => {
  const type = Math.random() > 0.5 ? 'buy' : 'sell';
  return {
    id: `${Date.now()}-${Math.random()}`,
    symbol: stock.symbol,
    type,
    signalType: SIGNAL_TYPES[Math.floor(Math.random() * SIGNAL_TYPES.length)],
    price: stock.price,
    change: stock.change,
    timestamp: new Date(),
    confidence: 75 + Math.floor(Math.random() * 20),
  };
};

const StockCard = ({ 
  stock, 
  index, 
  isActive, 
  onActivate 
}: { 
  stock: Stock; 
  index: number; 
  isActive: boolean;
  onActivate: () => void;
}) => {
  const [currentPrice, setCurrentPrice] = useState(stock.price);
  const [currentChange, setCurrentChange] = useState(stock.change);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.5) * 2;
      setCurrentPrice(prev => {
        const newPrice = Math.max(1, prev + delta);
        setPriceFlash(delta > 0 ? 'up' : 'down');
        setTimeout(() => setPriceFlash(null), 300);
        return newPrice;
      });
      setCurrentChange(prev => prev + (Math.random() - 0.5) * 0.5);
    }, 1500 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, []);

  const isPositive = currentChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        boxShadow: isActive 
          ? '0 0 30px rgba(34, 197, 94, 0.3)' 
          : '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        type: 'spring',
        stiffness: 100
      }}
      whileHover={{ scale: 1.02, y: -5 }}
      onClick={onActivate}
      className={`
        relative cursor-pointer p-4 rounded-xl border backdrop-blur-sm transition-all duration-300
        ${isActive 
          ? 'bg-primary/10 border-primary/50 ring-2 ring-primary/30' 
          : 'bg-card/50 border-border/50 hover:border-primary/30'
        }
      `}
    >
      {/* Live indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-success"
        />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Live</span>
      </div>

      {/* Active pulse ring */}
      {isActive && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.05, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-xl border-2 border-primary"
        />
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-foreground">{stock.symbol}</span>
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-1.5 py-0.5 bg-primary/20 rounded text-[10px] text-primary font-medium"
              >
                SCANNING
              </motion.div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{stock.name}</span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <motion.div
            key={currentPrice}
            initial={{ color: priceFlash === 'up' ? '#22c55e' : priceFlash === 'down' ? '#ef4444' : undefined }}
            animate={{ color: 'hsl(var(--foreground))' }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-mono font-bold"
          >
            ${currentPrice.toFixed(2)}
          </motion.div>
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{isPositive ? '+' : ''}{currentChange.toFixed(2)}%</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-muted-foreground mb-1">Volume</div>
          <div className="text-sm font-medium text-foreground">{stock.volume}</div>
        </div>
      </div>

      {/* Mini chart visualization */}
      <div className="mt-3 h-8 flex items-end gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${20 + Math.random() * 80}%` }}
            transition={{ duration: 0.5, delay: i * 0.02 }}
            className={`flex-1 rounded-sm ${isPositive ? 'bg-success/40' : 'bg-destructive/40'}`}
          />
        ))}
      </div>
    </motion.div>
  );
};

const SignalCard = ({ signal, onComplete }: { signal: Signal; onComplete: () => void }) => {
  const isBuy = signal.type === 'buy';

  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: -100 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: 100 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`
        relative p-5 rounded-2xl border-2 backdrop-blur-md
        ${isBuy 
          ? 'bg-success/15 border-success/40' 
          : 'bg-destructive/15 border-destructive/40'
        }
      `}
    >
      {/* Animated background glow */}
      <motion.div
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`absolute inset-0 rounded-2xl blur-xl ${isBuy ? 'bg-success/20' : 'bg-destructive/20'}`}
      />

      {/* Pulse rings */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.8 }}
        animate={{ scale: 1.3, opacity: 0 }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className={`absolute inset-0 rounded-2xl border-2 ${isBuy ? 'border-success' : 'border-destructive'}`}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className={`p-2.5 rounded-xl ${isBuy ? 'bg-success/30' : 'bg-destructive/30'}`}
            >
              <Activity className={`w-5 h-5 ${isBuy ? 'text-success' : 'text-destructive'}`} />
            </motion.div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Signal Detected</div>
              <div className="font-bold text-lg">{signal.symbol}</div>
            </div>
          </div>
          <Badge 
            className={`text-sm px-3 py-1 ${isBuy ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}
          >
            {signal.type.toUpperCase()}
          </Badge>
        </div>

        {/* Signal details */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-background/30 p-3 rounded-xl">
            <div className="text-xs text-muted-foreground mb-1">Type</div>
            <div className="font-medium text-sm flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" />
              {signal.signalType}
            </div>
          </div>
          <div className="bg-background/30 p-3 rounded-xl">
            <div className="text-xs text-muted-foreground mb-1">Price</div>
            <div className="font-mono font-bold">${signal.price.toFixed(2)}</div>
          </div>
          <div className="bg-background/30 p-3 rounded-xl">
            <div className="text-xs text-muted-foreground mb-1">Confidence</div>
            <div className="font-bold text-primary">{signal.confidence}%</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 bg-background/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 4, ease: 'linear' }}
            className={`absolute inset-y-0 left-0 ${isBuy ? 'bg-success' : 'bg-destructive'}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export function LiveDemoSection() {
  const [stocks, setStocks] = useState(STOCKS);
  const [activeStockIndex, setActiveStockIndex] = useState<number | null>(null);
  const [currentSignal, setCurrentSignal] = useState<Signal | null>(null);
  const [totalSignals, setTotalSignals] = useState(0);
  const [successRate, setSuccessRate] = useState(87.3);

  // Auto-rotate through stocks
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStockIndex(prev => {
        const next = prev === null ? 0 : (prev + 1) % stocks.length;
        
        // Generate signal for active stock
        setTimeout(() => {
          const signal = generateSignal(stocks[next]);
          setCurrentSignal(signal);
          setTotalSignals(t => t + 1);
          setSuccessRate(r => Math.min(95, Math.max(82, r + (Math.random() - 0.3) * 2)));
        }, 500);
        
        return next;
      });
    }, 5000);

    // Start immediately
    setActiveStockIndex(0);
    setTimeout(() => {
      setCurrentSignal(generateSignal(stocks[0]));
      setTotalSignals(1);
    }, 1000);

    return () => clearInterval(interval);
  }, [stocks]);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <motion.div
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle at center, hsl(var(--primary) / 0.1) 0%, transparent 50%)',
          backgroundSize: '100% 100%',
        }}
      />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-success"
            />
            <span className="text-sm font-medium text-primary">Live Market Scanner</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Real-Time Signal{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Detection
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch our AI scan the markets and generate trading signals in real-time
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Stock Grid */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Watchlist Scanner
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Scanning {stocks.length} symbols</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stocks.map((stock, index) => (
                  <StockCard
                    key={stock.symbol}
                    stock={stock}
                    index={index}
                    isActive={activeStockIndex === index}
                    onActivate={() => {
                      setActiveStockIndex(index);
                      const signal = generateSignal(stock);
                      setCurrentSignal(signal);
                      setTotalSignals(t => t + 1);
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Signal Output */}
          <div className="space-y-6">
            {/* Active Signal */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-2xl"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Latest Signal
              </h3>

              <div className="min-h-[200px]">
                <AnimatePresence mode="wait">
                  {currentSignal ? (
                    <SignalCard 
                      key={currentSignal.id} 
                      signal={currentSignal} 
                      onComplete={() => {}}
                    />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-[200px] flex items-center justify-center text-muted-foreground"
                    >
                      <div className="text-center">
                        <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                        <p>Scanning for signals...</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 rounded-2xl"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Session Stats
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl">
                  <span className="text-muted-foreground">Signals Generated</span>
                  <motion.span
                    key={totalSignals}
                    initial={{ scale: 1.3, color: 'hsl(var(--primary))' }}
                    animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                    className="font-bold text-xl"
                  >
                    {totalSignals}
                  </motion.span>
                </div>

                <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl">
                  <span className="text-muted-foreground">Success Rate</span>
                  <motion.span
                    key={successRate.toFixed(1)}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="font-bold text-xl text-success"
                  >
                    {successRate.toFixed(1)}%
                  </motion.span>
                </div>

                <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl">
                  <span className="text-muted-foreground">Active Symbols</span>
                  <span className="font-bold text-xl">{stocks.length}</span>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 px-6 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              Start Trading Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
