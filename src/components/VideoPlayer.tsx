import { ShakaPlayer } from "./ShakaPlayer";
import { MobileVideoPlayer } from "./player/MobileVideoPlayer";
import { Database } from "@/integrations/supabase/types";
import { useNativeMobile } from "@/hooks/useNativeMobile";
import { useProtectedVideoUrl } from "@/hooks/useProtectedVideoUrl";
import { useSubscription } from "@/hooks/useSubscription";
import { useRental } from "@/hooks/useRental";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";

type VideoSourceDB = Database['public']['Tables']['video_sources']['Row'];

interface VideoSource {
  id: string;
  url?: string;
  quality?: string;
  is_default?: boolean;
  server_name: string;
  source_type?: string;
  quality_urls?: Record<string, string> | null;
}

interface Episode {
  id: string;
  episode_number: number;
  name: string;
  still_path?: string;
  access?: 'free' | 'rent' | 'vip';
}

interface VideoPlayerProps {
  videoSources: VideoSourceDB[];
  onEpisodeSelect?: (episodeId: string) => void;
  episodes?: Episode[];
  currentEpisodeId?: string;
  contentBackdrop?: string;
  // Access control props
  accessType?: 'free' | 'rent' | 'vip';
  excludeFromPlan?: boolean;
  rentalPrice?: number;
  rentalPeriodDays?: number;
  mediaId?: string;
  mediaType?: 'movie' | 'series' | 'anime';
  title?: string;
  movieId?: string;
  onMinimize?: () => void;
  trailerUrl?: string;
}

