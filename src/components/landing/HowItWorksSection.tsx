import { motion } from 'framer-motion';
import { 
  Link2, 
  LineChart, 
  Zap, 
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Link2,
    title: 'Connect Your Broker',
    description: 'Securely link your Interactive Brokers account using OAuth. We never see your password.',
    features: ['OAuth 2.0 Security', 'Paper Trading Support', '2-Minute Setup'],
  },
  {
    number: '02',
    icon: LineChart,
    title: 'Configure Signals',
    description: 'Set up your watchlist with Bollinger Bands and VWAP parameters. Customize to your strategy.',
    features: ['Custom BB Periods', 'VWAP Filtering', 'Multiple Symbols'],
  },
  {
    number: '03',
    icon: Zap,
    title: 'Create Trading Rules',
    description: 'Define entry rules linking signals to option strategies with position sizing and risk controls.',
    features: ['Options Strategies', 'Auto Position Sizing', 'Risk Limits'],
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Trade Automatically',
    description: 'The system scans for signals and executes trades based on your rules. Monitor in real-time.',
    features: ['Live Execution', 'Position Tracking', 'P&L Analytics'],
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/10" />
      
      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start Trading in{' '}
            <span className="text-gradient">4 Simple Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Get from zero to automated options trading in under 10 minutes.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/50 to-primary/50 hidden lg:block" />

          <div className="space-y-12 lg:space-y-24">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`grid lg:grid-cols-2 gap-8 items-center ${
                  index % 2 === 1 ? 'lg:direction-rtl' : ''
                }`}
              >
                <div className={`${index % 2 === 1 ? 'lg:order-2 lg:text-right' : ''}`}>
                  <div className={`inline-flex items-center gap-3 mb-4 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                    <span className="text-5xl font-bold text-primary/20">{step.number}</span>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground mb-4">{step.description}</p>
                  <ul className={`space-y-2 ${index % 2 === 1 ? 'lg:items-end' : ''}`}>
                    {step.features.map((feature, fIndex) => (
                      <li key={fIndex} className={`flex items-center gap-2 text-sm ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass-card rounded-2xl p-6 relative overflow-hidden"
                  >
                    {/* Step visualization placeholder */}
                    <div className="aspect-video bg-gradient-to-br from-secondary to-secondary/50 rounded-xl flex items-center justify-center">
                      <step.icon className="h-16 w-16 text-primary/30" />
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-4 right-4">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
