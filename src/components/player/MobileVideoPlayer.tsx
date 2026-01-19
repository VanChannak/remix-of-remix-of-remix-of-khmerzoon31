import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  SkipBack, SkipForward, ArrowLeft, Settings, List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import Hls from "hls.js";
import { useNativeMobile } from "@/hooks/useNativeMobile";
import { useScreenOrientation } from "@/hooks/useScreenOrientation";
import { EpisodeListDrawer } from "@/components/watch/EpisodeListDrawer";

interface Episode {
  id: string;
  episode_number: number;
  title: string;
  thumbnail_url?: string;
}

interface MobileVideoPlayerProps {
  videoUrl: string;
  poster?: string;
  autoplay?: boolean;
  onBack?: () => void;
  title?: string;
  sourceType?: "mp4" | "hls" | "dash";
  episodes?: Episode[];
  currentEpisodeId?: string;
  onEpisodeSelect?: (episode: { id: string; episode_number: number }) => void;
  seriesBackdrop?: string;
}

export function MobileVideoPlayer({
  videoUrl,
  poster,
  autoplay = false,
  onBack,
  title,
  sourceType = "hls",
  episodes = [],
  currentEpisodeId,
  onEpisodeSelect,
  seriesBackdrop,
}: MobileVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const { isNative, isAndroid } = useNativeMobile();
  const { lockLandscape, lockPortrait } = useScreenOrientation();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);

  // Initialize video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setIsLoading(true);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (sourceType === "hls" && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (autoplay) {
          video.play().catch(console.error);
        }
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('[MobileVideoPlayer] HLS error:', data);
        if (data.fatal) {
          setIsLoading(false);
        }
      });
      hlsRef.current = hls;
    } else if (sourceType === "hls" && video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = videoUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        if (autoplay) {
          video.play().catch(console.error);
        }
      });
    } else {
      // MP4 or other direct sources
      video.src = videoUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        if (autoplay) {
          video.play().catch(console.error);
        }
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl, sourceType, autoplay]);

  // Handle fullscreen changes with orientation lock
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      
      // Add/remove body class for Android native fullscreen styling
      if (isCurrentlyFullscreen) {
        document.body.classList.add('mobile-fullscreen-active');
        document.body.style.overflow = 'hidden';
        // Lock to landscape on native Android when entering fullscreen
        if (isNative && isAndroid) {
          await lockLandscape();
        }
      } else {
        document.body.classList.remove('mobile-fullscreen-active');
        document.body.style.overflow = '';
        // Lock back to portrait on native Android when exiting fullscreen
        if (isNative && isAndroid) {
          await lockPortrait();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      // Cleanup body styles and restore portrait on unmount
      document.body.classList.remove('mobile-fullscreen-active');
      document.body.style.overflow = '';
      if (isNative && isAndroid) {
        lockPortrait();
      }
    };
  }, [isNative, isAndroid, lockLandscape, lockPortrait]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, []);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, resetControlsTimeout]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.error);
    }
    resetControlsTimeout();
  }, [isPlaying, resetControlsTimeout]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('[MobileVideoPlayer] Fullscreen error:', error);
    }
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0];
    setCurrentTime(value[0]);
  }, []);

  const skipForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.min(video.currentTime + 10, duration);
  }, [duration]);

  const skipBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(video.currentTime - 10, 0);
  }, []);

  const handleEpisodeClick = useCallback((episode: Episode) => {
    if (onEpisodeSelect) {
      onEpisodeSelect({ id: episode.id, episode_number: episode.episode_number });
      setShowEpisodeDrawer(false);
    }
  }, [onEpisodeSelect]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Find current episode index for prev/next navigation
  const currentEpisodeIndex = episodes.findIndex(ep => ep.id === currentEpisodeId);
  const hasPrevEpisode = currentEpisodeIndex > 0;
  const hasNextEpisode = currentEpisodeIndex < episodes.length - 1;

  return (
    <div
      ref={containerRef}
      className={cn(
        "mobile-video-container relative w-full bg-black overflow-hidden",
        isFullscreen ? "mobile-fullscreen fixed inset-0 z-[9999] w-screen h-screen" : "aspect-video"
      )}
      onClick={resetControlsTimeout}
    >
      <video
        ref={videoRef}
        className={cn(
          "mobile-video-element w-full h-full object-contain",
          isFullscreen && "absolute inset-0 w-full h-full"
        )}
        poster={poster}
        playsInline
        webkit-playsinline="true"
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="w-12 h-12 border-4 border-white/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 z-10 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={onBack}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            )}
            {title && (
              <h2 className="text-white font-semibold text-lg truncate max-w-[60vw]">
                {title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {episodes.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setShowEpisodeDrawer(!showEpisodeDrawer)}
              >
                <List className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Center Controls */}
        <div className="absolute inset-0 flex items-center justify-center gap-8">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-14 w-14"
            onClick={skipBackward}
          >
            <SkipBack className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-20 w-20"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-12 w-12" />
            ) : (
              <Play className="h-12 w-12 ml-1" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-14 w-14"
            onClick={skipForward}
          >
            <SkipForward className="h-8 w-8" />
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress Bar */}
          <div className="relative">
            {/* Buffered progress */}
            <div 
              className="absolute h-1 bg-white/30 rounded-full"
              style={{ width: `${(buffered / duration) * 100}%` }}
            />
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
          </div>

          {/* Bottom Button Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Episode List Drawer */}
      {showEpisodeDrawer && episodes.length > 0 && (
        <EpisodeListDrawer
          episodes={episodes.map(ep => ({
            id: ep.id,
            episode_number: ep.episode_number,
            title: ep.title,
            thumbnail_url: ep.thumbnail_url,
          }))}
          currentEpisodeId={currentEpisodeId}
          onEpisodeSelect={(ep) => handleEpisodeClick(ep as Episode)}
          onClose={() => setShowEpisodeDrawer(false)}
          seriesBackdrop={seriesBackdrop}
        />
      )}
    </div>
  );
}
