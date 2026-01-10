import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSignals } from '@/hooks/useSignals';
import { formatPrice, getSignalDisplayName } from '@/lib/indicators';
import { format } from 'date-fns';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { SignalType } from '@/types/trading';

const getSignalIcon = (type: SignalType) => {
  if (type.includes('up')) {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  }
  return <TrendingDown className="h-4 w-4 text-red-500" />;
};

const getSignalColor = (type: SignalType): 'default' | 'destructive' | 'secondary' => {
  if (type.includes('up') || type.includes('reversion_up')) {
    return 'default';
  }
  if (type.includes('down') || type.includes('reversion_down')) {
    return 'destructive';
  }
  return 'secondary';
};

export function SignalsPanel() {
  const { signals, isLoading } = useSignals();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Signals</span>
          </div>
          <Badge variant="secondary">{signals.length} total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No signals yet</p>
              <p className="text-sm">Signals will appear when conditions are met</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal) => (
                <div
                  key={signal.id}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSignalIcon(signal.signal_type)}
                      <span className="font-semibold">{signal.symbol}</span>
                      <Badge variant={getSignalColor(signal.signal_type)}>
                        {getSignalDisplayName(signal.signal_type)}
                      </Badge>
                    </div>
                    {signal.executed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="text-xs">Price:</span>
                      <span className="ml-1 font-medium text-foreground">
                        {formatPrice(signal.price_at_signal)}
                      </span>
                    </div>
                    {signal.vwap && (
                      <div>
                        <span className="text-xs">VWAP:</span>
                        <span className="ml-1 font-medium text-foreground">
                          {formatPrice(signal.vwap)}
                        </span>
                      </div>
                    )}
                    {signal.bb_upper && (
                      <div>
                        <span className="text-xs">BB Upper:</span>
                        <span className="ml-1">{formatPrice(signal.bb_upper)}</span>
                      </div>
                    )}
                    {signal.bb_lower && (
                      <div>
                        <span className="text-xs">BB Lower:</span>
                        <span className="ml-1">{formatPrice(signal.bb_lower)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    {format(new Date(signal.triggered_at), 'MMM d, yyyy HH:mm:ss')}
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
