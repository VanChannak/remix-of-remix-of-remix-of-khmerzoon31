import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface WatchlistItem {
  id: string;
  media_id: string;
  media_type: string;
  created_at: string;
  media?: {
    id: string;
    title: string;
    thumbnail: string;
    backdrop_url?: string;
    rating?: number;
    release_year?: number;
    tmdb_id?: string;
  };
}

const Watchlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchWatchlist();
  }, [user]);

  const fetchWatchlist = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: watchlistData, error } = await supabase
        .from('user_watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (watchlistData && watchlistData.length > 0) {
        // Fetch media details
        const movieIds = watchlistData
          .filter(item => item.media_type === 'movie')
          .map(item => item.media_id);
        
        const seriesIds = watchlistData
          .filter(item => item.media_type === 'series')
          .map(item => item.media_id);

        const [moviesResult, seriesResult] = await Promise.all([
          movieIds.length > 0
            ? supabase
                .from('movies')
                .select('id, title, thumbnail, backdrop_url, rating, release_year, tmdb_id')
                .in('id', movieIds)
            : { data: [] },
          seriesIds.length > 0
            ? supabase
                .from('series')
                .select('id, title, thumbnail, backdrop_url, rating, release_year, tmdb_id')
                .in('id', seriesIds)
            : { data: [] },
        ]);

        const allMedia = [...(moviesResult.data || []), ...(seriesResult.data || [])];
        
        const enrichedWatchlist = watchlistData.map(item => ({
          ...item,
          media: allMedia.find(m => m.id === item.media_id)
        })).filter(item => item.media); // Filter out items without media data

        setWatchlist(enrichedWatchlist);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to load watchlist",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setWatchlist(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Removed",
        description: "Removed from your watchlist",
      });
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove from watchlist",
        variant: "destructive"
      });
    }
  };

  const handleWatch = (item: WatchlistItem) => {
    if (!item.media) return;
    
    const path = item.media_type === 'movie'
      ? `/watch/movie/${item.media.tmdb_id || item.media.id}`
      : `/watch/series/${item.media.tmdb_id || item.media.id}`;
    
    navigate(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Watchlist</h1>
          <p className="text-muted-foreground">
            {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {watchlist.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">Your watchlist is empty</p>
            <Button onClick={() => navigate('/')}>
              Browse Content
            </Button>
          </div>
        ) : (
          <div className={`grid gap-4 ${
            isMobile 
              ? 'grid-cols-2' 
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
          }`}>
            {watchlist.map((item) => (
              <Card key={item.id} className="overflow-hidden group">
                <div className="relative aspect-[2/3]">
                  <img
                    src={item.media?.thumbnail || "/placeholder.svg"}
                    alt={item.media?.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleWatch(item)}
                      className="rounded-full"
                    >
                      <Play className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => removeFromWatchlist(item.id)}
                      className="rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                    {item.media?.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.media?.release_year && <span>{item.media.release_year}</span>}
                    {item.media?.rating && (
                      <>
                        <span>•</span>
                        <span>⭐ {item.media.rating.toFixed(1)}</span>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
