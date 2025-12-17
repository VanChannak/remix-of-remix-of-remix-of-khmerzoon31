import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWallet } from '@/hooks/useWallet';
import { format } from 'date-fns';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface TransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TransactionsDialog = ({ open, onOpenChange }: TransactionsDialogProps) => {
  const { transactions, loading } = useWallet();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaction History</DialogTitle>
          <DialogDescription>
            View your recent wallet transactions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {tx.transaction_type === 'topup' ? (
                    <ArrowDownCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowUpCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium capitalize">{tx.transaction_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.description || 'No description'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.transaction_type === 'topup' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.transaction_type === 'topup' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Balance: ${tx.balance_after.toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};