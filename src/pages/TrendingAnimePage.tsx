import { Header } from "@/components/public/Header";
import { AnimeCard } from "@/components/public/AnimeCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "@/hooks/useInView";

interface Anime {
  id: string;
  title: string;
  thumbnail: string;
  episodes_count: number;
  rating: number;
  type: string;
}

const TrendingAnimePage = () => {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref, isInView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    const fetchTrendingAnime = async () => {
      try {
        const { data, error } = await supabase
          .from('animes')
          .select('*')
          .eq('status', 'published')
          .order('views', { ascending: false });

        if (error) throw error;
        if (data) {
          setAnimeList(data);
        }
      } catch (error) {
        console.error('Error fetching trending anime:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingAnime();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <h1 className="text-3xl font-bold text-foreground mb-8">Trending Anime</h1>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="w-full h-[320px] bg-secondary animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {animeList.map((anime, index) => (
                <div
                  key={anime.id}
                  className="transition-all duration-700"
                  style={{
                    transitionDelay: isInView ? `${index * 30}ms` : '0ms',
                    opacity: isInView ? 1 : 0,
                    transform: isInView ? 'translateY(0)' : 'translateY(20px)'
                  }}
                >
                  <AnimeCard
                    id={anime.id}
                    title={anime.title}
                    image={anime.thumbnail}
                    episodes={anime.episodes_count}
                    rating={anime.rating}
                    type={anime.type}
                    rank={index + 1}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TrendingAnimePage;
