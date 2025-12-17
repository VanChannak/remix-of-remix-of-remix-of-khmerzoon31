import { ShakaPlayer } from "./ShakaPlayer";
import { Database } from "@/integrations/supabase/types";

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
}: VideoPlayerProps) => {
  const currentEpisode = episodes?.find(ep => ep.id === currentEpisodeId);
  
  // Use episode-level access if available, otherwise fall back to content-level access
  const effectiveAccessType = currentEpisode?.access || accessType;
  
  // Convert DB types to component types
  const convertedSources: VideoSource[] = videoSources.map(source => ({
    id: source.id,
    url: source.url,
    quality: source.quality,
    is_default: source.is_default,
    server_name: source.server_name,
    source_type: source.source_type,
    quality_urls: source.quality_urls as Record<string, string> | null
  }));
  
  return (
    <div className="w-full">
      <ShakaPlayer 
        key={currentEpisodeId || movieId} // Force remount on episode change for smooth loading
        videoSources={convertedSources as any}
        poster={contentBackdrop || currentEpisode?.still_path}
        autoplay={false}
        className="w-full"
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