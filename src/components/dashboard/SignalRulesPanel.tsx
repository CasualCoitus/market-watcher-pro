import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSignalRules } from '@/hooks/useSignalRules';
import { getSignalDisplayName, getStrategyDisplayName } from '@/lib/indicators';
import { 
  Settings2, 
  Plus, 
  Trash2,
  Loader2
} from 'lucide-react';
import { SignalType, OptionStrategy } from '@/types/trading';

const SIGNAL_TYPES: SignalType[] = [
  'bb_breakout_up',
  'bb_breakout_down',
  'bb_mean_reversion_up',
  'bb_mean_reversion_down',
  'vwap_cross_up',
  'vwap_cross_down',
  'custom',
];

const OPTION_STRATEGIES: OptionStrategy[] = [
  'buy_call',
  'buy_put',
  'sell_call',
  'sell_put',
  'bull_call_spread',
  'bear_put_spread',
  'iron_condor',
  'straddle',
  'strangle',
];

export function SignalRulesPanel() {
  const { signalRules, isLoading, addRule, updateRule, deleteRule } = useSignalRules();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    signal_type: 'bb_breakout_up' as SignalType,
    option_strategy: 'buy_call' as OptionStrategy,
    strike_offset_percent: 0,
    expiry_days: 30,
    position_size_percent: 5,
    max_position_value: 10000,
    trailing_stop_percent: 10,
    stop_loss_percent: 20,
    take_profit_percent: 50,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRule.mutate({
      ...formData,
      trailing_stop_percent: formData.trailing_stop_percent || null,
      stop_loss_percent: formData.stop_loss_percent || null,
      take_profit_percent: formData.take_profit_percent || null,
    });
    setIsDialogOpen(false);
    setFormData({
      name: '',
      signal_type: 'bb_breakout_up',
      option_strategy: 'buy_call',
      strike_offset_percent: 0,
      expiry_days: 30,
      position_size_percent: 5,
      max_position_value: 10000,
      trailing_stop_percent: 10,
      stop_loss_percent: 20,
      take_profit_percent: 50,
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            <span>Signal Rules</span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Signal Rule</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., BB Breakout Buy Calls"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Signal Type</Label>
                  <Select
                    value={formData.signal_type}
                    onValueChange={(v) => setFormData({ ...formData, signal_type: v as SignalType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIGNAL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getSignalDisplayName(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Options Strategy</Label>
                  <Select
                    value={formData.option_strategy}
                    onValueChange={(v) => setFormData({ ...formData, option_strategy: v as OptionStrategy })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPTION_STRATEGIES.map((strategy) => (
                        <SelectItem key={strategy} value={strategy}>
                          {getStrategyDisplayName(strategy)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Strike Offset %</Label>
                    <Input
                      type="number"
                      value={formData.strike_offset_percent}
                      onChange={(e) => setFormData({ ...formData, strike_offset_percent: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry (days)</Label>
                    <Input
                      type="number"
                      value={formData.expiry_days}
                      onChange={(e) => setFormData({ ...formData, expiry_days: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Position Size %</Label>
                    <Input
                      type="number"
                      value={formData.position_size_percent}
                      onChange={(e) => setFormData({ ...formData, position_size_percent: parseFloat(e.target.value) || 5 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Value ($)</Label>
                    <Input
                      type="number"
                      value={formData.max_position_value}
                      onChange={(e) => setFormData({ ...formData, max_position_value: parseFloat(e.target.value) || 10000 })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Trail Stop %</Label>
                    <Input
                      type="number"
                      value={formData.trailing_stop_percent}
                      onChange={(e) => setFormData({ ...formData, trailing_stop_percent: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stop Loss %</Label>
                    <Input
                      type="number"
                      value={formData.stop_loss_percent}
                      onChange={(e) => setFormData({ ...formData, stop_loss_percent: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Take Profit %</Label>
                    <Input
                      type="number"
                      value={formData.take_profit_percent}
                      onChange={(e) => setFormData({ ...formData, take_profit_percent: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={addRule.isPending}>
                  {addRule.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Rule
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : signalRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No signal rules configured</p>
              <p className="text-sm">Create rules to automate trading</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signalRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) =>
                          updateRule.mutate({ id: rule.id, updates: { enabled } })
                        }
                      />
                      <span className="font-semibold">{rule.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRule.mutate(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="secondary">
                      {getSignalDisplayName(rule.signal_type)}
                    </Badge>
                    <Badge variant="outline">
                      {getStrategyDisplayName(rule.option_strategy)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>DTE: {rule.expiry_days}d</div>
                    <div>Size: {rule.position_size_percent}%</div>
                    {rule.trailing_stop_percent && (
                      <div>Trail: {rule.trailing_stop_percent}%</div>
                    )}
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
