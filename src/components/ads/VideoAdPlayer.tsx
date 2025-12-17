import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Volume2, VolumeX } from "lucide-react";

interface VideoAd {
  id: string;
  title: string;
  video_url: string;
  link_url: string | null;
  video_type: string;
  description: string | null;
}

interface VideoAdPlayerProps {
  onAdComplete: () => void;
  onSkip: () => void;
}

export function VideoAdPlayer({ onAdComplete, onSkip }: VideoAdPlayerProps) {
  const [ad, setAd] = useState<VideoAd | null>(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [skipAfter, setSkipAfter] = useState(5);
  const [autoPlay, setAutoPlay] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadAd();
  }, []);

  const loadAd = async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .eq("ad_type", "video")
      .eq("video_type", "video")
      .lte("start_date", now)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setAd(data as VideoAd);
      setSkipAfter(data.skip_after_seconds ?? 5);
      setAutoPlay(data.auto_play ?? true);
      trackImpression(data.id);
    }
  };

  const trackImpression = async (adId: string) => {
    const { data: adData } = await supabase
      .from("ads")
      .select("impressions")
      .eq("id", adId)
      .single();
    
    if (adData) {
      await supabase
        .from("ads")
        .update({ impressions: (adData.impressions || 0) + 1 })
        .eq("id", adId);
    }
  };

  const trackClick = async () => {
    if (!ad) return;
    
    const { data: adData } = await supabase
      .from("ads")
      .select("clicks")
      .eq("id", ad.id)
      .single();
    
    if (adData) {
      await supabase
        .from("ads")
        .update({ clicks: (adData.clicks || 0) + 1 })
        .eq("id", ad.id);
    }

    if (ad.link_url) {
      window.open(ad.link_url, "_blank", "noopener,noreferrer");
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      const handleTimeUpdate = () => {
        const remaining = Math.ceil(video.duration - video.currentTime);
        setTimeLeft(remaining);
        
        if (video.currentTime >= skipAfter) {
          setCanSkip(true);
        }
      };

      const handleEnded = () => {
        onAdComplete();
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("ended", handleEnded);

      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("ended", handleEnded);
      };
    }
  }, [ad, onAdComplete]);

  if (!ad) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          src={ad.video_url}
          autoPlay={autoPlay}
          muted={isMuted}
          playsInline
          className="w-full h-full object-contain"
        />
        
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="bg-black/80 px-3 py-2 rounded-lg">
            <p className="text-white text-sm font-medium">Advertisement</p>
            {!canSkip && (
              <p className="text-white/70 text-xs">Skip in {timeLeft}s</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/80 hover:bg-black text-white"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            
            {canSkip && (
              <Button
                variant="ghost"
                className="bg-black/80 hover:bg-black text-white"
                onClick={onSkip}
              >
                Skip Ad
              </Button>
            )}
          </div>
        </div>

        {ad.link_url && (
          <div 
            className="absolute bottom-4 left-4 right-4 bg-black/80 p-4 rounded-lg cursor-pointer hover:bg-black/90 transition-colors"
            onClick={trackClick}
          >
            <h3 className="text-white font-semibold">{ad.title}</h3>
            {ad.description && (
              <p className="text-white/80 text-sm mt-1">{ad.description}</p>
            )}
            <p className="text-primary text-sm mt-2">Learn More →</p>
          </div>
        )}
      </div>
    </div>
  );
}
