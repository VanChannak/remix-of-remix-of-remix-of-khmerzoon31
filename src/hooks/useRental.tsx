import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useRental = (mediaId?: string, mediaType?: 'movie' | 'series' | 'anime') => {
  const { user } = useAuth();
  const [hasActiveRental, setHasActiveRental] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rental, setRental] = useState<any>(null);
  const [rentalMaxDevices, setRentalMaxDevices] = useState<number>(1);

  useEffect(() => {
    if (!user || !mediaId || !mediaType) {
      setHasActiveRental(false);
      setLoading(false);
      return;
    }

    const checkRental = async () => {
      try {
        const { data, error } = await supabase
          .from('user_rentals')
          .select('*')
          .eq('user_id', user.id)
          .eq('media_id', mediaId)
          .eq('media_type', mediaType)
          .eq('payment_status', 'completed')
          .gte('end_date', new Date().toISOString())
          .maybeSingle();

        if (!error && data) {
          setHasActiveRental(true);
          setRental(data);
          
          // Fetch the rental device limit from the media
          const table = mediaType === 'movie' ? 'movies' : mediaType === 'anime' ? 'animes' : 'series';
          const { data: mediaData } = await supabase
            .from(table)
            .select('rental_max_devices')
            .eq('id', mediaId)
            .maybeSingle();
          
          if (mediaData?.rental_max_devices) {
            setRentalMaxDevices(mediaData.rental_max_devices);
          }
        } else {
          setHasActiveRental(false);
          setRental(null);
        }
      } catch (error) {
        console.error('Error checking rental:', error);
        setHasActiveRental(false);
        setRental(null);
      } finally {
        setLoading(false);
      }
    };

    checkRental();
  }, [user, mediaId, mediaType]);

  return { hasActiveRental, loading, rental, rentalMaxDevices };
};
