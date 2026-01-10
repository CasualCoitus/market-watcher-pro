import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  Bell, 
  Cpu,
  ArrowUpRight,
  Lock,
  Gauge
} from 'lucide-react';

const features = [
  {
    icon: TrendingUp,
    title: 'Bollinger Bands Strategy',
    description: 'Automated breakout and mean reversion signals using advanced BB analysis with customizable periods and standard deviations.',
    color: 'primary',
  },
  {
    icon: BarChart3,
    title: 'VWAP Integration',
    description: 'Volume Weighted Average Price crossover detection for institutional-grade entry and exit timing.',
    color: 'accent',
  },
  {
    icon: Zap,
    title: 'Real-Time Execution',
    description: 'Sub-second order execution through IBKR with live position tracking and P&L updates.',
    color: 'warning',
  },
  {
    icon: Shield,
    title: 'Risk Management',
    description: 'Built-in stop-loss, take-profit, and trailing stops to protect your capital automatically.',
    color: 'primary',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Instant alerts for signal triggers, order fills, and position updates via toast notifications.',
    color: 'accent',
  },
  {
    icon: Cpu,
    title: 'AI-Powered Analysis',
    description: 'Machine learning models analyze market conditions to filter high-probability setups.',
    color: 'warning',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function FeaturesSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container relative z-10 mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Gauge className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Powerful Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to{' '}
            <span className="text-gradient">Trade Like a Pro</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our platform combines advanced technical analysis with automated execution 
            to help you capture opportunities in options markets.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group relative glass-card rounded-2xl p-6 hover:border-primary/30 transition-all duration-300"
            >
              <div className={`h-12 w-12 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`h-6 w-6 text-${feature.color}`} />
              </div>
              
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>

              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="h-5 w-5 text-primary" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 glass-card rounded-2xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Bank-Level Security</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Your Assets Are Always Protected
              </h3>
              <p className="text-muted-foreground">
                We never hold your funds. All trading happens directly through your IBKR account 
                with OAuth authentication. Your API keys are encrypted and stored securely.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '256-bit', label: 'Encryption' },
                { value: 'OAuth 2.0', label: 'Authentication' },
                { value: '0', label: 'Stored Funds' },
                { value: '24/7', label: 'Monitoring' },
              ].map((stat, index) => (
                <div key={index} className="bg-secondary/50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
