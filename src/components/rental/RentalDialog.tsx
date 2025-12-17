import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { BakongQRPayment } from '@/components/payment/BakongQRPayment';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }).max(255),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).max(100),
});

interface RentalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  mediaId: string;
  mediaType: 'movie' | 'series' | 'anime';
  rentalPrice: number;
  rentalPeriodDays: number;
  onSuccess: () => void;
}

export const RentalDialog = ({
  open,
  onOpenChange,
  title,
  mediaId,
  mediaType,
  rentalPrice,
  rentalPeriodDays,
  onSuccess,
}: RentalDialogProps) => {
  const { user, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [qrData, setQrData] = useState<any>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.parse({ email, password });
      setLoading(true);
      
      const { error } = await signIn(validated.email, validated.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Successfully signed in!');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('An error occurred during sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.parse({ email, password });
      setLoading(true);
      
      const { error } = await signUp(validated.email, validated.password);
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Check your email to confirm your account!');
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('An error occurred during sign up');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRental = async () => {
    if (!user) return;

    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-rental-payment', {
        body: {
          mediaId,
          mediaType,
          rentalPrice,
          rentalPeriodDays,
        },
      });

      if (error) throw error;

      if (data.success) {
        setTransactionId(data.transactionId);
        setQrData(data.qrData);
        setShowPayment(true);
        toast.success('Payment initiated! Please scan the QR code.');
      }
    } catch (error) {
      console.error('Rental error:', error);
      toast.error('Failed to initiate rental. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Rental successful! Enjoy your content.');
    onSuccess();
    onOpenChange(false);
  };

  if (showPayment && transactionId && qrData) {
    return (
      <BakongQRPayment
        open={open}
        onOpenChange={onOpenChange}
        transactionId={transactionId}
        qrData={qrData}
        amount={rentalPrice}
        onSuccess={handlePaymentSuccess}
        verificationType="rental"
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rent Content</DialogTitle>
        </DialogHeader>

        {!user ? (
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold">{title}</h4>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rental Price:</span>
                <span className="text-lg font-bold">${rentalPrice}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rental Period:</span>
                <span className="text-lg font-bold">{rentalPeriodDays} days</span>
              </div>
            </div>

            <Button
              onClick={handleConfirmRental}
              className="w-full bg-red-500 hover:bg-red-600"
              disabled={processingPayment}
            >
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Confirm Rental
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
