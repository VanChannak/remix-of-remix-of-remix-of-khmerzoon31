import { AnimeCard } from "./AnimeCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "@/hooks/useInView";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Anime {
  id: string;
  title: string;
  thumbnail: string;
  episodes_count: number;
  rating: number;
  type: string;
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

export const TopAnimeSection = () => {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopAnime = async () => {
      try {
        const { data, error } = await supabase
          .from('animes')
          .select('*')
          .eq('status', 'published')
          .order('rating', { ascending: false })
          .limit(18);

        if (error) throw error;
        if (data) {
          setAnimeList(data);
        }
      } catch (error) {
        console.error('Error fetching top anime:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopAnime();
  }, []);

  if (loading) {
    return (
      <section className="relative my-16 px-4">
        <div className="max-w-[1600px] mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Top Anime</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {[...Array(18)].map((_, i) => (
              <div key={i} className="h-[320px] bg-secondary animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative my-16 px-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="relative z-[5] text-2xl font-bold text-foreground">
            Top Anime
          </h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {animeList.map((anime, index) => (
            <CardWithFadeIn key={anime.id} delay={index * 50}>
              <AnimeCard
                id={anime.id}
                title={anime.title}
                image={anime.thumbnail}
                episodes={anime.episodes_count}
                rating={anime.rating}
                type={anime.type}
              />
            </CardWithFadeIn>
          ))}
        </div>
        
        <div className="flex justify-center mt-8">
          <Link to="/anime">
            <Button variant="outline" className="gap-2 min-w-[200px]">
              More
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
