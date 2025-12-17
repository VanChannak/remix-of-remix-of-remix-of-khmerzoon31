import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Film, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface WatchHistoryItem {
  id: string;
  progress: number;
  duration: number;
  completed: boolean;
  last_watched_at: string;
  episode_id: string | null;
  movie_id: string | null;
  episodes?: {
    id: string;
    name: string;
    episode_number: number;
    still_path: string | null;
    season_id: string;
    seasons?: {
      season_number: number;
      media_id: string;
      series?: {
        title: string;
        backdrop_url: string | null;
        tmdb_id: string | null;
      };
    };
  };
  movies?: {
    id: string;
    title: string;
    thumbnail: string;
    tmdb_id: string | null;
  };
}

export const ActivityTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWatchHistory();
    }
  }, [user]);

  const loadWatchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select(`
          id,
          progress,
          duration,
          completed,
          last_watched_at,
          episode_id,
          movie_id,
          episodes (
            id,
            name,
            episode_number,
            still_path,
            season_id,
            seasons (
              season_number,
              media_id,
              series:media_id (
                title,
                backdrop_url,
                tmdb_id
              )
            )
          ),
          movies (
            id,
            title,
            thumbnail,
            tmdb_id
          )
        `)
        .eq('user_id', user?.id)
        .order('last_watched_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setWatchHistory(data || []);
    } catch (error) {
      console.error('Error loading watch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: WatchHistoryItem) => {
    if (item.episode_id && item.episodes?.seasons?.series?.tmdb_id) {
      navigate(`/watch/series/${item.episodes.seasons.series.tmdb_id}/${item.episodes.seasons.season_number}/${item.episodes.episode_number}`);
    } else if (item.movie_id && item.movies?.tmdb_id) {
      navigate(`/watch/movie/${item.movies.tmdb_id}`);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-32 h-20 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (watchHistory.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Play className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No watch history yet. Start watching to see your activity here!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {watchHistory.map((item) => {
        const progressPercent = item.duration > 0 ? (item.progress / item.duration) * 100 : 0;
        const isEpisode = !!item.episode_id;
        const title = isEpisode
          ? `${item.episodes?.seasons?.series?.title || 'Series'} - Ep ${item.episodes?.episode_number}`
          : item.movies?.title || 'Movie';
        const thumbnail = isEpisode
          ? (item.episodes?.still_path || item.episodes?.seasons?.series?.backdrop_url)
          : item.movies?.thumbnail;

        return (
          <Card
            key={item.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => handleItemClick(item)}
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="relative w-32 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {isEpisode ? <Tv className="w-8 h-8 text-muted-foreground" /> : <Film className="w-8 h-8 text-muted-foreground" />}
                    </div>
                  )}
                  {item.completed && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge variant="secondary" className="text-xs">Completed</Badge>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium truncate">{title}</h3>
                    <Badge variant="outline" className="flex-shrink-0">
                      {isEpisode ? <Tv className="w-3 h-3 mr-1" /> : <Film className="w-3 h-3 mr-1" />}
                      {isEpisode ? 'Episode' : 'Movie'}
                    </Badge>
                  </div>
                  {!item.completed && (
                    <Progress value={progressPercent} className="h-1 mb-2" />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.last_watched_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
