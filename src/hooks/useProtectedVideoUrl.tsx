import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VideoSourceData {
  id: string;
  url?: string;
  quality_urls?: Record<string, string>;
  source_type: string;
  server_name: string;
  quality?: string;
  is_default?: boolean;
}

interface ProtectedVideoResponse {
  success: boolean;
  source?: VideoSourceData;
  accessToken?: string;
  expiresAt?: string;
  error?: string;
  code?: string;
}

export const useProtectedVideoUrl = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProtectedUrl = useCallback(async (params: {
    sourceId: string;
    episodeId?: string;
    movieId?: string;
    mediaId?: string;
    mediaType?: 'movie' | 'series' | 'anime';
    accessType?: 'free' | 'rent' | 'vip';
    excludeFromPlan?: boolean;
  }): Promise<ProtectedVideoResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-protected-video-url', {
        body: params,
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        setError(data.error || 'Failed to get video URL');
        return data;
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getProtectedUrl, loading, error };
};
