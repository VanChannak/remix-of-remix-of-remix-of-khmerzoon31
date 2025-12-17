import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft, Bell, BellOff, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInView } from "@/hooks/useInView";
import { format, parseISO } from "date-fns";
import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ShakaPlayer } from "@/components/ShakaPlayer";
import { useIsTablet } from "@/hooks/use-tablet";

interface UpcomingRelease {
  id: string;
  title: string;
  thumbnail: string | null;
  type: string;
  release_date: string | null;
  status: string;
  genre: string | null;
  tmdb_id: string | null;
}

const CardWithFadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  
  return (
    <div
      ref={ref}
      className="transition-all duration-700"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(20px)',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

export const ComingSoonSection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTrailer, setSelectedTrailer] = useState<{ title: string; url: string } | null>(null);
  const isTablet = useIsTablet();

  const getYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
      /youtube\.com\/watch\?.*v=([^&\s]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const { data: upcomingReleases, isLoading } = useQuery({
    queryKey: ['upcoming-releases-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upcoming_releases')
        .select('*')
        .order('release_date', { ascending: true })
        .limit(12);
      
      if (error) throw error;
      
      // For each upcoming release, try to find the actual media ID
      const releasesWithLinks = await Promise.all(
        (data || []).map(async (release) => {
          let mediaId = null;
          if (release.tmdb_id) {
            if (release.type === 'Movie') {
              const { data: movie } = await supabase
                .from('movies')
                .select('id')
                .eq('tmdb_id', release.tmdb_id)
                .single();
              mediaId = movie?.id;
            } else if (release.type === 'Series') {
              const { data: series } = await supabase
                .from('series')
                .select('id')
                .eq('tmdb_id', release.tmdb_id)
                .single();
              mediaId = series?.id;
            } else if (release.type === 'Anime') {
              const { data: anime } = await supabase
                .from('animes')
                .select('id')
                .eq('tmdb_id', release.tmdb_id)
                .single();
              mediaId = anime?.id;
            }
          }
          return { ...release, mediaId };
        })
      );
      
      return releasesWithLinks;
    },
  });

  const { data: reservations } = useQuery({
    queryKey: ['user-reservations-home'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('reservations')
        .select('release_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const reserveMutation = useMutation({
    mutationFn: async (releaseId: string) => {
      if (!user) throw new Error("Please sign in to reserve");
      const { error } = await supabase
        .from('reservations')
        .insert({ user_id: user.id, release_id: releaseId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reservations-home'] });
      toast.success("Reserved! You'll be notified when it's released.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reserve");
    },
  });

  const unreserveMutation = useMutation({
    mutationFn: async (releaseId: string) => {
      if (!user) throw new Error("Please sign in");
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('user_id', user.id)
        .eq('release_id', releaseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reservations-home'] });
      toast.success("Reservation cancelled");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel reservation");
    },
  });

  const isReserved = (releaseId: string) => {
    return reservations?.some((r: any) => r.release_id === releaseId) || false;
  };

  const handleReserveToggle = (releaseId: string) => {
    if (isReserved(releaseId)) {
      unreserveMutation.mutate(releaseId);
    } else {
      reserveMutation.mutate(releaseId);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 240;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  const formatReleaseDate = (dateString: string | null) => {
    if (!dateString) return 'Coming soon';
    try {
      return format(parseISO(dateString), 'MM-dd');
    } catch {
      return 'Coming soon';
    }
  };

  const getTypeBadge = (genre: string | null) => {
    if (!genre) return null;
    
    if (genre.toLowerCase().includes('original')) {
      return <Badge className="absolute top-2 right-2 bg-green-500 text-white">Original</Badge>;
    }
    if (genre.toLowerCase().includes('iqiyi')) {
      return <Badge className="absolute top-2 right-2 bg-green-400 text-black">iQIYI Only</Badge>;
    }
    return null;
  };

  const handleTrailerClick = (e: React.MouseEvent, release: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (release.trailer_url) {
      setSelectedTrailer({ title: release.title, url: release.trailer_url });
    } else {
      toast.error("No trailer available");
    }
  };

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="h-8 w-48 bg-secondary animate-pulse rounded-lg mb-6" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="min-w-[220px] h-[420px] bg-secondary animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!upcomingReleases || upcomingReleases.length === 0) return null;

  return (
    <section className={`${isTablet ? 'py-px' : 'py-8 md:py-8 max-md:py-4'}`}>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <Link to="/coming-soon" className="flex items-center gap-2 group">
            <h2 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
              Coming Soon
            </h2>
            <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>

        {/* Timeline */}
        <div className="relative mb-8">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-border" />
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {upcomingReleases.map((release, index) => (
              <div key={release.id} className="flex flex-col items-center min-w-[180px]">
                <div className="relative w-3 h-3 rounded-full bg-primary mb-2" />
                <span className="text-sm text-muted-foreground">
                  {formatReleaseDate(release.release_date)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cards with Scroll Arrows */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
            {upcomingReleases.map((release, index) => (
              <CardWithFadeIn key={release.id} delay={index * 50}>
                <div className="min-w-[60px] flex flex-col">
                  {(release as any).mediaId ? (
                    <Link 
                      to={
                        release.type === 'Movie' ? `/watch/movie/${(release as any).tmdbId}` :
                        release.type === 'Series' ? `/watch/series/${(release as any).tmdbId}/1/1` :
                        release.type === 'Anime' ? `/anime/${(release as any).anilistId}` :
                        '#'
                      }
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 group cursor-pointer">
                        {getTypeBadge(release.genre)}
                        <img
                          src={release.thumbnail || '/placeholder.svg'}
                          alt={release.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        {release.trailer_url && (
                          <button
                            onClick={(e) => handleTrailerClick(e, release)}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center hover:bg-primary transition-colors">
                              <Play className="w-8 h-8 text-primary-foreground" fill="currentColor" />
                            </div>
                          </button>
                        )}
                      </div>
                    
                      <h3 className="text-xs font-semibold text-foreground mb-2 line-clamp-1 hover:text-primary transition-colors">
                        {release.title}
                      </h3>
                    </Link>
                  ) : (
                    <div>
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 group cursor-pointer">
                        {getTypeBadge(release.genre)}
                        <img
                          src={release.thumbnail || '/placeholder.svg'}
                          alt={release.title}
                          className="w-full h-full object-cover"
                        />
                        {release.trailer_url && (
                          <button
                            onClick={(e) => handleTrailerClick(e, release)}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
                          >
                            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center hover:bg-primary transition-colors">
                              <Play className="w-8 h-8 text-primary-foreground" fill="currentColor" />
                            </div>
                          </button>
                        )}
                      </div>
                    
                      <h3 className="text-xs font-semibold text-foreground mb-2 line-clamp-1">
                        {release.title}
                      </h3>
                    </div>
                  )}

                  <Button
                    variant={isReserved(release.id) ? "default" : "secondary"}
                    size="sm"
                    className="w-full text-xs h-8"
                    onClick={() => handleReserveToggle(release.id)}
                    disabled={!user || reserveMutation.isPending || unreserveMutation.isPending}
                  >
                    {isReserved(release.id) ? (
                      <>
                        <BellOff className="w-3 h-3 mr-1" />
                        Reserved
                      </>
                    ) : (
                      <>
                        <Bell className="w-3 h-3 mr-1" />
                        Reserve
                      </>
                    )}
                  </Button>
                </div>
              </CardWithFadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* Trailer Dialog */}
      <Dialog open={!!selectedTrailer} onOpenChange={() => setSelectedTrailer(null)}>
        <DialogContent className="max-w-4xl p-0 bg-background/95 backdrop-blur">
          {selectedTrailer && (
            <div className="space-y-4">
              <div className="px-6 pt-6">
                <h2 className="text-2xl font-bold">{selectedTrailer.title} - Trailer</h2>
              </div>
              <AspectRatio ratio={16 / 9}>
                {isYouTubeUrl(selectedTrailer.url) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(selectedTrailer.url)}?autoplay=1`}
                    className="w-full h-full rounded-b-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <ShakaPlayer
                    videoSources={[{
                      id: 'trailer',
                      server_name: 'Trailer',
                      source_type: selectedTrailer.url.includes('.m3u8') ? 'hls' : selectedTrailer.url.includes('.mpd') ? 'dash' : 'mp4',
                      url: selectedTrailer.url,
                      is_default: true,
                    }]}
                    autoplay
                    className="rounded-b-lg overflow-hidden"
                  />
                )}
              </AspectRatio>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
