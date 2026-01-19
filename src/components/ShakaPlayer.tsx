import { useEffect, useMemo, useRef, useState, useCallback } from "react";
// @ts-ignore - shaka-player types
import shaka from "shaka-player";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { VideoAdPlayer } from "@/components/ads/VideoAdPlayer";
import { OverlayAd } from "@/components/ads/OverlayAd";
import { RentalDialog } from "@/components/rental/RentalDialog";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useDeviceSession } from "@/hooks/useDeviceSession";
import { useProtectedVideoUrl } from "@/hooks/useProtectedVideoUrl";
import { useRental } from "@/hooks/useRental";
import { useNativeMobile } from "@/hooks/useNativeMobile";
import { useScreenOrientation } from "@/hooks/useScreenOrientation";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  List,
  Film,
  Video as VideoIcon,
  Monitor,
  Server as ServerIcon,
  Smartphone,
  PictureInPicture,
  Lock,
  Crown,
  DollarSign
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { VideoSettingsMenu } from "@/components/VideoSettingsMenu";

interface VideoSource {
  id: string;
  server_name: string;
  source_type: string;
  type?: "mp4" | "hls" | "dash" | "embed" | "iframe";
  url?: string;
  quality_urls?: Record<string, string>;
  quality?: string;
  is_default?: boolean;
  version?: string;
  permission?: string;
}

interface ShakaPlayerProps {
  videoSources?: VideoSource[];
  src?: string; // For backward compatibility
  poster?: string;
  autoplay?: boolean;
  className?: string;
  type?: "mp4" | "hls" | "dash" | "embed" | "iframe"; // For backward compatibility
  episodeId?: string;
  movieId?: string;
  onEnded?: () => void;
  accessType?: 'free' | 'rent' | 'vip';
  excludeFromPlan?: boolean;
  rentalPrice?: number;
  title?: string;
  mediaId?: string;
  mediaType?: 'movie' | 'series' | 'anime';
  rentalPeriodDays?: number;
}

// Helpers
const normalizeType = (rawType?: string, url?: string): "mp4" | "hls" | "dash" | "embed" | "iframe" => {
  const t = (rawType || "").toString().toLowerCase().trim();
  if (t === "iframe" || t === "embed") return "iframe";
  if (t === "mp4") return "mp4";
  if (t === "hls" || t === "m3u8") return "hls";
  if (t === "dash") return "dash";
  const u = (url || "").toLowerCase();
  if (u.endsWith(".m3u8")) return "hls";
  if (u.endsWith(".mpd")) return "dash";
  if (u.endsWith(".mp4")) return "mp4";
  if (u.includes("youtube.com") || u.includes("youtu.be") || u.includes("player.") || u.includes("embed")) return "iframe";
  return "hls";
};

const findMatchingQualityKey = (keys: string[], desired?: string) => {
  if (!desired) return undefined;
  const desiredNum = desired.replace(/[^0-9]/g, "");
  return keys.find(k => k.replace(/[^0-9]/g, "") === desiredNum);
};

const getMp4Url = (mp4Urls: Record<string,string>, quality: string) => {
  if (mp4Urls[quality]) return mp4Urls[quality];
  const matchKey = findMatchingQualityKey(Object.keys(mp4Urls), quality);
  if (matchKey && mp4Urls[matchKey]) return mp4Urls[matchKey];
  const stripped = quality.replace(/p$/i, "");
  if (mp4Urls[stripped]) return mp4Urls[stripped];
  return undefined;
};

// Select optimal quality based on bandwidth
const selectOptimalQuality = (tracks: any[], bandwidth: number) => {
  if (!tracks || tracks.length === 0) return null;
  
  // Convert bandwidth to Mbps for easier comparison
  const bandwidthMbps = bandwidth / 1000000;
  
  // Quality thresholds (in Mbps) - conservative estimates
  // 1080p needs ~5 Mbps, 720p needs ~2.5 Mbps, 480p needs ~1 Mbps
  let targetHeight: number;
  
  if (bandwidthMbps >= 5) {
    targetHeight = 1080;
  } else if (bandwidthMbps >= 2.5) {
    targetHeight = 720;
  } else if (bandwidthMbps >= 1) {
    targetHeight = 480;
  } else {
    targetHeight = 360;
  }
  
  // Find the track closest to target height (but not exceeding it too much)
  const sortedTracks = tracks
    .filter((t: any) => t.height <= targetHeight * 1.2) // Allow 20% over target
    .sort((a: any, b: any) => b.height - a.height);
  
  return sortedTracks[0] || tracks[tracks.length - 1]; // Fallback to lowest quality
};

// Detect network bandwidth
const detectBandwidth = async (): Promise<number> => {
  try {
    // Use Navigator Connection API if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection && connection.downlink) {
      // downlink is in Mbps, convert to bps
      return connection.downlink * 1000000;
    }
    
    // Fallback: simple image download test
    const imageUrl = 'https://via.placeholder.com/1000x1000.jpg';
    const startTime = performance.now();
    
    const response = await fetch(imageUrl, { cache: 'no-cache' });
    const blob = await response.blob();
    
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    const sizeInBits = blob.size * 8;
    const bandwidth = sizeInBits / duration; // bits per second
    
    return bandwidth;
  } catch (error) {
    console.warn('Bandwidth detection failed, using default:', error);
    return 5000000; // Default to 5 Mbps
  }
};

