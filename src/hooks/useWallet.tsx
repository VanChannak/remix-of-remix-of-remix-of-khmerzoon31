import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface WalletTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWallet();
      loadTransactions();
    }
  }, [user]);

  const loadWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const topupWallet = async (amount: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('topup-wallet', {
        body: { amount },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: 'Top-up Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const verifyTopup = async (transactionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-wallet-topup', {
        body: { transactionId },
      });

      if (error) throw error;

      if (data.success) {
        setBalance(data.newBalance);
        await loadTransactions();
        toast({
          title: 'Top-up Successful',
          description: `Your wallet has been credited with the amount.`,
        });
      }

      return data;
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const checkSufficientBalance = (amount: number): boolean => {
    return balance >= amount;
  };

  return {
    balance,
    transactions,
    loading,
    topupWallet,
    verifyTopup,
    checkSufficientBalance,
    refreshWallet: loadWallet,
    refreshTransactions: loadTransactions,
  };
};