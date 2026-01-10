import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { WatchlistPanel } from './WatchlistPanel';
import { SignalsPanel } from './SignalsPanel';
import { PositionsPanel } from './PositionsPanel';
import { OrdersPanel } from './OrdersPanel';
import { SignalRulesPanel } from './SignalRulesPanel';
import { SettingsDialog } from '@/components/settings/SettingsDialog';

export function Dashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Watchlist & Rules */}
          <div className="space-y-6">
            <WatchlistPanel />
            <SignalRulesPanel />
          </div>
          
          {/* Middle column - Signals & Orders */}
          <div className="space-y-6">
            <SignalsPanel />
            <OrdersPanel />
          </div>
          
          {/* Right column - Positions */}
          <div>
            <PositionsPanel />
          </div>
        </div>
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
