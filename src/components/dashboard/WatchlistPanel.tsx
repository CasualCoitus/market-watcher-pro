import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWatchlist } from '@/hooks/useWatchlist';
import { formatPrice, formatPercent } from '@/lib/indicators';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

export function WatchlistPanel() {
  const { watchlist, isLoading, addSymbol, removeSymbol, updateSymbol } = useWatchlist();
  const [newSymbol, setNewSymbol] = useState('');

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbol.trim()) {
      addSymbol.mutate(newSymbol.trim());
      setNewSymbol('');
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Watchlist</span>
          <Badge variant="secondary">{watchlist.length} symbols</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add symbol form */}
        <form onSubmit={handleAddSymbol} className="flex gap-2">
          <Input
            placeholder="Add symbol (e.g., AAPL)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={addSymbol.isPending}>
            {addSymbol.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Watchlist items */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : watchlist.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No symbols in watchlist</p>
              <p className="text-sm">Add symbols to start monitoring</p>
            </div>
          ) : (
            <div className="space-y-2">
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(enabled) => 
                        updateSymbol.mutate({ id: item.id, updates: { enabled } })
                      }
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.symbol}</span>
                        {item.changePercent !== undefined && (
                          <Badge 
                            variant={item.changePercent >= 0 ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {item.changePercent >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {formatPercent(item.changePercent)}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.currentPrice ? formatPrice(item.currentPrice) : 'Loading...'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.enabled ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSymbol.mutate(item.id)}
                      disabled={removeSymbol.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
