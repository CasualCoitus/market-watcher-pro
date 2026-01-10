import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';

const generateData = () => {
  const data = [];
  let value = 100;
  for (let i = 0; i < 30; i++) {
    value += (Math.random() - 0.45) * 5;
    data.push({
      time: i,
      price: Math.max(80, Math.min(130, value)),
      volume: Math.random() * 100,
    });
  }
  return data;
};

export function AnimatedChart() {
  const [data, setData] = useState(generateData);
  const [currentPrice, setCurrentPrice] = useState(data[data.length - 1].price);
  const [priceChange, setPriceChange] = useState(2.34);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1)];
        const lastPrice = newData[newData.length - 1].price;
        const newPrice = Math.max(80, Math.min(130, lastPrice + (Math.random() - 0.45) * 3));
        newData.push({
          time: prev[prev.length - 1].time + 1,
          price: newPrice,
          volume: Math.random() * 100,
        });
        setCurrentPrice(newPrice);
        setPriceChange(((newPrice - 100) / 100) * 100);
        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const isPositive = priceChange >= 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
              SP
            </div>
            <div>
              <div className="font-semibold">S&P 500</div>
              <div className="text-xs text-muted-foreground">Index</div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <motion.div
            key={currentPrice}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold"
          >
            ${currentPrice.toFixed(2)}
          </motion.div>
          <div className={`text-sm font-medium ${isPositive ? 'text-primary' : 'text-destructive'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorPrice)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Time filters */}
      <div className="flex gap-2">
        {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((period, index) => (
          <button
            key={period}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              index === 2
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/30">
        <div>
          <div className="text-xs text-muted-foreground">Open</div>
          <div className="font-medium">$98.42</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">High</div>
          <div className="font-medium text-primary">$112.87</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Low</div>
          <div className="font-medium text-destructive">$95.21</div>
        </div>
      </div>
    </div>
  );
}
