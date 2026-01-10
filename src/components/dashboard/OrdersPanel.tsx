import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrders } from '@/hooks/useOrders';
import { formatPrice, getStrategyDisplayName } from '@/lib/indicators';
import { format } from 'date-fns';
import { 
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { OrderStatus } from '@/types/trading';

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case 'filled':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'cancelled':
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
};

const getStatusBadgeVariant = (status: OrderStatus): 'default' | 'destructive' | 'secondary' | 'outline' => {
  switch (status) {
    case 'filled':
      return 'default';
    case 'cancelled':
    case 'rejected':
      return 'destructive';
    case 'pending':
    case 'submitted':
      return 'secondary';
    default:
      return 'outline';
  }
};

export function OrdersPanel() {
  const { orders, pendingOrders, filledOrders, isLoading } = useOrders();

  const renderOrder = (order: typeof orders[0]) => (
    <div
      key={order.id}
      className="p-3 rounded-lg border bg-card"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon(order.status)}
          <span className="font-semibold">{order.symbol}</span>
          <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
            {order.side.toUpperCase()}
          </Badge>
        </div>
        <Badge variant={getStatusBadgeVariant(order.status)}>
          {order.status.toUpperCase()}
        </Badge>
      </div>
      
      {order.option_type && (
        <div className="mb-2">
          <Badge variant="outline" className="text-xs">
            {order.strike} {order.option_type.toUpperCase()}
            {order.expiry && ` exp ${format(new Date(order.expiry), 'MM/dd')}`}
          </Badge>
          {order.strategy && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {getStrategyDisplayName(order.strategy)}
            </Badge>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Qty:</span>
          <span className="ml-1 font-medium">{order.quantity}</span>
        </div>
        {order.limit_price && (
          <div>
            <span className="text-muted-foreground">Limit:</span>
            <span className="ml-1">{formatPrice(order.limit_price)}</span>
          </div>
        )}
        {order.filled_price && (
          <div>
            <span className="text-muted-foreground">Filled:</span>
            <span className="ml-1">{formatPrice(order.filled_price)}</span>
          </div>
        )}
        {order.ibkr_order_id && (
          <div>
            <span className="text-muted-foreground">IBKR ID:</span>
            <span className="ml-1 text-xs">{order.ibkr_order_id}</span>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground">
        {format(new Date(order.created_at), 'MMM d, yyyy HH:mm:ss')}
      </div>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Orders</span>
          </div>
          <Badge variant="secondary">{orders.length} total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pending">
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="filled">
              Filled ({filledOrders.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <ScrollArea className="h-[350px]">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : pendingOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No pending orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.map(renderOrder)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="filled">
            <ScrollArea className="h-[350px]">
              {filledOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No filled orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filledOrders.map(renderOrder)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
