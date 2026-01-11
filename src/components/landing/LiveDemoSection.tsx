import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, Clock, DollarSign, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Signal {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  signalType: string;
  price: number;
  change: number;
  timestamp: Date;
}

const SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'META', 'AMD'];
const SIGNAL_TYPES = ['BB Breakout', 'VWAP Cross', 'Mean Reversion', 'Momentum'];

const generateSignal = (): Signal => {
  const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const type = Math.random() > 0.5 ? 'buy' : 'sell';
  const basePrice = 100 + Math.random() * 400;
  const change = (Math.random() - 0.5) * 10;
  
  return {
    id: `${Date.now()}-${Math.random()}`,
    symbol,
    type,
    signalType: SIGNAL_TYPES[Math.floor(Math.random() * SIGNAL_TYPES.length)],
    price: basePrice,
    change,
    timestamp: new Date(),
  };
};

const SignalCard = ({ signal, index }: { signal: Signal; index: number }) => {
  const isBuy = signal.type === 'buy';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.8 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`
        relative p-4 rounded-xl border backdrop-blur-sm
        ${isBuy 
          ? 'bg-success/10 border-success/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]' 
          : 'bg-destructive/10 border-destructive/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
        }
      `}
    >
      {/* Pulse effect */}
      <motion.div
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 1, repeat: Infinity }}
        className={`absolute inset-0 rounded-xl ${isBuy ? 'bg-success/20' : 'bg-destructive/20'}`}
      />
      
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isBuy ? 'bg-success/20' : 'bg-destructive/20'}`}>
            {isBuy ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">{signal.symbol}</span>
              <Badge 
                variant={isBuy ? 'default' : 'destructive'} 
                className={`text-xs ${isBuy ? 'bg-success hover:bg-success/80' : ''}`}
              >
                {signal.type.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-3 h-3" />
              <span>{signal.signalType}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-mono font-bold text-foreground">
            ${signal.price.toFixed(2)}
          </div>
          <div className={`text-sm font-medium ${signal.change >= 0 ? 'text-success' : 'text-destructive'}`}>
            {signal.change >= 0 ? '+' : ''}{signal.change.toFixed(2)}%
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const LiveDemoSection = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [totalSignals, setTotalSignals] = useState(0);
  const [successRate, setSuccessRate] = useState(87);

  useEffect(() => {
    // Generate initial signals
    const initial = Array.from({ length: 3 }, generateSignal);
    setSignals(initial);
    setTotalSignals(3);

    // Add new signals periodically
    const interval = setInterval(() => {
      setSignals(prev => {
        const newSignal = generateSignal();
        const updated = [newSignal, ...prev].slice(0, 5);
        return updated;
      });
      setTotalSignals(prev => prev + 1);
      setSuccessRate(prev => Math.min(95, Math.max(82, prev + (Math.random() - 0.5) * 2)));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
            <Activity className="w-3 h-3 mr-1" />
            Live Demo
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Watch Signals in{' '}
            <span className="text-gradient">Real-Time</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how our AI detects trading opportunities as they happen. 
            This is a live simulation of our signal detection system.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Stats Panel */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Signal Statistics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/50 p-4 rounded-xl border border-border/50">
                  <div className="text-3xl font-bold text-primary mb-1">
                    <motion.span
                      key={totalSignals}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                    >
                      {totalSignals}
                    </motion.span>
                  </div>
                  <div className="text-sm text-muted-foreground">Signals Today</div>
                </div>
                
                <div className="bg-background/50 p-4 rounded-xl border border-border/50">
                  <div className="text-3xl font-bold text-success mb-1">
                    {successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                
                <div className="bg-background/50 p-4 rounded-xl border border-border/50">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    <Clock className="w-8 h-8 inline" />
                  </div>
                  <div className="text-sm text-muted-foreground">Real-Time</div>
                </div>
                
                <div className="bg-background/50 p-4 rounded-xl border border-border/50">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    <DollarSign className="w-8 h-8 inline" />
                  </div>
                  <div className="text-sm text-muted-foreground">Auto-Execute</div>
                </div>
              </div>
            </div>

            {/* How it works mini */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-semibold mb-4">How It Works</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">1</span>
                  <span>AI monitors Bollinger Bands & VWAP indicators</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">2</span>
                  <span>Detects breakouts and mean reversions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">3</span>
                  <span>Automatically executes trades via IBKR</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Live Signals Feed */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Live Signal Feed
              </h3>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                </span>
                <span className="text-sm text-muted-foreground">Live</span>
              </div>
            </div>

            <div className="space-y-3 min-h-[320px]">
              <AnimatePresence mode="popLayout">
                {signals.map((signal, index) => (
                  <SignalCard key={signal.id} signal={signal} index={index} />
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-6 pt-4 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Ready to automate your trading?
              </p>
              <motion.a
                href="/auth"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Start Trading Now
                <TrendingUp className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
