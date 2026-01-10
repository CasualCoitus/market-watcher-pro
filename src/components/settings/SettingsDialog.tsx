import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTradingSettings } from '@/hooks/useTradingSettings';
import { useIBKR } from '@/hooks/useIBKR';
import { Loader2, AlertTriangle, Shield, Wifi } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings, isLoading } = useTradingSettings();
  const { isAuthenticated, accountId } = useIBKR();
  
  const [formData, setFormData] = useState({
    auto_trade_enabled: false,
    max_daily_trades: 10,
    max_daily_loss: 1000,
    max_position_size: 10000,
    trading_hours_start: '09:30:00',
    trading_hours_end: '16:00:00',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        auto_trade_enabled: settings.auto_trade_enabled,
        max_daily_trades: settings.max_daily_trades,
        max_daily_loss: settings.max_daily_loss,
        max_position_size: settings.max_position_size,
        trading_hours_start: settings.trading_hours_start,
        trading_hours_end: settings.trading_hours_end,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trading Settings
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className={isAuthenticated ? 'h-4 w-4 text-green-500' : 'h-4 w-4 text-muted-foreground'} />
                <span className="font-medium">IBKR Connection</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isAuthenticated 
                  ? `Connected to account ${accountId}`
                  : 'Not connected to Interactive Brokers'
                }
              </p>
            </div>

            <Separator />

            {/* Auto-Trade Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Auto-Trade Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically execute trades on signals
                </p>
              </div>
              <Switch
                checked={formData.auto_trade_enabled}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, auto_trade_enabled: checked })
                }
                disabled={!isAuthenticated}
              />
            </div>

            {formData.auto_trade_enabled && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Caution: Auto-trading is enabled</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Trades will be executed automatically based on your signal rules.
                </p>
              </div>
            )}

            <Separator />

            {/* Risk Management */}
            <div className="space-y-4">
              <h3 className="font-medium">Risk Management</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Daily Trades</Label>
                  <Input
                    type="number"
                    value={formData.max_daily_trades}
                    onChange={(e) => 
                      setFormData({ ...formData, max_daily_trades: parseInt(e.target.value) || 10 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Daily Loss ($)</Label>
                  <Input
                    type="number"
                    value={formData.max_daily_loss}
                    onChange={(e) => 
                      setFormData({ ...formData, max_daily_loss: parseFloat(e.target.value) || 1000 })
                    }
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Max Position Size ($)</Label>
                <Input
                  type="number"
                  value={formData.max_position_size}
                  onChange={(e) => 
                    setFormData({ ...formData, max_position_size: parseFloat(e.target.value) || 10000 })
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Trading Hours */}
            <div className="space-y-4">
              <h3 className="font-medium">Trading Hours</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.trading_hours_start.slice(0, 5)}
                    onChange={(e) => 
                      setFormData({ ...formData, trading_hours_start: e.target.value + ':00' })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.trading_hours_end.slice(0, 5)}
                    onChange={(e) => 
                      setFormData({ ...formData, trading_hours_end: e.target.value + ':00' })
                    }
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full"
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
