import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSubscription = () => {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasActiveSubscription(false);
      setRemainingDays(null);
      setLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gte('end_date', new Date().toISOString())
          .single();

        if (!error && data) {
          setHasActiveSubscription(true);
          // Calculate remaining days
          const endDate = new Date(data.end_date);
          const today = new Date();
          const diffTime = endDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setRemainingDays(diffDays > 0 ? diffDays : 0);
        } else {
          setHasActiveSubscription(false);
          setRemainingDays(null);
        }
      } catch (error) {
        setHasActiveSubscription(false);
        setRemainingDays(null);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  return { hasActiveSubscription, remainingDays, loading };
};
