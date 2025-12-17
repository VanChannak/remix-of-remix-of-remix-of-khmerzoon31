import { Header } from "@/components/public/Header";
import { MediaCard } from "@/components/public/MediaCard";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "@/hooks/useInView";

interface Series {
  id: string;
  title: string;
  thumbnail: string;
  rating: number;
  type: string;
  release_year: number;
  tmdb_id?: string;
}

const ITEMS_PER_PAGE = 24;

const NewSeriesPage = () => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { ref: loadMoreTrigger, isInView: isLoadMoreInView } = useInView({ threshold: 0.1 });

  const fetchSeries = useCallback(async (pageNum: number) => {
    try {
      const from = pageNum * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from('series')
        .select('*', { count: 'exact' })
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        if (pageNum === 0) {
          setSeriesList(data);
        } else {
          setSeriesList(prev => [...prev, ...data]);
        }
        setHasMore(data.length === ITEMS_PER_PAGE && (count ? from + data.length < count : true));
      }
    } catch (error) {
      console.error('Error fetching new series:', error);
    }
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      await fetchSeries(0);
      setLoading(false);
    };
    loadInitial();
  }, [fetchSeries]);

  useEffect(() => {
    if (isLoadMoreInView && !loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      fetchSeries(nextPage).then(() => {
        setPage(nextPage);
        setLoadingMore(false);
      });
    }
  }, [isLoadMoreInView, loadingMore, hasMore, page, loading, fetchSeries]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <h1 className="text-3xl font-bold text-foreground mb-8">New Series</h1>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="w-full h-[320px] bg-secondary animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {seriesList.map((series, index) => (
                  <div
                    key={series.id}
                    className="animate-fade-in"
                    style={{
                      animationDelay: `${Math.min(index, 24) * 30}ms`
                    }}
                  >
                    <MediaCard
                      id={series.id}
                      title={series.title}
                      image={series.thumbnail}
                      rating={series.rating}
                      type={series.type}
                      year={series.release_year}
                      tmdb_id={series.tmdb_id}
                    />
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <div ref={loadMoreTrigger} className="flex justify-center mt-8">
                  {loadingMore && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 w-full">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="w-full h-[320px] bg-secondary animate-pulse rounded-lg" />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default NewSeriesPage;
