import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverlayAdProps {
  onClose: () => void;
  currentTime: number;
}

export function OverlayAd({ onClose, currentTime }: OverlayAdProps) {
  const [ad, setAd] = useState<any>(null);
  const [showCloseButton, setShowCloseButton] = useState(true);

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
      .in("video_type", ["popup", "banner"])
      .eq("placement", "video_player")
      .lte("start_date", now)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .lte("midroll_time_seconds", currentTime)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setAd(data);
      setShowCloseButton(data.show_close_button ?? true);
      trackImpression(data.id);
    }
  };

  const trackImpression = async (adId: string) => {
    const { data: adData } = await supabase
      .from("ads")
      .select("impressions")
      .eq("id", adId)
      .maybeSingle();
    
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
      .maybeSingle();
    
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

  if (!ad) return null;

  return (
    <div 
      className="absolute bottom-20 left-4 right-4 bg-black/90 rounded-lg p-4 cursor-pointer hover:bg-black transition-colors z-40"
      onClick={trackClick}
    >
      {showCloseButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      <div className="flex gap-4 items-center">
        {ad.image_url && (
          <img 
            src={ad.image_url} 
            alt={ad.title}
            className="w-24 h-24 object-cover rounded"
          />
        )}
        <div className="flex-1">
          <p className="text-xs text-white/60 mb-1">Advertisement</p>
          <h3 className="text-white font-semibold text-lg">{ad.title}</h3>
          {ad.description && (
            <p className="text-white/80 text-sm mt-1">{ad.description}</p>
          )}
          <p className="text-primary text-sm mt-2">Learn More →</p>
        </div>
      </div>
    </div>
  );
}
