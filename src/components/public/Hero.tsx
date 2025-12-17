import { Play, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsTablet } from "@/hooks/use-tablet";
import { Link } from "react-router-dom";
interface Anime {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  backdrop_url: string;
  rating: number;
  release_year: number;
  type: string;
  tmdb_id?: string;
}
export const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const isTablet = useIsTablet();
  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        const {
          data: featuredData,
          error: featuredError
        } = await supabase.from('featured_content').select('*').order('display_order', {
          ascending: true
        });
        if (featuredError) throw featuredError;
        if (!featuredData || featuredData.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch media details for each featured item
        const mediaPromises = featuredData.map(async item => {
          if (item.media_type === 'anime') {
            const {
              data
            } = await supabase.from('animes').select('id, title, description, thumbnail, backdrop_url, rating, release_year, type').eq('id', item.media_id).eq('status', 'published').maybeSingle();
            return data;
          } else if (item.media_type === 'series') {
            const {
              data
            } = await supabase.from('series').select('id, title, description, thumbnail, backdrop_url, rating, release_year, type, tmdb_id').eq('id', item.media_id).eq('status', 'published').maybeSingle();
            return data;
          } else {
            // For movies, fetch all fields including backdrop_url using type assertion
            const {
              data
            } = (await supabase.from('movies').select('id, title, description, thumbnail, rating, release_year, type, tmdb_id').eq('id', item.media_id).eq('status', 'published').maybeSingle()) as any;
            if (!data) return null;

            // Query backdrop_url separately with type assertion
            const {
              data: backdropData
            } = (await supabase.from('movies').select('backdrop_url').eq('id', item.media_id).single()) as any;
            return {
              ...data,
              backdrop_url: backdropData?.backdrop_url || data.thumbnail
            };
          }
        });
        const mediaResults = await Promise.all(mediaPromises);
        const validMedia = mediaResults.filter(item => item !== null);
        if (validMedia.length > 0) {
          setAnimeList(validMedia);
        }
      } catch (error) {
        console.error('Error fetching featured content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedContent();
  }, []);
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % animeList.length);
  };
  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + animeList.length) % animeList.length);
  };
  useEffect(() => {
    if (!isAutoPlaying || animeList.length === 0) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentSlide, animeList.length]);

  // Swipe handlers for touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swiped left - next slide
        nextSlide();
      } else {
        // Swiped right - previous slide
        prevSlide();
      }
      setIsAutoPlaying(false);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };
  if (loading || animeList.length === 0) {
    return <section className={`relative overflow-hidden bg-secondary animate-pulse ${isTablet ? 'aspect-video' : 'h-screen min-h-[600px]'}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl text-muted-foreground">Loading...</div>
        </div>
      </section>;
  }
  const currentAnime = animeList[currentSlide];
  return <section 
      className={`relative overflow-hidden group ${isTablet ? 'aspect-video' : 'h-screen min-h-[600px]'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Images */}
      {animeList.map((anime, index) => <Link
          key={anime.id}
          to={anime.type === 'movie' ? `/watch/movie/${(anime as any).tmdb_id || anime.id}` : anime.type === 'series' ? `/watch/series/${(anime as any).tmdb_id || anime.id}/1/1` : `/watch/${anime.type}/${anime.id}`}
          className={`absolute inset-0 transition-opacity duration-700 ${index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          {/* Poster on Mobile, Banner on Desktop */}
          <img src={anime.thumbnail} alt={anime.title} className="md:hidden w-full h-full object-cover" />
          <img src={anime.backdrop_url || anime.thumbnail} alt={anime.title} className="hidden md:block w-full h-full object-cover" />
          {/* Gradient overlays */}
          {isTablet ? (
            // Tablet: Bottom to top gradient - 30% height
            <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-background via-background/60 to-transparent" />
          ) : (
            <>
              {/* Desktop: Clean gradient overlay like iQIYI */}
              <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
              {/* Mobile: Bottom to top gradient */}
              <div className="md:hidden absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </>
          )}
        </Link>)}

      {/* Content */}
      {isTablet ? (
        // Tablet: Simplified layout with just title and controls
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <h2 className="text-xl font-bold text-white drop-shadow-lg line-clamp-1">
            {currentAnime.title}
          </h2>
        </div>
      ) : (
        <div className="relative max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 h-full flex items-center pt-16 pb-24">
          <div className="max-w-lg md:max-w-xl space-y-3 md:space-y-4">
            <div key={`content-${currentSlide}`} className="animate-fade-in space-y-3 md:space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5">
                  TOP {currentSlide + 1}
                </Badge>
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight line-clamp-2">
                {currentAnime.title}
              </h2>

              <div className="flex items-center gap-3 text-sm text-foreground/70">
                <span className="flex items-center gap-1">
                  ⭐ <span className="font-medium">{currentAnime.rating}</span>
                </span>
                <span className="text-foreground/30">•</span>
                <span>{currentAnime.release_year}</span>
                <span className="text-foreground/30">•</span>
                <span className="text-xs">{currentAnime.type}</span>
              </div>

              <p className="text-sm md:text-base text-foreground/60 leading-relaxed line-clamp-2 max-w-xl">
                {currentAnime.description}
              </p>

              <div className="flex gap-3 pt-1">
                <Link to={currentAnime.type === 'movie' ? `/watch/movie/${(currentAnime as any).tmdb_id || currentAnime.id}` : currentAnime.type === 'series' ? `/watch/series/${(currentAnime as any).tmdb_id || currentAnime.id}/1/1` : `/watch/${currentAnime.type}/${currentAnime.id}`}>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all rounded-md px-6 h-10">
                    <Play className="mr-2 h-4 w-4 fill-white" />
                    Play
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="bg-background/50 backdrop-blur-sm border-foreground/10 hover:bg-background/80 hover:border-foreground/20 text-foreground rounded-md px-6 h-10">
                  <Plus className="mr-2 h-4 w-4" />
                  My List
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Arrows - Only on Desktop - Show on hover */}
      {!isTablet && (
        <>
          <button onClick={() => {
            prevSlide();
            setIsAutoPlaying(false);
          }} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/30 hover:bg-background/60 backdrop-blur-sm p-2.5 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:scale-110 border border-primary/20">
            <ChevronLeft className="h-5 w-5 text-primary" />
          </button>
          <button onClick={() => {
            nextSlide();
            setIsAutoPlaying(false);
          }} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/30 hover:bg-background/60 backdrop-blur-sm p-2.5 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:scale-110 border border-primary/20">
            <ChevronRight className="h-5 w-5 text-primary" />
          </button>
        </>
      )}

      {/* Play Button and Dots - Tablet Layout */}
      {isTablet ? (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
          <Link to={currentAnime.type === 'movie' ? `/watch/movie/${(currentAnime as any).tmdb_id || currentAnime.id}` : currentAnime.type === 'series' ? `/watch/series/${(currentAnime as any).tmdb_id || currentAnime.id}/1/1` : `/watch/${currentAnime.type}/${currentAnime.id}`}>
            <button className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors">
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            </button>
          </Link>
          <div className="flex gap-1.5">
            {animeList.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentSlide(index);
                  setIsAutoPlaying(false);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentSlide ? "w-6 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        // Desktop Dots Indicator
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {animeList.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index);
                setIsAutoPlaying(false);
              }}
              className={`h-1 rounded-full transition-all ${
                index === currentSlide ? "w-6 bg-primary" : "w-1 bg-foreground/30 hover:bg-foreground/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>;
};