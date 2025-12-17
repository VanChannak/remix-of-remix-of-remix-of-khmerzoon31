import { MediaCard } from "./MediaCard";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "@/hooks/useInView";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsTablet } from "@/hooks/use-tablet";
import { useIsMobile } from "@/hooks/use-mobile";

interface Movie {
  id: string;
  title: string;
  thumbnail: string;
  rating: number;
  type: string;
  release_year: number;
  tmdb_id?: string;
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

export const NewMoviesSection = () => {
  const [moviesList, setMoviesList] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, [moviesList]);

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
    const fetchNewMovies = async () => {
      try {
        const { data, error } = await supabase
          .from('movies')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(21);

        if (error) throw error;
        if (data) {
          setMoviesList(data);
        }
      } catch (error) {
        console.error('Error fetching new movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewMovies();
  }, []);

  if (loading) {
    return (
      <section className={`relative my-6 ${isTablet ? 'px-2' : 'px-4'}`}>
        <div className="max-w-[1600px] mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-4">New Movies</h2>
          <div className="flex gap-3 overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="min-w-[180px] h-[270px] bg-secondary animate-pulse rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const displayMovies = isTablet ? moviesList.slice(0, 10) : moviesList;

  // Desktop: Horizontal scroll with arrows
  if (isDesktop) {
    return (
      <section className="relative group/section py-4">
        <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none z-[1]" />
        
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-3 px-4 md:px-6">
            <Link to="/new-movies" className="flex items-center gap-2 group/link">
              <h2 className="text-xl md:text-2xl font-bold text-foreground group-hover/link:text-primary transition-colors">
                New Movies
              </h2>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover/link:text-primary transition-colors" />
            </Link>
          </div>

          <div className="relative">
            {/* Left Navigation Arrow */}
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

            <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-6 scroll-smooth">
              {displayMovies.map((movie, index) => (
                <CardWithFadeIn key={movie.id} delay={index * 50}>
                  <div className="w-[180px] flex-shrink-0">
                    <MediaCard
                      id={movie.id}
                      title={movie.title}
                      image={movie.thumbnail}
                      rating={movie.rating}
                      type={movie.type}
                      year={movie.release_year}
                      tmdb_id={movie.tmdb_id}
                    />
                  </div>
                </CardWithFadeIn>
              ))}
            </div>

            {/* Right Navigation Arrow */}
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
          </div>
        </div>
      </section>
    );
  }

  // Tablet/Mobile: Grid layout
  return (
    <section className={`relative ${isTablet ? 'my-px px-2' : 'my-6 md:my-6 max-md:my-3 px-4 md:px-4 max-md:px-0'}`}>
      <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none z-[1]" />
      
      <div className="max-w-[1600px] mx-auto">
        <div className={`flex items-center justify-between ${isTablet ? 'mb-2 px-2' : 'mb-4 max-md:mb-2 max-md:px-2'}`}>
          <Link to="/new-movies" className="flex items-center gap-2 group">
            <h2 className={`relative z-[5] font-bold text-foreground group-hover:text-primary transition-colors ${isTablet ? 'text-lg' : 'text-2xl md:text-2xl max-md:text-base'}`}>
              New Movies
            </h2>
            <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>
        
        <div className={`grid ${isTablet ? 'grid-cols-5 gap-2' : 'grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-3 max-md:gap-1'}`}>
          {displayMovies.map((movie) => (
            <div key={movie.id} className="h-[calc(100%*1.10)]">
              <MediaCard
                id={movie.id}
                title={movie.title}
                image={movie.thumbnail}
                rating={movie.rating}
                type={movie.type}
                year={movie.release_year}
                tmdb_id={movie.tmdb_id}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
