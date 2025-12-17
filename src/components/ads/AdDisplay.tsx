import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdDisplayProps {
  placement: "homepage" | "video_player" | "sidebar" | "banner";
  device?: "web" | "app";
  className?: string;
}

export function AdDisplay({ placement, device = "web", className = "" }: AdDisplayProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [rotationInterval, setRotationInterval] = useState(30000);

  const { data: ads } = useQuery({
    queryKey: ["active-ads", placement, device],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("is_active", true)
        .eq("placement", placement)
        .or(`device.eq.${device},device.is.null`)
        .or(`ad_type.eq.manual,ad_type.eq.adsense`)
        .lte("start_date", now)
        .or(`end_date.is.null,end_date.gte.${now}`);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const trackImpressionMutation = useMutation({
    mutationFn: async (adId: string) => {
      const { data: ad } = await supabase
        .from("ads")
        .select("impressions")
        .eq("id", adId)
        .maybeSingle();
      
      if (ad) {
        await supabase
          .from("ads")
          .update({ impressions: (ad.impressions || 0) + 1 })
          .eq("id", adId);
      }
    },
  });

  const trackClickMutation = useMutation({
    mutationFn: async (adId: string) => {
      const { data: ad } = await supabase
        .from("ads")
        .select("clicks")
        .eq("id", adId)
        .maybeSingle();
      
      if (ad) {
        await supabase
          .from("ads")
          .update({ clicks: (ad.clicks || 0) + 1 })
          .eq("id", adId);
      }
    },
  });

  useEffect(() => {
    if (ads && ads.length > 0) {
      const currentAd = ads[currentAdIndex];
      trackImpressionMutation.mutate(currentAd.id);
      
      // Use rotation interval from ad settings
      const adRotationInterval = (currentAd.rotation_interval_seconds ?? 30) * 1000;
      setRotationInterval(adRotationInterval);

      // Rotate ads based on ad settings
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % ads.length);
      }, adRotationInterval);

      return () => clearInterval(interval);
    }
  }, [ads, currentAdIndex]);

  if (!ads || ads.length === 0 || !isVisible) return null;

  const currentAd = ads[currentAdIndex];

  const handleAdClick = () => {
    trackClickMutation.mutate(currentAd.id);
    if (currentAd.link_url) {
      window.open(currentAd.link_url, "_blank", "noopener,noreferrer");
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Render AdSense ad
  if (currentAd.ad_type === "adsense" && currentAd.adsense_code) {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <div dangerouslySetInnerHTML={{ __html: currentAd.adsense_code }} />
      </div>
    );
  }

  // Render manual ad
  if (currentAd.ad_type === "manual" && currentAd.image_url) {
    const showClose = currentAd.show_close_button ?? true;
    return (
      <div className={`relative group ${className}`}>
        {showClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <div
          className="cursor-pointer overflow-hidden rounded-lg"
          onClick={handleAdClick}
        >
          <img
            src={currentAd.image_url}
            alt={currentAd.title}
            className="w-full h-auto object-cover transition-transform hover:scale-105"
          />
          {currentAd.description && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white text-sm">{currentAd.description}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
