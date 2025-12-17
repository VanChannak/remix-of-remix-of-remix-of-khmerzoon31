import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useInView } from "@/hooks/useInView";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useIsTablet } from "@/hooks/use-tablet";
import { useIsMobile } from "@/hooks/use-mobile";

interface MediaItem {
  id: string;
  title: string;
  thumbnail: string;
  rating: number;
  type: string;
  media_type: 'anime' | 'movie' | 'series';
  genre: string;
  tmdb_id?: string;
  anilist_id?: string;
}

const CardWithFadeIn = ({ children, delay }: { children: React.ReactNode; delay: number }) => {
  const { ref, isInView } = useInView({ threshold: 0.1, triggerOnce: true });
  
  return (
    <div
      ref={ref}
      className="relative z-10 opacity-0 translate-y-8 transition-all duration-700 ease-out flex-shrink-0"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(2rem)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export const RecommendedSection = () => {
  const [recommended, setRecommended] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isTablet = useIsTablet();
  const isMobile = useIsMobile();
  const isDesktop = !isTablet && !isMobile;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScrollPosition();
    container.addEventListener("scroll", checkScrollPosition);
    window.addEventListener("resize", checkScrollPosition);
    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [recommended]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const fetchRecommended = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: history } = await supabase
          .from('watch_history')
          .select('movie_id, episode_id')
          .eq('user_id', user.id)
          .limit(20);

        const watchedMovieIds = history?.filter(h => h.movie_id).map(h => h.movie_id) || [];
        const watchedEpisodeIds = history?.filter(h => h.episode_id).map(h => h.episode_id) || [];

        const genres = new Set<string>();
        
        if (watchedMovieIds.length > 0) {
          const { data: movies } = await supabase
            .from('movies')
            .select('genre')
            .in('id', watchedMovieIds);
          movies?.forEach(m => m.genre.split(',').forEach((g: string) => genres.add(g.trim())));
        }

        if (watchedEpisodeIds.length > 0) {
          const { data: episodes } = await supabase
            .from('episodes')
            .select('seasons(series(genre))')
            .in('id', watchedEpisodeIds);
          episodes?.forEach((e: any) => {
            const genre = e.seasons?.series?.genre;
            if (genre) genre.split(',').forEach((g: string) => genres.add(g.trim()));
          });
        }

        const genreArray = Array.from(genres);
        const recommendations: MediaItem[] = [];

        if (genreArray.length > 0) {
          const topGenre = genreArray[0];
          
          const [animesRes, moviesRes, seriesRes] = await Promise.all([
            supabase.from('animes').select('id, title, thumbnail, rating, type, genre, tmdb_id, anilist_id').eq('status', 'published').ilike('genre', `%${topGenre}%`).order('rating', { ascending: false }).limit(7),
            supabase.from('movies').select('id, title, thumbnail, rating, type, genre, tmdb_id').eq('status', 'published').ilike('genre', `%${topGenre}%`).order('rating', { ascending: false }).limit(7),
            supabase.from('series').select('id, title, thumbnail, rating, type, genre, tmdb_id').eq('status', 'published').ilike('genre', `%${topGenre}%`).order('rating', { ascending: false }).limit(7)
          ]);

          const combined: MediaItem[] = [
            ...(animesRes.data?.map(item => ({ ...item, media_type: 'anime' as const })) || []),
            ...(moviesRes.data?.map(item => ({ ...item, media_type: 'movie' as const })) || []),
            ...(seriesRes.data?.map(item => ({ ...item, media_type: 'series' as const })) || [])
          ]
            .filter(item => {
              if (item.media_type === 'movie') return !watchedMovieIds.includes(item.id);
              return true;
            })
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 14);

          recommendations.push(...combined);
        }

        setRecommended(recommendations);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommended();
  }, [user]);

  if (!user || loading || recommended.length === 0) {
    return null;
  }

  return (
    <section className={`relative group/section ${isTablet ? 'my-px px-2' : isDesktop ? 'py-4' : 'my-6 md:my-6 max-md:my-3 px-4 md:px-4 max-md:px-0'}`}>
      <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none z-[1]" />
      
      <div className="max-w-[1600px] mx-auto">
        <div className={`flex items-center justify-between ${isDesktop ? 'mb-3 px-4 md:px-6' : 'mb-4 max-md:mb-2 max-md:px-2'}`}>
          <div className="flex items-center gap-2 group/link cursor-pointer">
            <h2 className={`font-bold text-foreground group-hover/link:text-primary transition-colors ${isDesktop ? 'text-xl md:text-2xl' : 'text-2xl md:text-2xl max-md:text-base'}`}>
              Recommended for You
            </h2>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover/link:text-primary transition-colors" />
          </div>
        </div>
        
        <div className="relative">
          {/* Left Navigation Arrow - Desktop Only */}
          {isDesktop && (
            <button
              onClick={() => scroll("left")}
              className={`absolute left-0 top-0 bottom-0 z-20 w-14 bg-gradient-to-r from-background via-background/80 to-transparent flex items-center justify-start pl-2 transition-opacity duration-300 ${
                canScrollLeft ? "opacity-0 group-hover/section:opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="bg-background/90 hover:bg-background backdrop-blur-sm p-2.5 rounded-full border border-border/50 hover:border-primary/50 transition-all hover:scale-110 shadow-lg">
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </div>
            </button>
          )}

          <div ref={scrollContainerRef} className={`flex overflow-x-auto gap-3 pb-4 scrollbar-hide snap-x snap-mandatory touch-pan-x scroll-smooth ${isDesktop ? 'px-4 md:px-6' : 'md:gap-4 max-md:gap-1'}`}>
            {recommended.map((item, index) => {
              const detailPath = item.media_type === 'anime' 
                ? `/anime/${item.anilist_id || item.id}` 
                : item.media_type === 'movie' 
                ? `/watch/movie/${item.tmdb_id}` 
                : `/watch/series/${item.tmdb_id}/1/1`;
              
              const content = (
                <Link 
                  to={detailPath}
                  className={`group flex-shrink-0 rounded-lg overflow-hidden border border-border/50 transition-all snap-start ${
                    isDesktop 
                      ? 'w-[180px] hover:border-primary/50 duration-300 hover:scale-105' 
                      : 'w-[200px] md:w-[200px] max-md:w-[calc(33.333%-0.5rem)]'
                  }`}
                >
                  <div className="relative">
                    <img 
                      src={item.thumbnail} 
                      alt={item.title}
                      className={`w-full h-[270px] object-cover transition-all ${isDesktop ? 'group-hover:brightness-75' : ''}`}
                    />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/90 to-transparent">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {item.type && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[10px]">
                            {item.type}
                          </span>
                        )}
                        {item.rating && (
                          <span className="flex items-center gap-1 text-[10px]">
                            ⭐ {item.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
              
              return isMobile || isTablet ? (
                <div key={`${item.media_type}-${item.id}`}>{content}</div>
              ) : (
                <CardWithFadeIn key={`${item.media_type}-${item.id}`} delay={index * 30}>
                  {content}
                </CardWithFadeIn>
              );
            })}
          </div>

          {/* Right Navigation Arrow - Desktop Only */}
          {isDesktop && (
            <button
              onClick={() => scroll("right")}
              className={`absolute right-0 top-0 bottom-0 z-20 w-14 bg-gradient-to-l from-background via-background/80 to-transparent flex items-center justify-end pr-2 transition-opacity duration-300 ${
                canScrollRight ? "opacity-0 group-hover/section:opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="bg-background/90 hover:bg-background backdrop-blur-sm p-2.5 rounded-full border border-border/50 hover:border-primary/50 transition-all hover:scale-110 shadow-lg">
                <ChevronRight className="h-5 w-5 text-foreground" />
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
