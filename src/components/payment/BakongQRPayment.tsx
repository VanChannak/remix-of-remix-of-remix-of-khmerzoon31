import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BakongQRPaymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  qrData: any;
  amount: number;
  onSuccess: () => void;
  verificationType: "rental" | "subscription";
}

export const BakongQRPayment = ({
  open,
  onOpenChange,
  transactionId,
  qrData,
  amount,
  onSuccess,
  verificationType,
}: BakongQRPaymentProps) => {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const { toast } = useToast();

  const verifyPayment = async () => {
    setVerifying(true);
    try {
      const endpoint = verificationType === "rental" 
        ? "verify-rental-payment" 
        : "verify-subscription-payment";

      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { transactionId },
      });

      if (error) throw error;

      if (data.success) {
        setVerified(true);
        toast({
          title: "Payment Successful",
          description: "Your payment has been verified successfully.",
        });
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
        }, 2000);
      } else {
        toast({
          title: "Payment Pending",
          description: "Payment is still being processed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Verification Failed",
        description: "Failed to verify payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Bakong QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
            <div className="w-64 h-64 bg-white flex items-center justify-center rounded-lg mb-4">
              <div className="text-center p-4">
                <p className="text-xs text-muted-foreground mb-2">QR Code</p>
                <p className="text-sm font-mono break-all">{qrData?.qr_string}</p>
              </div>
            </div>
            <p className="text-2xl font-bold">${amount}</p>
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
              onClick={verifyPayment}
              disabled={verifying}
              className="w-full"
            >
              {verifying ? (
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
      </DialogContent>
    </Dialog>
  );
};
