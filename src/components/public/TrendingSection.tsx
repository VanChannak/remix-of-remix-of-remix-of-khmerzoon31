import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "@/hooks/useInView";
import { Link } from "react-router-dom";
import { useIsTablet } from "@/hooks/use-tablet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MediaItem {
  id: string;
  title: string;
  thumbnail: string;
  rating: number;
  type: string;
  views: number;
  media_type: 'anime' | 'movie' | 'series';
  tmdb_id?: string;
  anilist_id?: string;
}

const CardWithFadeIn = ({ children, delay }: { children: React.ReactNode; delay: number }) => {
  const { ref, isInView } = useInView({ threshold: 0.1, triggerOnce: true });
  
  return (
    <div
      ref={ref}
      className="relative z-10 opacity-0 translate-y-8 transition-all duration-700 ease-out"
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

export const TrendingSection = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isTablet = useIsTablet();
  const isMobile = useIsMobile();
  const isTabletOrMobile = isTablet || isMobile;
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
  }, [mediaList]);

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
    const fetchTrendingMedia = async () => {
      try {
        const [animesRes, moviesRes, seriesRes] = await Promise.all([
          supabase.from('animes').select('id, title, thumbnail, rating, type, views, tmdb_id').eq('status', 'published').order('views', { ascending: false }).limit(7),
          supabase.from('movies').select('id, title, thumbnail, rating, type, views, tmdb_id').eq('status', 'published').order('views', { ascending: false }).limit(7),
          supabase.from('series').select('id, title, thumbnail, rating, type, views, tmdb_id').eq('status', 'published').order('views', { ascending: false }).limit(7)
        ]);

        if (animesRes.error) throw animesRes.error;
        if (moviesRes.error) throw moviesRes.error;
        if (seriesRes.error) throw seriesRes.error;

        const combined: MediaItem[] = [
          ...(animesRes.data?.map(item => ({ ...item, media_type: 'anime' as const })) || []),
          ...(moviesRes.data?.map(item => ({ ...item, media_type: 'movie' as const })) || []),
          ...(seriesRes.data?.map(item => ({ ...item, media_type: 'series' as const })) || [])
        ].sort((a, b) => b.views - a.views).slice(0, 21);

        setMediaList(combined);
      } catch (error) {
        console.error('Error fetching trending media:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingMedia();
  }, []);

  if (loading) {
    return (
      <section className="relative my-6 px-4">
        <div className="max-w-[1600px] mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-4">Trending</h2>
          <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="min-w-[200px] h-[280px] bg-secondary animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`relative group/section px-0 md:bg-gradient-to-t md:from-background md:via-background/90 md:to-transparent md:pt-6 z-10 ${
      isTabletOrMobile ? '-mt-[20px] mb-px' : '-mt-[140px] md:pb-4'
    }`}>
      <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none z-[1]" />
      
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center mb-2 px-4 md:px-6">
          <h2 className="relative z-[5] text-2xl md:text-2xl max-md:text-base font-bold text-foreground">
            Trending
          </h2>
        </div>
        
        <div className="relative">
          {/* Left Navigation Arrow - Desktop Only */}
          {!isTabletOrMobile && (
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

          <div ref={scrollContainerRef} className="flex overflow-x-auto gap-1 max-md:gap-0 pb-0 scrollbar-hide px-4 md:px-6 max-md:px-1 scroll-smooth">
            {mediaList.map((item, index) => {
              const detailPath = item.media_type === 'anime' 
                ? `/anime/${item.anilist_id || item.id}` 
                : item.media_type === 'movie' 
                ? `/watch/movie/${item.tmdb_id}` 
                : `/watch/series/${item.tmdb_id}/1/1`;
              
              const cardContent = (
                <Link 
                  to={detailPath}
                  className={`group flex items-stretch rounded-lg overflow-hidden border border-border/50 ${
                    isTabletOrMobile
                      ? 'min-w-[192px] h-[269px] transition-none' 
                      : 'min-w-[251px] md:min-w-[251px] max-md:min-w-[calc((50%-0.25rem)*0.92)] max-md:scale-100 max-md:mr-1 h-[352px] md:hover:border-primary/50 transition-all duration-300'
                  }`}
                >
                  <div className={`flex-shrink-0 bg-gradient-to-b from-primary/20 via-primary/10 to-primary/5 flex flex-col items-center justify-start relative ${
                    isTabletOrMobile ? 'w-12 pt-2.5 pb-2.5' : 'w-16 pt-4 pb-4'
                  }`}>
                    <span className={`font-bold text-primary group-hover:text-primary/80 transition-colors ${
                      isTabletOrMobile ? 'text-xl mb-1.5' : 'text-3xl mb-3'
                    }`} style={{ fontFamily: 'serif' }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    
                    <div className="writing-mode-vertical flex-1 flex items-center justify-center overflow-hidden">
                      <p className={`font-semibold text-foreground/90 group-hover:text-primary transition-colors truncate px-1 ${
                        isTabletOrMobile ? 'text-[9px] max-w-[180px]' : 'text-xs max-w-[240px]'
                      }`}>
                        {item.title}
                      </p>
                    </div>
                  </div>

                  <div className={`relative flex-shrink-0 bg-card ${
                    isTabletOrMobile ? 'w-[145px] h-[269px]' : 'w-[190px] h-[352px]'
                  }`}>
                    <img 
                      src={item.thumbnail} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    
                    <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent ${
                      isTabletOrMobile ? 'p-1' : 'p-2'
                    }`}>
                      <div className={`flex items-center gap-2 text-muted-foreground ${
                        isTabletOrMobile ? 'text-[9px]' : 'text-xs'
                      }`}>
                        {item.type && (
                          <span className={`bg-primary/20 text-primary rounded ${
                            isTabletOrMobile ? 'px-1 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[10px]'
                          }`}>
                            {item.type}
                          </span>
                        )}
                        {item.rating && (
                          <span className={`flex items-center gap-1 ${
                            isTabletOrMobile ? 'text-[8px]' : 'text-[10px]'
                          }`}>
                            ⭐ {item.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
              
              return isTabletOrMobile ? (
                <div key={`${item.media_type}-${item.id}`}>{cardContent}</div>
              ) : (
                <CardWithFadeIn key={`${item.media_type}-${item.id}`} delay={index * 30}>
                  {cardContent}
                </CardWithFadeIn>
              );
            })}
          </div>

          {/* Right Navigation Arrow - Desktop Only */}
          {!isTabletOrMobile && (
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
