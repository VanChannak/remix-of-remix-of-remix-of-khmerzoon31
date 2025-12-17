import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Plus, History } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useState } from 'react';
import { TopupDialog } from './TopupDialog';
import { TransactionsDialog } from './TransactionsDialog';

export const WalletCard = () => {
  const { balance, loading } = useWallet();
  const [showTopup, setShowTopup] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle>Wallet Balance</CardTitle>
            </div>
          </div>
          <CardDescription>Use your balance for subscriptions and rentals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-4xl font-bold text-primary">
            {loading ? '...' : `$${balance.toFixed(2)}`}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowTopup(true)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Top Up
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowTransactions(true)}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>
        </CardContent>
      </Card>

      <TopupDialog open={showTopup} onOpenChange={setShowTopup} />
      <TransactionsDialog open={showTransactions} onOpenChange={setShowTransactions} />
    </>
  );
};