import { motion } from 'framer-motion';
import { 
  Github, 
  Twitter, 
  Linkedin,
  TrendingUp 
} from 'lucide-react';

const footerLinks = {
  Product: ['Features', 'Pricing', 'Documentation', 'API'],
  Company: ['About', 'Blog', 'Careers', 'Contact'],
  Resources: ['Help Center', 'Community', 'Tutorials', 'Status'],
  Legal: ['Privacy', 'Terms', 'Security', 'Cookies'],
};

export function Footer() {
  return (
    <footer className="py-16 border-t border-border/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">SignalFlow</span>
            </div>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Automated options trading powered by technical analysis and AI. 
              Trade smarter, not harder.
            </p>
            <div className="flex gap-4">
              {[Twitter, Github, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 SignalFlow. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Trading involves risk. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
