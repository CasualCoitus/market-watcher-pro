import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { WatchlistPanel } from './WatchlistPanel';
import { SignalsPanel } from './SignalsPanel';
import { PositionsPanel } from './PositionsPanel';
import { OrdersPanel } from './OrdersPanel';
import { SignalRulesPanel } from './SignalRulesPanel';
import { PriceChart } from './PriceChart';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Dashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { watchlist } = useWatchlist();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Get the first enabled symbol for the chart
  const activeSymbol = selectedSymbol || watchlist.find(w => w.enabled)?.symbol || 'AAPL';
  const activeWatchlistItem = watchlist.find(w => w.symbol === activeSymbol);

  return (
    <div className="min-h-screen bg-background">
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      
      <main className="container mx-auto px-4 py-6">
        {/* Price Chart Section */}
        <div className="mb-6">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {watchlist.filter(w => w.enabled).slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedSymbol(item.symbol)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeSymbol === item.symbol
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {item.symbol}
              </button>
            ))}
          </div>
          <PriceChart
            symbol={activeSymbol}
            bbPeriod={activeWatchlistItem?.bb_period || 20}
            bbStdDev={activeWatchlistItem?.bb_std_dev || 2}
            vwapEnabled={activeWatchlistItem?.vwap_enabled ?? true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Watchlist & Rules */}
          <div className="space-y-6">
            <Tabs defaultValue="watchlist" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
                <TabsTrigger value="rules">Signal Rules</TabsTrigger>
              </TabsList>
              <TabsContent value="watchlist">
                <WatchlistPanel />
              </TabsContent>
              <TabsContent value="rules">
                <SignalRulesPanel />
              </TabsContent>
            </Tabs>
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
