import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useIBKR } from '@/hooks/useIBKR';
import { useTradingSettings } from '@/hooks/useTradingSettings';
import { 
  TrendingUp, 
  LogOut, 
  Settings, 
  Wifi, 
  WifiOff, 
  Power,
  PowerOff
} from 'lucide-react';

interface HeaderProps {
  onSettingsClick: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { isAuthenticated, accountId, authenticate, logout, checkSession } = useIBKR();
  const { settings } = useTradingSettings();

  const handleIBKRConnect = () => {
    if (isAuthenticated) {
      logout.mutate();
    } else {
      authenticate.mutate();
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Options Signal Trader</h1>
              <p className="text-sm text-muted-foreground">
                BB + VWAP Automated Trading
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Auto-trade status */}
            <div className="flex items-center gap-2">
              {settings?.auto_trade_enabled ? (
                <Badge variant="default" className="gap-1">
                  <Power className="h-3 w-3" />
                  Auto-Trade ON
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <PowerOff className="h-3 w-3" />
                  Auto-Trade OFF
                </Badge>
              )}
            </div>

            {/* IBKR Connection Status */}
            <Button
              variant={isAuthenticated ? 'outline' : 'default'}
              size="sm"
              onClick={handleIBKRConnect}
              disabled={authenticate.isPending || logout.isPending}
            >
              {isAuthenticated ? (
                <>
                  <Wifi className="h-4 w-4 mr-2 text-green-500" />
                  IBKR: {accountId || 'Connected'}
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 mr-2" />
                  Connect IBKR
                </>
              )}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={onSettingsClick}>
              <Settings className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