export const ShakaPlayer = ({ 
  videoSources,
  src,
  poster, 
  autoplay = false,
  className = "",
  type = "hls",
  episodeId,
  movieId,
  onEnded,
  accessType = 'free',
  excludeFromPlan = false,
  rentalPrice,
  title = "",
  mediaId,
  mediaType,
  rentalPeriodDays = 7
}: ShakaPlayerProps) => {
  const { user } = useAuth();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const { getProtectedUrl, loading: protectedUrlLoading } = useProtectedVideoUrl();
  const { isNative, isAndroid } = useNativeMobile();
  const { lockLandscape, lockPortrait } = useScreenOrientation();
  
  // For episodes, check rental against the series (mediaId), not the episode
  // For movies, check against the movie (movieId)
  const rentalCheckId = episodeId ? mediaId : movieId;
  const rentalCheckType = episodeId ? 'series' : movieId ? 'movie' : undefined;
  
  const { hasActiveRental, loading: rentalLoading, rentalMaxDevices } = useRental(
    rentalCheckId,
    rentalCheckType
  );
  
  // Use rental device limit when rental is active, otherwise use subscription limit
  const effectiveDeviceLimit = hasActiveRental ? rentalMaxDevices : undefined;
  const { canStream, loading: deviceLoading, maxDevices, sessions } = useDeviceSession(effectiveDeviceLimit);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentSource, setCurrentSource] = useState<VideoSource | null>(null);
  const [currentQuality, setCurrentQuality] = useState<string>("720p");
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [availableAudioTracks, setAvailableAudioTracks] = useState<any[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<number | null>(null);
  const [availableTextTracks, setAvailableTextTracks] = useState<any[]>([]);
  const [currentTextTrack, setCurrentTextTrack] = useState<string>("off");
  
  // Protected video state - actual URLs only fetched after validation
  const [protectedSource, setProtectedSource] = useState<VideoSource | null>(null);
  const [accessValidated, setAccessValidated] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [estimatedBandwidth, setEstimatedBandwidth] = useState<number | null>(null);
  const [autoQualityEnabled, setAutoQualityEnabled] = useState(true);
  const [savedProgress, setSavedProgress] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ad state
  const [showPreRollAd, setShowPreRollAd] = useState(true);
  const [showOverlayAd, setShowOverlayAd] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);
  
  // Rental dialog state
  const [showRentalDialog, setShowRentalDialog] = useState(false);
  
  // Additional settings
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [stableVolume, setStableVolume] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number>(0); // in minutes, 0 = off
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bandwidthCheckRef = useRef<NodeJS.Timeout | null>(null);
  const progressTrackingRef = useRef<NodeJS.Timeout | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if content is locked
  const isLocked = useMemo(() => {
    if (subscriptionLoading || rentalLoading || accessType === 'free') return false;
    
    if (accessType === 'rent' && excludeFromPlan) {
      // Rent with exclude: everyone needs to pay (unless they have active rental)
      return !hasActiveRental;
    }
    
    if (accessType === 'rent' && !excludeFromPlan) {
      // Rent without exclude: only non-VIP needs to pay (unless they have active rental)
      return !hasActiveSubscription && !hasActiveRental;
    }
    
    if (accessType === 'vip') {
      // VIP content: only VIP members can watch
      return !hasActiveSubscription;
    }
    
    return false;
  }, [accessType, excludeFromPlan, hasActiveSubscription, hasActiveRental, subscriptionLoading, rentalLoading]);

  const handleRentClick = () => {
    setShowRentalDialog(true);
  };
  
  const handleRentalSuccess = () => {
    // Reload the page to refresh rental status
    window.location.reload();
  };

  // Normalize source data - ONLY include URLs for FREE content
  // For paid content, URLs are fetched through the protected edge function
  const sources = useMemo(() => {
    const rawSources = videoSources || (src ? [{
      id: "default",
      server_name: "Default",
      source_type: type,
      url: src,
      is_default: true
    }] : []);

    const isFreeContent = accessType === 'free';
    console.log('Access type:', accessType, '| Is free content:', isFreeContent);

    return rawSources.map((source, index) => {
      const sourceType = normalizeType(source.source_type, source.url);
      
      // Handle both quality_urls and mp4Urls fields (for backward compatibility)
      let qualityUrls = source.quality_urls || (source as any).mp4Urls;
      
      if (qualityUrls && typeof qualityUrls === 'object' && !Array.isArray(qualityUrls)) {
        if (Object.keys(qualityUrls).length === 0 || qualityUrls._type === 'undefined') {
          qualityUrls = undefined;
        }
      } else {
        qualityUrls = undefined;
      }
      
      // PROTECTION: Only include URLs for FREE content
      // For paid content, URLs are hidden until server validates access
      return {
        id: source.id || `server-${index}`,
        server_name: source.server_name || `Server ${index + 1}`,
        source_type: source.source_type || sourceType,
        type: sourceType,
        url: isFreeContent ? source.url : undefined, // Hide URL for paid content
        quality_urls: isFreeContent ? qualityUrls : undefined, // Hide URLs for paid content
        quality: source.quality,
        is_default: source.is_default,
        version: source.version,
        permission: source.permission,
      };
    });
  }, [videoSources, src, type, accessType]);

  // Detect bandwidth on mount
  useEffect(() => {
    const checkBandwidth = async () => {
      const bandwidth = await detectBandwidth();
      setEstimatedBandwidth(bandwidth);
      console.log(`Detected bandwidth: ${(bandwidth / 1000000).toFixed(2)} Mbps`);
    };
    
    checkBandwidth();
    
    // Periodically check bandwidth (every 30 seconds)
    bandwidthCheckRef.current = setInterval(checkBandwidth, 30000);
    
    return () => {
      if (bandwidthCheckRef.current) {
        clearInterval(bandwidthCheckRef.current);
      }
    };
  }, []);

  // Get user ID and load saved progress
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      
      if (user && (episodeId || movieId)) {
        // Load saved progress
        const { data } = await supabase
          .from('watch_history')
          .select('progress, duration, completed')
          .eq('user_id', user.id)
          .eq(episodeId ? 'episode_id' : 'movie_id', episodeId || movieId)
          .maybeSingle();
        
        if (data && !data.completed && data.progress > 10) {
          setSavedProgress(data.progress);
        }
      }
    };
    
    getUser();
  }, [episodeId, movieId]);

  // Track and save progress
  useEffect(() => {
    if (!userId || (!episodeId && !movieId) || !videoRef.current) return;
    
    const saveProgress = async () => {
      const video = videoRef.current;
      if (!video || !video.duration || isNaN(video.duration)) return;
      
      const progress = video.currentTime;
      const duration = video.duration;
      const completed = (duration - progress) < 30; // Mark completed if within 30 seconds of end
      
      const { data: existing } = await supabase
        .from('watch_history')
        .select('id')
        .eq('user_id', userId)
        .eq(episodeId ? 'episode_id' : 'movie_id', episodeId || movieId)
        .maybeSingle();
      
      if (existing) {
        await supabase
          .from('watch_history')
          .update({
            progress,
            duration,
            completed,
            last_watched_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('watch_history')
          .insert({
            user_id: userId,
            episode_id: episodeId || null,
            movie_id: movieId || null,
            progress,
            duration,
            completed,
          });
      }
    };
    
    // Save progress every 10 seconds
    progressTrackingRef.current = setInterval(saveProgress, 10000);
    
    return () => {
      if (progressTrackingRef.current) {
        clearInterval(progressTrackingRef.current);
        saveProgress(); // Save one last time on unmount
      }
    };
  }, [userId, episodeId, movieId]);

  // Resume from saved progress
  useEffect(() => {
    if (savedProgress !== null && videoRef.current && videoRef.current.readyState >= 2) {
      videoRef.current.currentTime = savedProgress;
      setSavedProgress(null);
    }
  }, [savedProgress, currentSource]);

  // Initialize default source (metadata only for paid content)
  useEffect(() => {
    if (sources && sources.length > 0) {
      setIsLoading(true);
      setAccessValidated(false);
      setAccessError(null);
      setProtectedSource(null);
      
      const defaultSource = sources.find(s => s.is_default) || sources[0];
      setCurrentSource(defaultSource);
      
      // Set initial quality for MP4 (if URLs are available - free content)
      if (defaultSource.type === "mp4" && defaultSource.quality_urls) {
        if (typeof defaultSource.quality_urls === 'object' && Object.keys(defaultSource.quality_urls).length > 0) {
          const qualities = Object.keys(defaultSource.quality_urls).sort((a, b) => {
            const aNum = parseInt(a.replace(/\D/g, ''));
            const bNum = parseInt(b.replace(/\D/g, ''));
            return bNum - aNum;
          });
          setAvailableQualities(qualities);
          
          let initialQuality = "720p";
          if (defaultSource.quality && qualities.includes(defaultSource.quality)) {
            initialQuality = defaultSource.quality;
          } else if (qualities.includes("720p")) {
            initialQuality = "720p";
          } else if (qualities.length > 0) {
            initialQuality = qualities[Math.floor(qualities.length / 2)] || qualities[0];
          }
          setCurrentQuality(initialQuality);
        }
      }
    }
  }, [sources, episodeId, movieId]);

  // Fetch protected video URL for non-free content
  const fetchProtectedSource = useCallback(async (source: VideoSource) => {
    if (!source || !user) {
      setAccessError('Please log in to watch this content');
      return;
    }

    console.log('Fetching protected URL for source:', source.id);
    setIsLoading(true);
    setAccessError(null);

    const result = await getProtectedUrl({
      sourceId: source.id,
      episodeId: episodeId,
      movieId: movieId,
      mediaId: mediaId,
      mediaType: mediaType,
      accessType: accessType,
      excludeFromPlan: excludeFromPlan,
    });

    if (result?.success && result.source) {
      console.log('Protected URL fetched successfully');
      const sourceType = normalizeType(result.source.source_type, result.source.url);
      
      const validatedSource: VideoSource = {
        id: result.source.id,
        server_name: result.source.server_name,
        source_type: result.source.source_type,
        type: sourceType,
        url: result.source.url,
        quality_urls: result.source.quality_urls,
        quality: result.source.quality,
        is_default: result.source.is_default,
      };
      
      setProtectedSource(validatedSource);
      setAccessValidated(true);
      
      // Set qualities for MP4
      if (sourceType === "mp4" && result.source.quality_urls) {
        const qualities = Object.keys(result.source.quality_urls).sort((a, b) => {
          const aNum = parseInt(a.replace(/\D/g, ''));
          const bNum = parseInt(b.replace(/\D/g, ''));
          return bNum - aNum;
        });
        setAvailableQualities(qualities);
        
        if (!qualities.includes(currentQuality)) {
          setCurrentQuality(qualities[0] || "720p");
        }
      }
    } else {
      console.error('Failed to fetch protected URL:', result?.error);
      setAccessError(result?.error || 'Failed to load video');
      setAccessValidated(false);
    }
  }, [user, episodeId, movieId, mediaId, mediaType, accessType, excludeFromPlan, getProtectedUrl, currentQuality]);

  // Trigger protected URL fetch when current source changes and content is not free
  useEffect(() => {
    // Wait for loading states to complete before fetching
    if (subscriptionLoading || rentalLoading) {
      console.log('Waiting for subscription/rental status to load...');
      return;
    }
    
    const isFreeContent = accessType === 'free';
    
    if (currentSource && !isFreeContent && !isLocked && user) {
      // Non-free content that user has access to - fetch protected URL
      fetchProtectedSource(currentSource);
    } else if (currentSource && isFreeContent) {
      // Free content - URLs already available, mark as validated
      setAccessValidated(true);
      setProtectedSource(currentSource);
    } else if (currentSource && isLocked) {
      // Content is locked - don't fetch, just show lock overlay
      console.log('Content is locked, not fetching protected URL');
      setIsLoading(false);
    }
  }, [currentSource, accessType, isLocked, user, fetchProtectedSource, subscriptionLoading, rentalLoading]);

  // Cleanup function
  const cleanupPlayer = async () => {
    setIsLoading(true); // Show loading during cleanup
    
    // Stop any ongoing playback first
    if (videoRef.current && !videoRef.current.paused) {
      try {
        videoRef.current.pause();
      } catch (e) {
        console.error("Error pausing video:", e);
      }
    }

    if (playerRef.current) {
      try {
        await playerRef.current.unload();
        await playerRef.current.detach();
        await playerRef.current.destroy();
      } catch (e) {
        console.error("Error destroying player:", e);
      } finally {
        playerRef.current = null;
      }
    }

    if (videoRef.current) {
      try {
        // Remove all event listeners and reset
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
        
        // Small delay to ensure cleanup completes
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (e) {
        console.error("Error resetting video:", e);
      }
    }
  };

  // Initialize player based on source type - ONLY when access is validated
  useEffect(() => {
    // Don't initialize until we have a validated source with URLs
    if (!protectedSource || !accessValidated) {
      console.log('Waiting for validated source...', { protectedSource: !!protectedSource, accessValidated });
      return;
    }

    // Don't initialize if locked
    if (isLocked) {
      setIsLoading(false);
      return;
    }

    const initPlayer = async () => {
      // Always cleanup when switching sources
      await cleanupPlayer();

      if (protectedSource.type === "embed" || protectedSource.type === "iframe") {
        // Embed/iframe sources use iframe, no video element needed
        setIsLoading(false);
        return;
      }

      if (!videoRef.current) return;

      if (protectedSource.type === "mp4") {
        // MP4: Use native HTML5 video player
        let qualityUrl = protectedSource.url;
        
        if (protectedSource.quality_urls && Object.keys(protectedSource.quality_urls).length > 0) {
          // Set available qualities for MP4 sources
          const qualities = Object.keys(protectedSource.quality_urls).sort((a, b) => {
            const aNum = parseInt(a.replace(/\D/g, ''));
            const bNum = parseInt(b.replace(/\D/g, ''));
            return bNum - aNum;
          });
          setAvailableQualities(qualities);
          
          // Get URL from quality_urls based on currentQuality
          qualityUrl = getMp4Url(protectedSource.quality_urls, currentQuality);
          
          // Fallback to first available quality if current quality not found
          if (!qualityUrl) {
            const availableUrls = Object.values(protectedSource.quality_urls);
            qualityUrl = availableUrls[0];
          }
        } else {
          setAvailableQualities([]);
        }
        
        if (!qualityUrl) {
          console.error("No valid MP4 URL found for source", protectedSource);
          setIsLoading(false);
          return;
        }
        
        console.log(`Loading MP4: ${protectedSource.server_name || 'Unknown'} at ${currentQuality}`);
        
        // Force reload the video with new source
        try {
          videoRef.current.src = qualityUrl;
          videoRef.current.load();
          
          // Set loading to false when video can play
          const onCanPlay = () => {
            setIsLoading(false);
            videoRef.current?.removeEventListener('canplay', onCanPlay);
          };
          videoRef.current.addEventListener('canplay', onCanPlay, { once: true });
          
          if (autoplay) {
            setTimeout(() => {
              videoRef.current?.play().catch(e => console.error("Autoplay failed:", e));
            }, 100);
          }
        } catch (error) {
          console.error("Error loading MP4:", error);
          setIsLoading(false);
        }
      } else if (protectedSource.type === "hls" || protectedSource.type === "dash") {
        // HLS/DASH: Use Shaka Player with polyfills and native fallback for HLS
        try {
          shaka.polyfill.installAll();
        } catch (e) {
          console.warn("Shaka polyfill install error", e);
        }

        const fallbackToNativeHls = () => {
          if (protectedSource.type === "hls" && videoRef.current && protectedSource.url) {
            console.warn("Falling back to native HLS");
            videoRef.current.src = protectedSource.url;
            setAvailableQualities([]);
            if (autoplay) {
              videoRef.current.play().catch(console.error);
            }
          }
        };

        if (!shaka.Player.isBrowserSupported()) {
          console.error("Shaka: Browser not supported. Trying native HLS.");
          fallbackToNativeHls();
          return;
        }

        const player = new shaka.Player();
        await player.attach(videoRef.current);
        playerRef.current = player;

        // Configure player with bandwidth-based ABR
        player.configure({
          streaming: {
            bufferingGoal: 30,
            rebufferingGoal: 2,
            bufferBehind: 30,
          },
          abr: {
            enabled: autoQualityEnabled,
            defaultBandwidthEstimate: estimatedBandwidth || 5000000,
          },
        });

        // Monitor bandwidth changes
        player.addEventListener('adaptation', () => {
          if (playerRef.current) {
            const stats = playerRef.current.getStats();
            if (stats.estimatedBandwidth) {
              setEstimatedBandwidth(stats.estimatedBandwidth);
            }
          }
        });

        // Load the stream
        try {
          if (!protectedSource.url) {
            console.error("No URL for HLS/DASH source");
            setIsLoading(false);
            return;
          }
          
          console.log(`Loading ${protectedSource.type.toUpperCase()}: ${protectedSource.server_name}`);
          await player.load(protectedSource.url);

          // Get available qualities for HLS/DASH
          const tracks = player.getVariantTracks();
          const qualities = [...new Set(tracks.map((t: any) => `${t.height}p`))];
          const sortedQualities = qualities.sort((a: string, b: string) =>
            parseInt(b) - parseInt(a)
          ) as string[];
          setAvailableQualities(sortedQualities);

          // Get available audio tracks
          const audioTracks = player.getAudioLanguagesAndRoles();
          setAvailableAudioTracks(audioTracks);
          
          // Set current audio track
          const currentAudio = player.getVariantTracks().find((t: any) => t.active);
          if (currentAudio) {
            setCurrentAudioTrack(currentAudio.audioId);
          }

          // Get available text tracks (subtitles)
          const textTracks = player.getTextLanguagesAndRoles();
          setAvailableTextTracks(textTracks);
          
          // Set text tracks to off by default
          player.setTextTrackVisibility(false);

          // Auto-select quality based on bandwidth if enabled
          if (autoQualityEnabled && estimatedBandwidth) {
            const optimalQuality = selectOptimalQuality(tracks, estimatedBandwidth);
            if (optimalQuality) {
              setCurrentQuality(`${optimalQuality.height}p`);
            }
          }

          // Set loading to false when video can play
          const onCanPlay = () => {
            setIsLoading(false);
            videoRef.current?.removeEventListener('canplay', onCanPlay);
          };
          videoRef.current?.addEventListener('canplay', onCanPlay, { once: true });

          if (autoplay && videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
        } catch (error) {
          console.error("Shaka load error, trying native HLS:", error);
          setIsLoading(false);
          fallbackToNativeHls();
        }
      }
    };

    initPlayer();

    return () => {
      cleanupPlayer();
    };
  }, [protectedSource, accessValidated, isLocked, autoplay]);

  const handleServerChange = async (source: VideoSource) => {
    // Save state if switching from video source (not iframe)
    let wasPlaying = false;
    let savedTime = 0;
    
    if (videoRef.current && currentSource?.type !== "embed" && currentSource?.type !== "iframe") {
      wasPlaying = !videoRef.current.paused;
      savedTime = videoRef.current.currentTime || 0;
    }

    console.log('Switching server to:', source.server_name, source.type);
    setCurrentSource(source);
    setAccessValidated(false);
    setProtectedSource(null);
    
    // For non-free content, fetch protected URL
    const isFreeContent = accessType === 'free';
    if (!isFreeContent && user) {
      await fetchProtectedSource(source);
    } else if (isFreeContent) {
      setProtectedSource(source);
      setAccessValidated(true);
    }
  };

  const handleQualityChange = (quality: string) => {
    if (!protectedSource || !videoRef.current) return;

    const wasPlaying = !videoRef.current.paused;
    const savedTime = videoRef.current.currentTime;

    if (protectedSource.type === "mp4" && protectedSource.quality_urls) {
      const qualityUrl = getMp4Url(protectedSource.quality_urls, quality);
      
      if (!qualityUrl) {
        console.error(`No URL found for quality: ${quality}`);
        return;
      }
      
      setCurrentQuality(quality);
      
      const onCanPlay = async () => {
        if (!videoRef.current) return;
        try {
          videoRef.current.currentTime = savedTime;
          if (wasPlaying) await videoRef.current.play();
        } catch (error) {
          console.error('Error restoring playback after quality change:', error);
        }
        videoRef.current.removeEventListener('canplay', onCanPlay);
      };
      
      videoRef.current.addEventListener('canplay', onCanPlay, { once: true });
      videoRef.current.src = qualityUrl;
      videoRef.current.load();
      
    } else if ((protectedSource.type === "hls" || protectedSource.type === "dash") && playerRef.current) {
      const player = playerRef.current;
      const tracks = player.getVariantTracks();
      const targetHeight = parseInt(quality);
      const matchingTracks = tracks.filter((track: any) => track.height === targetHeight);
      
      if (matchingTracks.length > 0) {
        setAutoQualityEnabled(false);
        player.configure({ abr: { enabled: false } });
        player.selectVariantTrack(matchingTracks[0], true);
        setCurrentQuality(quality);
        
        if (wasPlaying && videoRef.current?.paused) {
          videoRef.current.play().catch(e => console.error('Play failed after quality change:', e));
        }
      }
    }
  };

  const handleTextTrackChange = (language: string, role?: string) => {
    if (!playerRef.current) return;
    
    const player = playerRef.current;
    
    if (language === 'off') {
      console.log('Disabling text tracks');
      player.setTextTrackVisibility(false);
      setCurrentTextTrack('off');
    } else {
      console.log('Switching text track to:', language, role);
      player.selectTextLanguage(language, role || '');
      player.setTextTrackVisibility(true);
      setCurrentTextTrack(language);
    }
  };

  const handleAudioTrackChange = (language: string, role?: string) => {
    if (!playerRef.current) return;
    
    const player = playerRef.current;
    console.log('Switching audio track to:', language, role);
    
    player.selectAudioLanguage(language, role || '');
    
    // Update current audio track state
    const tracks = player.getVariantTracks();
    const activeTrack = tracks.find((t: any) => t.active);
    if (activeTrack) {
      setCurrentAudioTrack(activeTrack.audioId);
    }
  };

  const getServerIcon = (type: string) => {
    switch (type) {
      case "embed":
      case "iframe":
        return Monitor;
      case "hls":
      case "dash":
        return Film;
      case "mp4":
        return VideoIcon;
      default:
        return VideoIcon;
    }
  };

  // Auto-hide controls after play
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Player control handlers
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setShowControls(true); // Show controls when paused
    } else {
      videoRef.current.play();
      // Auto-hide controls 5 seconds after play starts
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
      autoHideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
    
    // Show center icon briefly when toggling
    setShowCenterIcon(true);
    setTimeout(() => setShowCenterIcon(false), 500);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0];
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      // Enter fullscreen
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
      // Lock to landscape on native Android when entering fullscreen
      if (isNative && isAndroid) {
        await lockLandscape();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
      // Lock back to portrait on native Android when exiting fullscreen
      if (isNative && isAndroid) {
        await lockPortrait();
      }
    }
  };

  const togglePictureInPicture = async () => {
    if (!videoRef.current) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Error toggling Picture-in-Picture:', error);
    }
  };

  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
  };

  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleStableVolumeToggle = (enabled: boolean) => {
    setStableVolume(enabled);
    // Implement stable volume logic if needed (e.g., audio normalization)
  };

  const handleSleepTimerChange = (minutes: number) => {
    setSleepTimer(minutes);
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
    }
    if (minutes > 0) {
      sleepTimerRef.current = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.pause();
        }
        setSleepTimer(0);
      }, minutes * 60 * 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || currentSource?.type === "embed" || currentSource?.type === "iframe") return;

    const handlePlay = () => {
      setIsPlaying(true);
      // Auto-hide controls 5 seconds after play starts (for autoplay & all devices)
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
      autoHideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    };
    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true); // Show controls when paused
      // Clear auto-hide timeout when paused
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Update buffered
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const handleEnded = () => {
      if (onEnded) {
        onEnded();
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ended', handleEnded);
      // Cleanup auto-hide timeout
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };
  }, [currentSource, onEnded]);

  // Fullscreen change listener with orientation handling
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      
      // Handle orientation on native Android
      if (isNative && isAndroid) {
        if (isNowFullscreen) {
          await lockLandscape();
        } else {
          await lockPortrait();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Ensure portrait lock is restored when component unmounts
      if (isNative && isAndroid) {
        lockPortrait();
      }
    };
  }, [isNative, isAndroid, lockLandscape, lockPortrait]);

  // Cleanup sleep timer on unmount
  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
    };
  }, []);

  // Show overlay ad based on database settings
  useEffect(() => {
    const checkOverlayAd = async () => {
      if (!showOverlayAd && adCompleted && currentTime > 30) {
        const now = new Date().toISOString();
        const { data } = await supabase
          .from("ads")
          .select("midroll_time_seconds")
          .eq("is_active", true)
          .eq("ad_type", "video")
          .in("video_type", ["popup", "banner"])
          .eq("placement", "video_player")
          .lte("start_date", now)
          .or(`end_date.is.null,end_date.gte.${now}`)
          .limit(1)
          .maybeSingle();
        
        if (data && currentTime >= (data.midroll_time_seconds ?? 120)) {
          setShowOverlayAd(true);
        }
      }
    };
    
    checkOverlayAd();
  }, [currentTime, showOverlayAd, adCompleted]);

  if (!currentSource) return null;

  const ServerIcon = getServerIcon(currentSource.type);

  return (
    <div 
      ref={containerRef}
      className={`shaka-video-container relative bg-black group ${className}`}
      style={{ position: 'relative', width: '100%', height: '100%' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Pre-roll Video Ad */}
      {showPreRollAd && !adCompleted && (
        <VideoAdPlayer 
          onAdComplete={() => {
            setShowPreRollAd(false);
            setAdCompleted(true);
            if (videoRef.current && autoplay) {
              videoRef.current.play();
            }
          }}
          onSkip={() => {
            setShowPreRollAd(false);
            setAdCompleted(true);
            if (videoRef.current && autoplay) {
              videoRef.current.play();
            }
          }}
        />
      )}

      {/* Overlay Ad */}
      {showOverlayAd && adCompleted && currentSource.type !== "iframe" && (
        <OverlayAd 
          onClose={() => setShowOverlayAd(false)} 
          currentTime={currentTime}
        />
      )}
      
      {/* Loading Overlay */}
      {isLoading && !isLocked && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Locked Content Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80 flex items-center justify-center z-[60]">
          <div className="flex flex-col items-center gap-3 p-4 sm:p-6 text-center max-w-sm mx-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
              <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-white text-lg sm:text-xl font-bold">
                {accessType === 'vip' ? 'VIP Content' : 'Premium Content'}
              </h3>
              <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                {accessType === 'vip' 
                  ? 'Subscribe to VIP to unlock this content.'
                  : excludeFromPlan
                    ? `Rent to watch this ${mediaType || 'content'}.`
                    : 'Subscribe or rent to watch.'
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full mt-1">
              {accessType === 'vip' && (
                <a href="/subscriptions" className="flex-1">
                  <Button className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold h-9 text-sm">
                    <Crown className="w-4 h-4" />
                    Subscribe to VIP
                  </Button>
                </a>
              )}
              {accessType === 'rent' && (
                <>
                  {!excludeFromPlan && (
                    <a href="/subscriptions" className="flex-1">
                      <Button className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold h-9 text-sm">
                        <Crown className="w-4 h-4" />
                        Subscribe VIP
                      </Button>
                    </a>
                  )}
                  <Button 
                    onClick={handleRentClick}
                    className="flex-1 gap-2 bg-primary hover:bg-primary/90 h-9 text-sm"
                  >
                    <DollarSign className="w-4 h-4" />
                    Rent {rentalPrice ? `$${rentalPrice}` : ''} ({rentalPeriodDays}d)
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Video Element - For MP4, HLS, DASH */}
      {currentSource.type !== "embed" && currentSource.type !== "iframe" && (
        <video
          ref={videoRef}
          className="w-full h-full"
          poster={poster}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          onError={(e) => {
            const err = (e.currentTarget as HTMLVideoElement).error;
            if (err) {
              console.error('Video element error:', {
                code: err.code,
                message: err.message,
                MEDIA_ERR_ABORTED: err.code === 1,
                MEDIA_ERR_NETWORK: err.code === 2,
                MEDIA_ERR_DECODE: err.code === 3,
                MEDIA_ERR_SRC_NOT_SUPPORTED: err.code === 4
              });
            }
          }}
        />
      )}

      {/* Iframe Element - For Embed/iframe sources */}
      {(currentSource.type === "embed" || currentSource.type === "iframe") && (
        <>
          <iframe
            ref={iframeRef}
            src={currentSource.url}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media"
            style={{ width: '100%', height: '100%', border: 'none', objectFit: 'cover' }}
          />
          {/* Minimal overlay for iframe/embed: allow server switch + fullscreen */}
          <div className="absolute top-2 right-2 z-[9999] flex gap-2 pointer-events-auto">
            {sources.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white bg-black/40 hover:bg-black/60"
                  >
                    {(() => { const Icon = getServerIcon(currentSource.type); return <Icon className="h-4 w-4" />; })()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background text-foreground border border-border shadow-xl z-[10000]">
                  <DropdownMenuLabel className="text-muted-foreground">Select Server</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  {sources.map((source) => {
                    const Icon = getServerIcon(source.type);
                    const isActive = currentSource?.id === source.id;
                    return (
                      <DropdownMenuItem
                        key={source.id}
                        onClick={() => handleServerChange(source)}
                        className={`${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <span>{source.server_name}</span>
                        <span className={`ml-auto text-xs uppercase ${isActive ? "opacity-90" : "text-muted-foreground"}`}>
                          {source.type}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePictureInPicture}
              className="h-8 w-8 text-white bg-black/40 hover:bg-black/60"
              title="Picture-in-Picture"
            >
              <PictureInPicture className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8 text-white bg-black/40 hover:bg-black/60"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </>
      )}

      {/* Top Right Server List Button - Always visible */}
      {currentSource.type !== "embed" && currentSource.type !== "iframe" && sources.length > 1 && (
        <div className="absolute top-4 right-4 z-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all"
              >
                <ServerIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background text-foreground border border-border shadow-xl z-[9999]">
              <DropdownMenuLabel className="text-muted-foreground">Select Server</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              {sources.map((source) => {
                const Icon = getServerIcon(source.type);
                const isActive = currentSource?.id === source.id;
                return (
                  <DropdownMenuItem
                    key={source.id}
                    onClick={() => handleServerChange(source)}
                    className={`${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span>{source.server_name}</span>
                    <span className={`ml-auto text-xs uppercase ${isActive ? "opacity-90" : "text-muted-foreground"}`}>
                      {source.type}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Transparent click overlay for play/pause on video area */}
      {currentSource.type !== "embed" && currentSource.type !== "iframe" && (
        <div 
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={(e) => {
            // Only toggle play/pause if clicking on the overlay itself, not on controls
            if (e.target === e.currentTarget) {
              togglePlayPause();
            }
          }}
          style={{ background: 'transparent' }}
        />
      )}

      {/* Center Controls - Skip buttons and Play/Pause */}
      {currentSource.type !== "embed" && currentSource.type !== "iframe" && (
        <>
          {/* Skip buttons container - fades with controls */}
          <div 
            className={`absolute inset-0 z-20 flex items-center justify-center gap-12 pointer-events-none transition-opacity duration-300 ${
              showControls && !isLocked && canStream ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Skip Backward */}
            <Button
              variant="ghost"
              size="icon"
              onClick={skipBackward}
              className="h-12 w-12 text-white/90 hover:text-white transition-all pointer-events-auto"
            >
              <SkipBack className="h-6 w-6" fill="currentColor" />
            </Button>

            {/* Spacer for center button */}
            <div className="w-16" />

            {/* Skip Forward */}
            <Button
              variant="ghost"
              size="icon"
              onClick={skipForward}
              className="h-12 w-12 text-white/90 hover:text-white transition-all pointer-events-auto"
            >
              <SkipForward className="h-6 w-6" fill="currentColor" />
            </Button>
          </div>

          {/* Center Play/Pause Icon - Independent, always visible on hover or when paused */}
          {(!isPlaying || showControls || showCenterIcon) && !isLocked && canStream && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
                className={`h-16 w-16 rounded-full text-white transition-all hover:scale-105 pointer-events-auto ${
                  showCenterIcon ? 'animate-in zoom-in-95 duration-200' : ''
                }`}
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7" fill="currentColor" />
                ) : (
                  <Play className="h-7 w-7 ml-0.5" fill="currentColor" />
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Custom Controls Overlay */}
      {currentSource.type !== "embed" && currentSource.type !== "iframe" && (
        <div 
          className={`absolute inset-0 z-40 transition-opacity duration-300 pointer-events-none ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress Bar - Top of controls */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
              <div className="group/progress px-4 pb-2">
                <div className="relative h-[2px] bg-white/30 cursor-pointer transition-all hover:h-1">
                  {/* Buffered */}
                  <div 
                    className="absolute h-full bg-white/50 transition-all duration-150"
                    style={{ width: `${(buffered / duration) * 100}%` }}
                  />
                  {/* Progress */}
                  <div 
                    className="absolute h-full bg-cyan-500 transition-all duration-150"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  >
                    {/* Progress Handle */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg scale-0 group-hover/progress:scale-100" />
                  </div>
                  {/* Seek Slider */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => handleSeek([parseFloat(e.target.value)])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

            {/* Control Bar */}
            <div className="bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-4">
              <div className="flex items-center justify-between gap-2">
                {/* Left Controls */}
                <div className="flex items-center gap-1">
                  {/* Play/Pause */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlayPause}
                    className="h-8 w-8 text-white hover:bg-white/10 hover:text-white transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" fill="currentColor" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                    )}
                  </Button>

                  {/* Time Display */}
                  <div className="text-white text-xs font-medium whitespace-nowrap ml-1">
                    {formatTime(currentTime)}
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-1">
                  {/* Duration */}
                  <div className="text-white text-xs font-medium whitespace-nowrap mr-1">
                    {formatTime(duration)}
                  </div>

                  {/* Volume */}
                  <div className="flex items-center gap-1 group/volume">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="h-8 w-8 text-white hover:bg-white/10 hover:text-white transition-all"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="w-0 overflow-hidden group-hover/volume:w-16 transition-all duration-300 ease-out">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="w-16"
                      />
                    </div>
                  </div>


                  {/* Settings Menu */}
                  <VideoSettingsMenu
                    stableVolume={stableVolume}
                    onStableVolumeChange={handleStableVolumeToggle}
                    availableTextTracks={availableTextTracks}
                    currentTextTrack={currentTextTrack}
                    onTextTrackChange={handleTextTrackChange}
                    sleepTimer={sleepTimer}
                    onSleepTimerChange={handleSleepTimerChange}
                    playbackSpeed={playbackSpeed}
                    onPlaybackSpeedChange={handlePlaybackSpeedChange}
                    availableQualities={availableQualities}
                    currentQuality={currentQuality}
                    autoQualityEnabled={autoQualityEnabled}
                    onQualityChange={handleQualityChange}
                    onAutoQualityToggle={() => {
                      setAutoQualityEnabled(true);
                      if (playerRef.current) {
                        playerRef.current.configure({ abr: { enabled: true } });
                      }
                    }}
                    sourceType={currentSource?.type}
                  />

                  {/* Fullscreen */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="h-8 w-8 text-white hover:bg-white/10 hover:text-white transition-all"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rental Dialog */}
      {mediaId && mediaType && rentalPrice && (
        <RentalDialog
          open={showRentalDialog}
          onOpenChange={setShowRentalDialog}
          title={title}
          mediaId={mediaId}
          mediaType={mediaType}
          rentalPrice={rentalPrice}
          rentalPeriodDays={rentalPeriodDays}
          onSuccess={handleRentalSuccess}
        />
      )}
    </div>
  );
};
