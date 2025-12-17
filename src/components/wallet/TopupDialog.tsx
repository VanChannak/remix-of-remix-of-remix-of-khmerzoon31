import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { Loader2, CheckCircle } from 'lucide-react';

interface TopupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TopupDialog = ({ open, onOpenChange }: TopupDialogProps) => {
  const { topupWallet, verifyTopup } = useWallet();
  const [amount, setAmount] = useState('');
  const [qrData, setQrData] = useState<any>(null);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const presetAmounts = [10, 20, 50, 100];

  const handleTopup = async () => {
    const topupAmount = parseFloat(amount);
    if (!topupAmount || topupAmount <= 0) return;

    setLoading(true);
    try {
      const result = await topupWallet(topupAmount);
      setQrData(result.qrData);
      setTransactionId(result.transactionId);
    } catch (error) {
      console.error('Topup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await verifyTopup(transactionId);
      setVerified(true);
      setTimeout(() => {
        onOpenChange(false);
        setQrData(null);
        setAmount('');
        setVerified(false);
      }, 2000);
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setQrData(null);
    setAmount('');
    setVerified(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Top Up Wallet</DialogTitle>
          <DialogDescription>
            Add funds to your wallet using KHQR payment
          </DialogDescription>
        </DialogHeader>

        {!qrData ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="grid grid-cols-4 gap-2">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    onClick={() => setAmount(preset.toString())}
                    className="w-full"
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleTopup}
              disabled={!amount || loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Generate QR Code'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
              <div className="w-64 h-64 bg-white flex items-center justify-center rounded-lg mb-4">
                <div className="text-center p-4">
                  <p className="text-xs text-muted-foreground mb-2">QR Code</p>
                  <p className="text-sm font-mono break-all">{qrData?.qr_string}</p>
                </div>
              </div>
              <p className="text-2xl font-bold">${parseFloat(amount).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Transaction ID: {transactionId}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                1. Open your Bakong app<br />
                2. Scan the QR code above<br />
                3. Complete the payment<br />
                4. Click "Verify Payment" below
              </p>
            </div>

            {verified ? (
              <div className="flex items-center justify-center text-green-500 space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Payment Verified!</span>
              </div>
            ) : (
              <Button
                onClick={handleVerify}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Payment"
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};