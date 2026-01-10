import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePositions } from '@/hooks/usePositions';
import { formatPrice, formatPercent } from '@/lib/indicators';
import { format } from 'date-fns';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown,
  Loader2,
  Target,
  AlertTriangle
} from 'lucide-react';

export function PositionsPanel() {
  const { positions, closedPositions, isLoading } = usePositions();

  const totalPnL = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);

  const renderPosition = (position: typeof positions[0], isOpen: boolean) => (
    <div
      key={position.id}
      className="p-3 rounded-lg border bg-card"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{position.symbol}</span>
          {position.option_type && (
            <Badge variant="outline">
              {position.strike} {position.option_type.toUpperCase()}
              {position.expiry && ` ${format(new Date(position.expiry), 'MM/dd')}`}
            </Badge>
          )}
        </div>
        <Badge 
          variant={
            (position.unrealized_pnl ?? 0) >= 0 ? 'default' : 'destructive'
          }
        >
          {(position.unrealized_pnl ?? 0) >= 0 ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {formatPrice(position.unrealized_pnl)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Qty:</span>
          <span className="ml-1 font-medium">{position.quantity}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Avg Cost:</span>
          <span className="ml-1">{formatPrice(position.avg_cost)}</span>
        </div>
        {isOpen && position.current_price && (
          <div>
            <span className="text-muted-foreground">Current:</span>
            <span className="ml-1">{formatPrice(position.current_price)}</span>
          </div>
        )}
        {position.trailing_stop_price && (
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-yellow-500" />
            <span className="text-xs">Trail: {formatPrice(position.trailing_stop_price)}</span>
          </div>
        )}
        {position.stop_loss_price && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span className="text-xs">SL: {formatPrice(position.stop_loss_price)}</span>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground">
        {isOpen 
          ? `Opened ${format(new Date(position.opened_at), 'MMM d, HH:mm')}`
          : `Closed ${format(new Date(position.closed_at!), 'MMM d, HH:mm')}`
        }
      </div>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            <span>Positions</span>
          </div>
          <Badge variant={totalPnL >= 0 ? 'default' : 'destructive'}>
            P&L: {formatPrice(totalPnL)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="open">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="open">
              Open ({positions.length})
            </TabsTrigger>
            <TabsTrigger value="closed">
              Closed ({closedPositions.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="open">
            <ScrollArea className="h-[350px]">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : positions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No open positions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {positions.map((p) => renderPosition(p, true))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="closed">
            <ScrollArea className="h-[350px]">
              {closedPositions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No closed positions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {closedPositions.map((p) => renderPosition(p, false))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
