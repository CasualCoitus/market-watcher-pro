import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIndicators } from '@/hooks/useIndicators';
import { Loader2, TrendingUp } from 'lucide-react';

interface IndicatorConfig {
  type: string;
  label: string;
  description: string;
  defaultParams: Record<string, any>;
}

const AVAILABLE_INDICATORS: IndicatorConfig[] = [
  {
    type: 'RSI',
    label: 'Relative Strength Index',
    description: 'Measures momentum and overbought/oversold conditions',
    defaultParams: { period: 14, oversold: 30, overbought: 70 },
  },
  {
    type: 'MACD',
    label: 'MACD',
    description: 'Trend following momentum indicator',
    defaultParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  },
  {
    type: 'EMA',
    label: 'Exponential Moving Average',
    description: 'Weighted moving average favoring recent prices',
    defaultParams: { period: 12 },
  },
  {
    type: 'SMA',
    label: 'Simple Moving Average',
    description: 'Standard moving average calculation',
    defaultParams: { period: 20 },
  },
  {
    type: 'Stochastic',
    label: 'Stochastic Oscillator',
    description: 'Compares closing price to price range',
    defaultParams: { period: 14, kSmooth: 3, dPeriod: 3 },
  },
  {
    type: 'ATR',
    label: 'Average True Range',
    description: 'Measures market volatility',
    defaultParams: { period: 14 },
  },
  {
    type: 'ADX',
    label: 'Average Directional Index',
    description: 'Measures trend strength',
    defaultParams: { period: 14 },
  },
  {
    type: 'CCI',
    label: 'Commodity Channel Index',
    description: 'Identifies cyclical trends',
    defaultParams: { period: 20, oversold: -100, overbought: 100 },
  },
  {
    type: 'Williams%R',
    label: "Williams %R",
    description: 'Momentum indicator showing price levels',
    defaultParams: { period: 14, oversold: -80, overbought: -20 },
  },
  {
    type: 'MFI',
    label: 'Money Flow Index',
    description: 'Volume-weighted momentum indicator',
    defaultParams: { period: 14, oversold: 20, overbought: 80 },
  },
];

interface ChooseIndicatorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChooseIndicatorsDialog({
  open,
  onOpenChange,
}: ChooseIndicatorsDialogProps) {
  const { indicators, addIndicator, deleteIndicator, updateIndicator } =
    useIndicators();
  const [selectedIndicators, setSelectedIndicators] = useState<Set<string>>(
    new Set(indicators.map((ind) => ind.indicator_type))
  );
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, Record<string, any>>>({});

  const toggleIndicator = (type: string) => {
    const newSelected = new Set(selectedIndicators);
    const existingIndicator = indicators.find((ind) => ind.indicator_type === type);

    if (newSelected.has(type)) {
      newSelected.delete(type);
      if (existingIndicator) {
        deleteIndicator.mutate(existingIndicator.id);
      }
    } else {
      newSelected.add(type);
      const config = AVAILABLE_INDICATORS.find((ind) => ind.type === type);
      if (config) {
        addIndicator.mutate({
          indicator_type: type,
          enabled: true,
          parameters: config.defaultParams,
          signal_conditions: {},
        });
      }
    }

    setSelectedIndicators(newSelected);
  };

  const handleParamChange = (
    indicatorType: string,
    paramName: string,
    value: string
  ) => {
    setParamValues((prev) => ({
      ...prev,
      [indicatorType]: {
        ...prev[indicatorType],
        [paramName]: isNaN(Number(value)) ? value : Number(value),
      },
    }));
  };

  const saveParameters = (indicatorType: string) => {
    const existingIndicator = indicators.find(
      (ind) => ind.indicator_type === indicatorType
    );
    if (existingIndicator && paramValues[indicatorType]) {
      const updatedParams = {
        ...existingIndicator.parameters,
        ...paramValues[indicatorType],
      };
      updateIndicator.mutate({
        id: existingIndicator.id,
        updates: {
          parameters: updatedParams,
        },
      });
      setExpandedIndicator(null);
    }
  };

  const isLoading =
    addIndicator.isPending ||
    deleteIndicator.isPending ||
    updateIndicator.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Choose Trading Indicators
          </DialogTitle>
          <DialogDescription>
            Select and configure technical indicators to power your trading
            signals. Each indicator can be customized with specific parameters.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {AVAILABLE_INDICATORS.map((indicator) => {
              const isSelected = selectedIndicators.has(indicator.type);
              const existingIndicator = indicators.find(
                (ind) => ind.indicator_type === indicator.type
              );

              return (
                <div
                  key={indicator.type}
                  className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={indicator.type}
                      checked={isSelected}
                      onCheckedChange={() => toggleIndicator(indicator.type)}
                      disabled={isLoading}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={indicator.type}
                        className="text-sm font-medium cursor-pointer block"
                      >
                        {indicator.label}
                      </label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {indicator.description}
                      </p>

                      {isSelected && existingIndicator && (
                        <div className="mt-3 space-y-2">
                          {expandedIndicator === indicator.type ? (
                            <>
                              <div className="bg-muted/50 p-2 rounded space-y-2 text-xs">
                                {Object.entries(
                                  existingIndicator.parameters || {}
                                ).map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-2">
                                    <Label className="min-w-20 capitalize">
                                      {key}:
                                    </Label>
                                    <Input
                                      type="number"
                                      value={
                                        paramValues[indicator.type]?.[key] ?? value
                                      }
                                      onChange={(e) =>
                                        handleParamChange(
                                          indicator.type,
                                          key,
                                          e.target.value
                                        )
                                      }
                                      className="h-7 text-xs flex-1"
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => saveParameters(indicator.type)}
                                  disabled={updateIndicator.isPending}
                                  className="h-7 text-xs"
                                >
                                  {updateIndicator.isPending && (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  )}
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setExpandedIndicator(null)}
                                  className="h-7 text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setExpandedIndicator(indicator.type)
                              }
                              className="h-6 text-xs"
                            >
                              Configure Parameters
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <Separator className="my-4" />

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {selectedIndicators.size} indicator{selectedIndicators.size !== 1 ? 's' : ''}{' '}
            selected
          </div>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