const VideoPlayer = ({ 
  videoSources, 
  onEpisodeSelect, 
  episodes,
  currentEpisodeId,
  contentBackdrop,
  accessType,
  excludeFromPlan,
  rentalPrice,
  rentalPeriodDays,
  mediaId,
  mediaType,
  title,
  movieId,
  onMinimize,
  trailerUrl,
}: VideoPlayerProps) => {
  const { isNative, isAndroid } = useNativeMobile();
  const { getProtectedUrl, loading: protectedUrlLoading } = useProtectedVideoUrl();
  const { hasActiveSubscription } = useSubscription();
  
  const rentalCheckId = currentEpisodeId ? mediaId : movieId;
  const rentalCheckType = currentEpisodeId ? 'series' : movieId ? 'movie' : undefined;
  const { hasActiveRental } = useRental(rentalCheckId, rentalCheckType);
  
  const currentEpisode = episodes?.find(ep => ep.id === currentEpisodeId);
  
  // Use episode-level access if available, otherwise fall back to content-level access
  const effectiveAccessType = currentEpisode?.access || accessType;
  
  // State for mobile player video URL
  const [mobileVideoUrl, setMobileVideoUrl] = useState<string | null>(null);
  const [mobileSourceType, setMobileSourceType] = useState<"mp4" | "hls" | "dash">("hls");
  const [isLoadingMobileUrl, setIsLoadingMobileUrl] = useState(false);
  
  // Track the last fetched episode/source to prevent duplicate fetches
  const lastFetchedRef = useRef<string | null>(null);
  const prevEpisodeIdRef = useRef<string | undefined>(currentEpisodeId);
  const prevSourcesRef = useRef<string | null>(null);

  // Convert DB types to component types
  const convertedSources: VideoSource[] = useMemo(() => 
    videoSources.map(source => ({
      id: source.id,
      url: source.url,
      quality: source.quality,
      is_default: source.is_default,
      server_name: source.server_name,
      source_type: source.source_type,
      quality_urls: source.quality_urls as Record<string, string> | null
    })), [videoSources]);
  
  // Convert episodes to player format
  const playerEpisodes = useMemo(() => 
    episodes?.map(ep => ({
      id: ep.id,
      episode_number: ep.episode_number,
      title: ep.name,
      thumbnail_url: ep.still_path,
    })) || [], [episodes]);

  const handleEpisodeSelect = useCallback((episode: { id: string; episode_number: number }) => {
    if (onEpisodeSelect) {
      console.log('[VideoPlayer] Episode selected:', episode.id);
      // Reset state for smooth transition - clear the cached fetch key
      lastFetchedRef.current = null;
      setMobileVideoUrl(null);
      setIsLoadingMobileUrl(true);
      onEpisodeSelect(episode.id);
    }
  }, [onEpisodeSelect]);

  // Check if user has access to content
  const hasAccess = useMemo(() => {
    if (effectiveAccessType === 'free') return true;
    if (effectiveAccessType === 'rent' && excludeFromPlan) {
      return hasActiveRental;
    }
    if (effectiveAccessType === 'rent' && !excludeFromPlan) {
      return hasActiveSubscription || hasActiveRental;
    }
    if (effectiveAccessType === 'vip') {
      return hasActiveSubscription;
    }
    return false;
  }, [effectiveAccessType, excludeFromPlan, hasActiveSubscription, hasActiveRental]);

  // Reset loading state when episode changes or sources change
  useEffect(() => {
    const currentSourcesKey = convertedSources.map(s => s.id).join('-');
    const episodeChanged = prevEpisodeIdRef.current !== currentEpisodeId;
    const sourcesChanged = prevSourcesRef.current !== null && prevSourcesRef.current !== currentSourcesKey;
    
    if (episodeChanged || sourcesChanged) {
      prevEpisodeIdRef.current = currentEpisodeId;
      prevSourcesRef.current = currentSourcesKey;
      
      // Reset fetched ref to force re-fetch with new sources
      if (sourcesChanged) {
        lastFetchedRef.current = null;
      }
      
      // Set loading state for transition
      setMobileVideoUrl(null);
      setIsLoadingMobileUrl(true);
    }
  }, [currentEpisodeId, convertedSources]);

  // For native Android, get the video URL for mobile player
  useEffect(() => {
    if (!isNative || !isAndroid) {
      return;
    }

    if (!hasAccess) {
      setMobileVideoUrl(null);
      setIsLoadingMobileUrl(false);
      return;
    }

    // Create a unique key for this fetch to prevent duplicates
    const defaultSource = convertedSources.find(s => s.is_default) || convertedSources[0];
    const fetchKey = `${currentEpisodeId || movieId}-${defaultSource?.id || 'none'}`;
    
    console.log('[VideoPlayer] Checking fetch for native Android:', {
      fetchKey,
      lastFetched: lastFetchedRef.current,
      hasMobileUrl: !!mobileVideoUrl,
      sourcesCount: convertedSources.length,
    });
    
    // Skip if we already fetched for this exact combination
    if (lastFetchedRef.current === fetchKey && mobileVideoUrl) {
      console.log('[VideoPlayer] Skipping fetch - already have URL for this source');
      setIsLoadingMobileUrl(false);
      return;
    }

    const fetchVideoUrl = async () => {
      setIsLoadingMobileUrl(true);
      
      if (!defaultSource) {
        setMobileVideoUrl(null);
        setIsLoadingMobileUrl(false);
        return;
      }

      // Determine source type
      const sourceType = (defaultSource.source_type || "").toLowerCase();
      if (sourceType === "hls" || sourceType === "m3u8") {
        setMobileSourceType("hls");
      } else if (sourceType === "dash") {
        setMobileSourceType("dash");
      } else if (sourceType === "mp4") {
        setMobileSourceType("mp4");
      } else {
        setMobileSourceType("hls");
      }

      // For free content, use URL directly
      if (effectiveAccessType === 'free') {
        console.log('[VideoPlayer] Free content - using URL directly:', {
          hasUrl: !!defaultSource.url,
          hasQualityUrls: !!defaultSource.quality_urls,
        });
        
        if (defaultSource.url) {
          setMobileVideoUrl(defaultSource.url);
          lastFetchedRef.current = fetchKey;
        } else if (defaultSource.quality_urls) {
          const firstUrl = Object.values(defaultSource.quality_urls)[0];
          setMobileVideoUrl(firstUrl || null);
          lastFetchedRef.current = fetchKey;
        } else {
          console.warn('[VideoPlayer] No URL found in free source');
          setMobileVideoUrl(null);
        }
        setIsLoadingMobileUrl(false);
        return;
      }

      // For paid content, get protected URL
      try {
        console.log('[VideoPlayer] Fetching protected URL for native Android:', {
          sourceId: defaultSource.id,
          episodeId: currentEpisodeId,
          movieId: movieId,
        });
        
        const response = await getProtectedUrl({
          sourceId: defaultSource.id,
          episodeId: currentEpisodeId,
          movieId: movieId,
          mediaId: mediaId,
          mediaType: mediaType,
          accessType: effectiveAccessType,
          excludeFromPlan: excludeFromPlan,
        });
        
        if (response?.success && response.source?.url) {
          console.log('[VideoPlayer] Protected URL fetched successfully');
          setMobileVideoUrl(response.source.url);
          lastFetchedRef.current = fetchKey;
        } else if (response?.source?.quality_urls) {
          const firstUrl = Object.values(response.source.quality_urls)[0];
          setMobileVideoUrl(firstUrl || null);
          lastFetchedRef.current = fetchKey;
        } else {
          console.error('[VideoPlayer] Failed to get protected URL:', response?.error);
          setMobileVideoUrl(null);
        }
      } catch (error) {
        console.error('[VideoPlayer] Error fetching protected URL:', error);
        setMobileVideoUrl(null);
      } finally {
        setIsLoadingMobileUrl(false);
      }
    };

    fetchVideoUrl();
  }, [isNative, isAndroid, hasAccess, convertedSources, effectiveAccessType, currentEpisodeId, movieId, mediaId, mediaType, excludeFromPlan, getProtectedUrl]);

  // Use mobile player for native Android apps - always use MobileVideoPlayer when available
  if (isNative && isAndroid) {
    // If we have a video URL, use MobileVideoPlayer
    if (mobileVideoUrl) {
      return (
        <MobileVideoPlayer
          key={`mobile-${currentEpisodeId || movieId}-${mobileVideoUrl.substring(0, 50)}`} // Force remount on episode/URL change
          videoUrl={mobileVideoUrl}
          poster={contentBackdrop || currentEpisode?.still_path}
          autoplay={false}
          onBack={onMinimize}
          title={title}
          sourceType={mobileSourceType}
          episodes={playerEpisodes}
          currentEpisodeId={currentEpisodeId}
          onEpisodeSelect={handleEpisodeSelect}
          seriesBackdrop={contentBackdrop}
        />
      );
    }
    
    // If still loading, show a loading state for Android native
    if (isLoadingMobileUrl || protectedUrlLoading) {
      return (
        <div className="relative w-full aspect-video bg-black flex items-center justify-center native-portrait-safe">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      );
    }
    
    // If no URL and not loading, fall back to ShakaPlayer
    // This handles cases where the source is iframe/embed type
  }
  
  // Use ShakaPlayer for web and non-Android platforms
  return (
    <div className="relative w-full aspect-video overflow-hidden">
      <ShakaPlayer 
        key={currentEpisodeId || movieId} // Force remount on episode change for smooth loading
        videoSources={convertedSources as any}
        poster={contentBackdrop || currentEpisode?.still_path}
        autoplay={false}
        className="w-full h-full"
        episodeId={currentEpisodeId}
        movieId={movieId}
        accessType={effectiveAccessType}
        excludeFromPlan={excludeFromPlan}
        rentalPrice={rentalPrice}
        rentalPeriodDays={rentalPeriodDays}
        mediaId={mediaId}
        mediaType={mediaType}
        title={title}
      />
    </div>
  );
};

export default VideoPlayer;
