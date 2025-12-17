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
export const LatestAnime = () => {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    ref,
    isInView
  } = useInView({
    threshold: 0.1
  });
  useEffect(() => {
    const fetchLatestAnime = async () => {
      try {
        const {
          data,
          error
        } = await supabase.from('animes').select('*').eq('status', 'published').order('created_at', {
          ascending: false
        }).limit(14);
        if (error) throw error;
        if (data) {
          setAnimeList(data);
        }
      } catch (error) {
        console.error('Error fetching latest anime:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestAnime();
  }, []);
  if (loading) {
    return <section className="py-8">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">Latest Anime</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => <div key={i} className="w-full h-[320px] bg-secondary animate-pulse rounded-lg" />)}
          </div>
        </div>
      </section>;
  }
  return <section ref={ref} className="py-8">
      
    </section>;
};