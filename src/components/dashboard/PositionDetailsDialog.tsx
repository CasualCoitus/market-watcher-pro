import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Position } from '@/types/trading';
import { formatPrice, formatPercent } from '@/lib/indicators';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  X,
  Save,
  Loader2,
} from 'lucide-react';

interface PositionDetailsDialogProps {
  position: Position | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PositionDetailsDialog({ position, open, onOpenChange }: PositionDetailsDialogProps) {
  const queryClient = useQueryClient();
  const [stopLoss, setStopLoss] = useState(position?.stop_loss_price?.toString() || '');
  const [takeProfit, setTakeProfit] = useState(position?.take_profit_price?.toString() || '');
  const [trailingStop, setTrailingStop] = useState(position?.trailing_stop_price?.toString() || '');

  const updatePosition = useMutation({
    mutationFn: async (updates: Partial<Position>) => {
      if (!position) return;
      const { error } = await supabase
        .from('positions')
        .update(updates)
        .eq('id', position.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success('Position updated');
    },
    onError: (error) => {
      toast.error('Failed to update position: ' + error.message);
    },
  });

  const closePosition = useMutation({
    mutationFn: async () => {
      if (!position) return;
      // In production, this would call the IBKR orders API to close the position
      const { error } = await supabase
        .from('positions')
        .update({
          is_open: false,
          closed_at: new Date().toISOString(),
        })
        .eq('id', position.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['closedPositions'] });
      toast.success('Position closed');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to close position: ' + error.message);
    },
  });

  const handleSaveStops = () => {
    updatePosition.mutate({
      stop_loss_price: stopLoss ? parseFloat(stopLoss) : null,
      take_profit_price: takeProfit ? parseFloat(takeProfit) : null,
      trailing_stop_price: trailingStop ? parseFloat(trailingStop) : null,
    });
  };

  if (!position) return null;

  const pnl = position.unrealized_pnl || 0;
  const pnlPercent = position.avg_cost ? (pnl / (position.avg_cost * position.quantity)) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{position.symbol}</span>
            {position.option_type && (
              <Badge variant="outline">
                {position.strike} {position.option_type.toUpperCase()}
                {position.expiry && ` ${format(new Date(position.expiry), 'MM/dd')}`}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* P&L Summary */}
          <div className="p-4 rounded-lg bg-accent/50">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Unrealized P&L</span>
              <div className="flex items-center gap-2">
                {pnl >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-lg font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPrice(pnl)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Position Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Quantity</span>
              <div className="font-medium">{position.quantity}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Cost</span>
              <div className="font-medium">{formatPrice(position.avg_cost)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Current Price</span>
              <div className="font-medium">{formatPrice(position.current_price)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Market Value</span>
              <div className="font-medium">
                {formatPrice((position.current_price || position.avg_cost) * position.quantity)}
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Opened</span>
              <div className="font-medium">
                {format(new Date(position.opened_at || new Date()), 'MMM d, yyyy HH:mm')}
              </div>
            </div>
          </div>

          <Separator />

          {/* Stop Management */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Risk Management
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="stopLoss" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                Stop Loss
              </Label>
              <Input
                id="stopLoss"
                type="number"
                step="0.01"
                placeholder="Enter stop loss price"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="takeProfit" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                Take Profit
              </Label>
              <Input
                id="takeProfit"
                type="number"
                step="0.01"
                placeholder="Enter take profit price"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trailingStop" className="flex items-center gap-1">
                <Target className="h-3 w-3 text-yellow-500" />
                Trailing Stop Price
              </Label>
              <Input
                id="trailingStop"
                type="number"
                step="0.01"
                placeholder="Enter trailing stop price"
                value={trailingStop}
                onChange={(e) => setTrailingStop(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSaveStops}
              disabled={updatePosition.isPending}
            >
              {updatePosition.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Risk Settings
            </Button>
          </div>

          <Separator />

          {/* Close Position */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => closePosition.mutate()}
            disabled={closePosition.isPending}
          >
            {closePosition.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Close Position
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}