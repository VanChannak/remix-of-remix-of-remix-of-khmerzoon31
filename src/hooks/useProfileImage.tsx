import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseProfileImageProps {
  imagePath: string | null | undefined;
  userId?: string;
}

export const useProfileImage = ({ imagePath, userId }: UseProfileImageProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSignedUrl = useCallback(async () => {
    if (!imagePath) {
      setSignedUrl(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // If it's already a full URL (legacy) or external URL, check what type
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      // Check if it's a Supabase storage URL - use directly
      if (imagePath.includes('supabase.co/storage')) {
        setSignedUrl(imagePath);
        setLoading(false);
        return;
      }

      // Check if it's an iDrive E2 URL (signed or not)
      if (imagePath.includes('idrivee2.com')) {
        // It's an iDrive URL - check if signed URL has expired
        // Extract the file path and fetch a fresh signed URL
        try {
          const urlObj = new URL(imagePath);
          const filePath = urlObj.pathname.replace(/^\//, '');
          
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            setSignedUrl(null);
            setLoading(false);
            return;
          }

          const response = await fetch(
            'https://zmdqloustkrtaeumkrau.supabase.co/functions/v1/get-signed-url',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ filePath, expiryHours: 24 }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.url) {
              setSignedUrl(data.url);
            } else {
              setSignedUrl(null);
            }
          } else {
            setSignedUrl(null);
          }
        } catch (error) {
          console.error('Failed to fetch signed URL:', error);
          setSignedUrl(null);
        } finally {
          setLoading(false);
        }
        return;
      }
      
      // External URL - use as-is
      setSignedUrl(imagePath);
      setLoading(false);
      return;
    }

    // It's a file path - fetch signed URL from iDrive
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSignedUrl(null);
        setLoading(false);
        return;
      }

      const response = await fetch(
        'https://zmdqloustkrtaeumkrau.supabase.co/functions/v1/get-signed-url',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filePath: imagePath, expiryHours: 24 }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.url) {
          setSignedUrl(data.url);
        } else {
          setSignedUrl(null);
        }
      } else {
        setSignedUrl(null);
      }
    } catch (error) {
      console.error('Failed to fetch signed URL:', error);
      setSignedUrl(null);
    } finally {
      setLoading(false);
    }
  }, [imagePath, userId]);

  useEffect(() => {
    fetchSignedUrl();
  }, [fetchSignedUrl]);

  return { signedUrl, loading, refetch: fetchSignedUrl };
};
