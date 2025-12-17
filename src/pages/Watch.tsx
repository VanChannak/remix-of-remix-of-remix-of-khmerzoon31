import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Film, Tv, ThumbsUp, ThumbsDown, Share2, Flag, LayoutGrid, Heart, ShoppingBag, LayoutDashboard, Download, MoreVertical, Sparkles, MessageSquare, Info, ChevronDown, Wallet, Crown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/VideoPlayer";
import { useIsTablet } from "@/hooks/use-tablet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommentsSection } from "@/components/CommentsSection";
import { useDeviceSession } from "@/hooks/useDeviceSession";
import { DeviceLimitWarning } from "@/components/DeviceLimitWarning";
import { useSwipeScroll } from "@/hooks/useSwipeScroll";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useSubscription } from "@/hooks/useSubscription";
import { CastSkeleton, EpisodesSkeleton, RecommendedSkeleton } from "@/components/watch/ContentSkeleton";
import { ActionButtons } from "@/components/watch/ActionButtons";
import { SocialShareMeta } from "@/components/SocialShareMeta";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TopupDialog } from "@/components/wallet/TopupDialog";
import { SubscriptionDialog } from "@/components/subscription/SubscriptionDialog";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import CastMemberDialog from "@/components/movie/CastMemberDialog";
import { useProfileImage } from "@/hooks/useProfileImage";

type VideoSourceDB = Database['public']['Tables']['video_sources']['Row'];

interface Episode {
  id: string;
  episode_number: number;
  name: string;
  still_path?: string;
  season_id?: string;
  access?: 'free' | 'rent' | 'vip';
}

interface Content {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  backdrop_url?: string;
  type: 'movie' | 'series';
  access?: 'free' | 'rent' | 'vip';
  exclude_from_plan?: boolean;
  rental_price?: number;
  rental_period_days?: number;
}

// Collapsible Tabs Section Component
interface CollapsibleTabsSectionProps {
  isSeriesContent: boolean;
  seasons: any[];
  selectedSeasonId: string | null;
  setSelectedSeasonId: (id: string) => void;
  episodes: Episode[];
  episodesLoading: boolean;
  content: Content | null;
  currentEpisode: Episode | null;
  fetchVideoSource: (episodeId: string) => void;
  getProgressPercentage: (episodeId: string) => number;
  forYouContent: any[];
  navigate: (path: string) => void;
  isAnime?: boolean;
}

const CollapsibleTabsSection = ({
  isSeriesContent,
  seasons,
  selectedSeasonId,
  setSelectedSeasonId,
  episodes,
  episodesLoading,
  content,
  currentEpisode,
  fetchVideoSource,
  getProgressPercentage,
  forYouContent,
  navigate,
}: CollapsibleTabsSectionProps) => {
  const [episodesExpanded, setEpisodesExpanded] = useState(false);

  return (
    <Tabs defaultValue="episodes" className="w-full">
      <TabsList className="w-full justify-around bg-transparent border-b rounded-none h-auto p-0">
        {isSeriesContent && (
          <TabsTrigger 
            value="episodes"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-1.5 text-xs gap-1"
          >
            <Film className="h-3.5 w-3.5" />
            Episodes
          </TabsTrigger>
        )}
        <TabsTrigger 
          value="foryou"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-1.5 text-xs gap-1"
        >
          <Sparkles className="h-3.5 w-3.5" />
          For You
        </TabsTrigger>
        <TabsTrigger 
          value="comments"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-1.5 text-xs gap-1"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Comments
        </TabsTrigger>
        <TabsTrigger 
          value="detail"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-1.5 text-xs gap-1"
        >
          <Info className="h-3.5 w-3.5" />
          Detail
        </TabsTrigger>
        <TabsTrigger 
          value="home"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-1.5 text-xs gap-1"
        >
          <Home className="h-3.5 w-3.5" />
          Home
        </TabsTrigger>
      </TabsList>

      <TabsContent value="episodes" className="mt-2">
        {/* Series Banner - Landscape Backdrop */}
        {isSeriesContent && content && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-2 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => setEpisodesExpanded(!episodesExpanded)}
          >
            <img 
              src={content.backdrop_url || content.thumbnail || "/placeholder.svg"} 
              alt={content.title}
              className="w-full aspect-[21/9] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
              {/* Cycle Poster */}
              <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 shadow-lg">
                <img 
                  src={content.thumbnail || "/placeholder.svg"} 
                  alt={content.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Title and Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{content.title}</p>
                <p className="text-xs text-primary font-medium">
                  {currentEpisode ? `Watching S1 EP${currentEpisode.episode_number}` : 'Watching'}
                </p>
                <p className="text-[10px] text-white/70">
                  {episodes.length} Episodes
                </p>
              </div>
              {/* More Episodes + Expand Icon */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-white/80 font-medium">More Episodes</span>
                <motion.div
                  animate={{ rotate: episodesExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/20 rounded-full p-1 backdrop-blur-sm"
                >
                  <ChevronDown className="h-3.5 w-3.5 text-white" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
        
        <AnimatePresence mode="wait">
          {isSeriesContent && episodesExpanded && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {/* Season Selector - Only show if more than 1 season */}
              {seasons.length > 1 && (
                <div className="flex gap-1 mb-2 flex-wrap">
                  {seasons.map((season) => (
                    <Button
                      key={season.id}
                      variant={selectedSeasonId === season.id ? "default" : "outline"}
                      size="sm"
                      className={`h-7 px-3 text-xs ${selectedSeasonId === season.id ? "bg-primary hover:bg-primary/90" : ""}`}
                      onClick={() => setSelectedSeasonId(season.id)}
                    >
                      Season {season.season_number}
                    </Button>
                  ))}
                </div>
              )}

              {/* Episodes Grid - Compact layout */}
              {episodesLoading ? (
                <EpisodesSkeleton />
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {episodes.map((ep) => {
                    const progressPercent = getProgressPercentage(ep.id);
                    return (
                      <motion.div
                        key={ep.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="relative aspect-video rounded overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-all hover:scale-[1.02]"
                        onClick={() => fetchVideoSource(ep.id)}
                      >
                        <img
                          src={ep.still_path || content?.backdrop_url || "/placeholder.svg"}
                          alt={`Episode ${ep.episode_number}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Access Badge - Top Right */}
                        {ep.access && ep.access !== 'free' && (
                          <div className="absolute top-0.5 right-0.5">
                            <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold ${
                              ep.access === 'vip' 
                                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black' 
                                : 'bg-primary text-primary-foreground'
                            }`}>
                              {ep.access === 'vip' ? (
                                <Crown className="h-2.5 w-2.5" />
                              ) : (
                                <ShoppingBag className="h-2.5 w-2.5" />
                              )}
                              <span className="uppercase">{ep.access}</span>
                            </div>
                          </div>
                        )}
                        {ep.access === 'free' && (
                          <div className="absolute top-0.5 right-0.5">
                            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold bg-green-500 text-white">
                              <span>FREE</span>
                            </div>
                          </div>
                        )}
                        {/* Progress Bar */}
                        {progressPercent > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/50">
                            <div 
                              className="h-full bg-red-600 transition-all"
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            />
                          </div>
                        )}
                        {/* Episode Number */}
                        <div className="absolute bottom-0.5 left-0.5">
                          <span className="text-lg font-black text-white/90 leading-none" style={{
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            {ep.episode_number}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </TabsContent>

      <TabsContent value="foryou" className="mt-2">
        <div className="grid grid-cols-4 gap-1">
          {forYouContent && forYouContent.length > 0 ? (
            forYouContent.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="cursor-pointer"
                onClick={() => navigate(`/watch/${item.content_type}/${item.tmdb_id || item.id}`)}
              >
                <div className="aspect-[2/3] rounded overflow-hidden">
                  <img
                    src={item.poster_path || item.thumbnail || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                  />
                </div>
              </div>
            ))
          ) : (
            Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-[2/3] rounded overflow-hidden bg-muted"
              >
                <img
                  src="/placeholder.svg"
                  alt={`For You ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="comments" className="mt-2">
        <CommentsSection 
          episodeId={currentEpisode?.id}
          movieId={content?.type === 'movie' ? content.id : undefined}
        />
      </TabsContent>

      <TabsContent value="detail" className="mt-2">
        <div className="space-y-2">
          <div>
            <h4 className="font-semibold text-sm mb-1">Description</h4>
            <p className="text-muted-foreground text-xs">
              {content?.description || 'No description available.'}
            </p>
          </div>
          {(content as any)?.release_year && (
            <div>
              <h4 className="font-semibold text-sm mb-1">Release Year</h4>
              <p className="text-muted-foreground text-xs">{(content as any).release_year}</p>
            </div>
          )}
          {(content as any)?.genre && (
            <div>
              <h4 className="font-semibold text-sm mb-1">Genre</h4>
              <p className="text-muted-foreground text-xs">{(content as any).genre}</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="home" className="mt-2">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-2"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
            onClick={() => navigate('/')}
          >
            <Home className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Go to Home</span>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
            onClick={() => navigate('/series')}
          >
            <Tv className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Go to Series</span>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
            onClick={() => navigate('/movies')}
          >
            <Film className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Go to Movies</span>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Go to Dashboard</span>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </motion.div>
        </motion.div>
      </TabsContent>
    </Tabs>
  );
};

const Watch = () => {
  const { type, id, season, episode } = useParams<{ type: string; id: string; season?: string; episode?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance, loading: walletLoading } = useWallet();
  const { hasActiveSubscription, remainingDays } = useSubscription();
  const isTablet = useIsTablet();
  const isMobile = useIsMobile();
  
  // Device session management for streaming limits
  const { 
    sessions, 
    currentDeviceId, 
    canStream, 
    maxDevices, 
    loading: deviceSessionLoading,
    signOutDevice,
    signOutAllDevices 
  } = useDeviceSession();
  const [content, setContent] = useState<Content | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [videoSources, setVideoSources] = useState<VideoSourceDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [castMembers, setCastMembers] = useState<any[]>([]);
  const [selectedCastMember, setSelectedCastMember] = useState<any>(null);
  const [relatedContent, setRelatedContent] = useState<any[]>([]);
  const [forYouContent, setForYouContent] = useState<any[]>([]);
  const [watchHistory, setWatchHistory] = useState<Record<string, { progress: number; duration: number }>>({});
  const [castLoading, setCastLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ display_name: string | null; profile_picture_url: string | null } | null>(null);
  const [showTopupDialog, setShowTopupDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showDeviceLimitWarning, setShowDeviceLimitWarning] = useState(false);

  // Get signed URL for profile picture
  const { signedUrl: profileImageUrl } = useProfileImage({ 
    imagePath: userProfile?.profile_picture_url,
    userId: user?.id 
  });

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, profile_picture_url')
        .eq('id', user.id)
        .maybeSingle();
      if (data) setUserProfile(data);
    };
    fetchProfile();
  }, [user?.id]);

  // Show device limit warning when user can't stream
  useEffect(() => {
    if (!deviceSessionLoading && !canStream && sessions.length > 0) {
      setShowDeviceLimitWarning(true);
    }
  }, [canStream, deviceSessionLoading, sessions]);

  useEffect(() => {
    if (id) {
      fetchContentAndEpisodes();
    }
  }, [id, season, episode]);

  const fetchContentAndEpisodes = async () => {
    try {
      setLoading(true);
      setCastLoading(true);
      setEpisodesLoading(true);
      
      // Determine content type from URL pattern
      const isMovie = type === 'movie';
      const isSeries = type === 'series' || (season && episode);
      
      // Check if ID is numeric (TMDB ID) or UUID
      const isNumericId = /^\d+$/.test(id || '');
      
      console.log('Fetching content:', { type, id, season, episode, isMovie, isSeries, isNumericId });
      
      if (isMovie) {
        // Query by tmdb_id if numeric, otherwise by id
        const query = supabase.from('movies').select('*');
        const { data: movieData, error: movieError } = isNumericId
          ? await query.eq('tmdb_id', id).maybeSingle()
          : await query.eq('id', id).maybeSingle();
        
        console.log('Movie fetch result:', { movieData, movieError });

        if (!movieError && movieData) {
          setContent({
            id: movieData.id,
            title: movieData.title,
            description: movieData.description,
            thumbnail: movieData.thumbnail,
            backdrop_url: movieData.backdrop_url,
            type: 'movie',
            access: movieData.access,
            exclude_from_plan: movieData.exclude_from_plan || false,
            rental_price: movieData.rental_price || undefined,
            rental_period_days: movieData.rental_period_days || 7,
          });

          console.log('Fetching video sources for movie:', movieData.id);

          // Fetch video sources for movie - USE THE DATABASE UUID
          const { data: sourcesData } = await supabase
            .from('video_sources')
            .select('*')
            .eq('media_id', movieData.id)
            .order('is_default', { ascending: false });

          console.log('Movie video sources found:', sourcesData?.length);

          if (sourcesData) setVideoSources(sourcesData);

          // Fetch cast - USE THE DATABASE UUID and include tmdb_id
          const { data: castData } = await supabase
            .from('movie_cast')
            .select('id, actor_name, character_name, profile_url, order_index, tmdb_id')
            .eq('movie_id', movieData.id)
            .order('order_index', { ascending: true })
            .limit(10);

          if (castData) setCastMembers(castData);
          setCastLoading(false);

          // Fetch recommended movies (same genre)
          const { data: relatedData } = await supabase
            .from('movies')
            .select('id, title, thumbnail, tmdb_id, genre, rating')
            .eq('genre', movieData.genre)
            .neq('id', movieData.id)
            .order('rating', { ascending: false })
            .limit(12);
          
          if (relatedData) {
            setRelatedContent(relatedData.map(item => ({
              ...item,
              content_type: 'movie',
              poster_path: item.thumbnail
            })));
          }

          // Fetch "For You" personalized content
          await fetchForYouContent('movie', movieData.id, movieData.genre);
        }
      } else if (isSeries) {
        // Query by tmdb_id if numeric, otherwise by id
        const query = supabase.from('series').select('*');
        const { data: seriesData, error: seriesError } = isNumericId
          ? await query.eq('tmdb_id', id).maybeSingle()
          : await query.eq('id', id).maybeSingle();
        
        console.log('Series fetch result:', { seriesData, seriesError });

        if (!seriesError && seriesData) {
          setContent({
            id: seriesData.id,
            title: seriesData.title,
            description: seriesData.description,
            thumbnail: seriesData.thumbnail,
            backdrop_url: seriesData.backdrop_url,
            type: 'series',
            access: seriesData.access,
            exclude_from_plan: seriesData.exclude_from_plan || false,
            rental_price: seriesData.rental_price || undefined,
            rental_period_days: seriesData.rental_period_days || 7,
          });

          console.log('Fetching seasons for series UUID:', seriesData.id);
          
          // Fetch seasons and episodes - USE THE DATABASE UUID, NOT THE URL ID
          const { data: seasonsData } = await supabase
            .from('seasons')
            .select('*')
            .eq('media_id', seriesData.id)
            .order('season_number');
          
          console.log('Seasons found:', seasonsData);

          if (seasonsData && seasonsData.length > 0) {
            setSeasons(seasonsData);
            setSelectedSeasonId(seasonsData[0].id);
            
            const seasonIds = seasonsData.map(s => s.id);
            console.log('Fetching episodes for seasons:', seasonIds);
            
            const { data: episodesData } = await supabase
              .from('episodes')
              .select('*')
              .in('season_id', seasonIds)
              .order('episode_number', { ascending: true });
            
            console.log('Episodes found:', episodesData?.length);

            if (episodesData && episodesData.length > 0) {
              setEpisodes(episodesData);
              setEpisodesLoading(false);
              
              // If episode number is in URL, find and set that episode
              if (episode) {
                const targetEpisode = episodesData.find(ep => ep.episode_number === parseInt(episode));
                if (targetEpisode) {
                  setCurrentEpisode(targetEpisode);
                  fetchVideoSource(targetEpisode.id);
                } else {
                  setCurrentEpisode(episodesData[0]);
                  fetchVideoSource(episodesData[0].id);
                }
              } else {
                setCurrentEpisode(episodesData[0]);
                fetchVideoSource(episodesData[0].id);
              }
            }
          }

          // Fetch cast - USE THE DATABASE UUID and include tmdb_id
          const { data: castData } = await supabase
            .from('series_cast')
            .select('id, actor_name, character_name, profile_url, order_index, tmdb_id')
            .eq('series_id', seriesData.id)
            .order('order_index', { ascending: true })
            .limit(10);

          if (castData) setCastMembers(castData);
          setCastLoading(false);

          // Fetch recommended series (same genre)
          const { data: relatedData } = await supabase
            .from('series')
            .select('id, title, thumbnail, tmdb_id, genre, rating')
            .eq('genre', seriesData.genre)
            .neq('id', seriesData.id)
            .order('rating', { ascending: false })
            .limit(12);
          
          if (relatedData) {
            setRelatedContent(relatedData.map(item => ({
              ...item,
              content_type: 'series',
              poster_path: item.thumbnail
            })));
          }

          // Fetch "For You" personalized content
          await fetchForYouContent('series', seriesData.id, seriesData.genre);
        }
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to load content. Please check if the content exists.",
        variant: "destructive"
      });
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoSource = async (episodeId: string) => {
    try {
      console.log('Fetching video sources for episode:', episodeId);
      
      const { data, error } = await supabase
        .from('video_sources')
        .select('*')
        .eq('episode_id', episodeId)
        .order('is_default', { ascending: false });
      
      console.log('Video sources found:', data?.length, data);

      if (!error && data) {
        setVideoSources(data);
        const episode = episodes.find(ep => ep.id === episodeId);
        if (episode) {
          setCurrentEpisode(episode);
        }
      }
    } catch (error) {
      console.error('Error fetching video source:', error);
    }
  };

  // Fetch watch history for progress indicators
  useEffect(() => {
    const fetchWatchHistory = async () => {
      if (!user || episodes.length === 0) return;

      const episodeIds = episodes.map(ep => ep.id);
      const { data } = await supabase
        .from('watch_history')
        .select('episode_id, progress, duration')
        .eq('user_id', user.id)
        .in('episode_id', episodeIds);

      if (data) {
        const historyMap: Record<string, { progress: number; duration: number }> = {};
        data.forEach(item => {
          if (item.episode_id) {
            historyMap[item.episode_id] = {
              progress: item.progress,
              duration: item.duration,
            };
          }
        });
        setWatchHistory(historyMap);
      }
    };

    fetchWatchHistory();
  }, [user, episodes]);

  // Setup smooth scroll refs for horizontal sections
  const mobileCastScrollRef = useSwipeScroll({ enabled: true });
  const mobileEpisodesScrollRef = useSwipeScroll({ enabled: true });
  const mobileForYouScrollRef = useSwipeScroll({ enabled: true });
  
  const tabletCastScrollRef = useSwipeScroll({ enabled: true });
  const tabletEpisodesScrollRef = useSwipeScroll({ enabled: true });
  const tabletForYouScrollRef = useSwipeScroll({ enabled: true });
  const tabletRecommendedScrollRef = useSwipeScroll({ enabled: true });
  
  const desktopCastScrollRef = useSwipeScroll({ enabled: true });
  const desktopEpisodesScrollRef = useSwipeScroll({ enabled: true });

  // Fetch personalized "For You" content
  const fetchForYouContent = async (contentType: string, currentId: string, currentGenre: string) => {
    if (!user) {
      // If not logged in, show popular content from different genres
      const table = contentType === 'series' ? 'series' : 'movies';
      const { data } = await supabase
        .from(table)
        .select('id, title, thumbnail, tmdb_id, genre, rating, views')
        .neq('id', currentId)
        .order('views', { ascending: false })
        .limit(12);
      
      if (data) {
        setForYouContent(data.map(item => ({
          ...item,
          content_type: contentType,
          poster_path: item.thumbnail
        })));
      }
      return;
    }

    // Get user's watch history to understand preferences
    const { data: watchHistoryData } = await supabase
      .from('watch_history')
      .select('movie_id, episode_id')
      .eq('user_id', user.id)
      .limit(50);

    // Get user's liked content
    const { data: likesData } = await supabase
      .from('user_likes')
      .select('media_id, media_type')
      .eq('user_id', user.id)
      .eq('like_type', 'like')
      .limit(20);

    // Combine genres from watched and liked content
    const watchedIds = new Set<string>();
    if (watchHistoryData) {
      watchHistoryData.forEach(item => {
        if (contentType === 'movie' && item.movie_id) watchedIds.add(item.movie_id);
        // For series, we'd need to get series_id from episodes
      });
    }

    if (likesData) {
      likesData.forEach(item => {
        if (item.media_type === contentType) watchedIds.add(item.media_id);
      });
    }

    // Fetch content based on:
    // 1. Different genres than current (for variety)
    // 2. High ratings
    // 3. Exclude already watched
    // 4. Mix of popular and highly rated
    const table = contentType === 'series' ? 'series' : 'movies';
    const { data: mixedContent } = await supabase
      .from(table)
      .select('id, title, thumbnail, tmdb_id, genre, rating, views')
      .neq('id', currentId)
      .neq('genre', currentGenre)
      .gte('rating', 7)
      .order('rating', { ascending: false })
      .limit(8);

    const { data: popularContent } = await supabase
      .from(table)
      .select('id, title, thumbnail, tmdb_id, genre, rating, views')
      .neq('id', currentId)
      .order('views', { ascending: false })
      .limit(8);

    // Combine and deduplicate
    const combined = [...(mixedContent || []), ...(popularContent || [])];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    
    // Filter out watched content and shuffle
    const filtered = unique.filter(item => !watchedIds.has(item.id));
    const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 12);

    setForYouContent(shuffled.map(item => ({
      ...item,
      content_type: contentType,
      poster_path: item.thumbnail
    })));
  };

  // Calculate progress percentage
  const getProgressPercentage = (episodeId: string) => {
    const history = watchHistory[episodeId];
    if (!history || !history.duration || history.duration === 0) return 0;
    return (history.progress / history.duration) * 100;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Content Not Found</h2>
          <p className="text-muted-foreground">
            The {type} you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
            <Button variant="outline" onClick={() => navigate(type === 'movie' ? '/movies' : '/series')}>
              <Film className="mr-2 h-4 w-4" />
              Browse {type === 'movie' ? 'Movies' : 'Series'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Determine if this is a series or movie
  const isSeriesContent = type === 'series' || Boolean(season && episode);

  // Mobile Layout (Phone)
  if (isMobile && !isTablet) {
    return (
      <>
      <div className="min-h-screen bg-background text-foreground pb-20">
        <SocialShareMeta
          title={content.title}
          description={content.description || ''}
          image={content.backdrop_url || content.thumbnail}
          type={content.type === 'movie' ? 'video.movie' : 'video.tv_show'}
        />
        {/* Video Player */}
        {videoSources.length > 0 && (
          <VideoPlayer 
            videoSources={videoSources}
            onEpisodeSelect={fetchVideoSource}
            episodes={episodes}
            currentEpisodeId={currentEpisode?.id}
            contentBackdrop={content?.backdrop_url}
            accessType={content?.access}
            excludeFromPlan={content?.exclude_from_plan}
            rentalPrice={content?.rental_price}
            rentalPeriodDays={content?.rental_period_days}
            mediaId={content?.id}
            mediaType={content?.type}
            title={content?.title}
            movieId={content?.type === 'movie' ? content?.id : undefined}
          />
        )}

        {/* Content Section */}
        <div className="px-4 py-3">
          {/* User Profile with Wallet and Subscribe */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-12 h-12 border-2 border-primary flex-shrink-0 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <AvatarImage 
                src={profileImageUrl || undefined} 
                alt={userProfile?.display_name || user?.email || 'User'}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                {(userProfile?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold truncate">{userProfile?.display_name || user?.email?.split('@')[0] || 'Guest'}</h1>
              <div 
                className="flex items-center gap-1 text-xs text-primary font-medium cursor-pointer hover:text-primary/80"
                onClick={() => setShowTopupDialog(true)}
              >
                <Wallet className="h-3 w-3" />
                <span>{walletLoading ? '...' : `$${balance.toFixed(2)}`}</span>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className={`h-8 px-2 gap-1 text-xs ${hasActiveSubscription ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600' : 'border-primary/50 text-primary hover:bg-primary/10'}`}
              onClick={() => setShowSubscriptionDialog(true)}
            >
              <Crown className="h-3.5 w-3.5" />
              {hasActiveSubscription ? (
                <span className="flex items-center gap-1">
                  VIP
                  <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-yellow-500/20 text-yellow-600">
                    {remainingDays}d
                  </Badge>
                </span>
              ) : 'VIP'}
            </Button>
          </div>
          
          {/* Action Buttons - Separate row on mobile for better UX */}
          <div className="mb-4">
            <ActionButtons 
              contentId={content?.id}
              contentType={content?.type}
              episodeId={currentEpisode?.id}
              userId={user?.id}
              contentTitle={content?.title}
            />
          </div>

          {/* Content Poster, Title and Watching Info */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/40">
            <div className="w-12 h-16 rounded-lg overflow-hidden border-2 border-muted flex-shrink-0">
              <img
                src={content?.thumbnail || "/placeholder.svg"}
                alt={content?.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold truncate">{content?.title}</h2>
              <p className="text-xs text-primary">
                {isSeriesContent && currentEpisode 
                  ? `Watching S1 EP${currentEpisode.episode_number}` 
                  : isSeriesContent 
                    ? `${episodes.length} Episodes`
                    : 'Watching Movie'}
              </p>
            </div>
          </div>

          {/* Series Cast - Horizontal Scroll */}
          {castMembers.length > 0 && (
            <div className="mb-4">
              <div ref={mobileCastScrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
                {castMembers.slice(0, 10).map((member, idx) => (
                  <button 
                    key={idx} 
                    type="button"
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer bg-transparent border-none p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSelectedCastMember(member);
                    }}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-muted pointer-events-none">
                      <img
                        src={member.profile_url || "/placeholder.svg"}
                        alt={member.actor_name}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </div>
                    <p className="text-xs text-center max-w-[56px] truncate pointer-events-none">
                      {member.actor_name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tabs Section */}
          <Tabs defaultValue={isSeriesContent ? "episodes" : "foryou"} className="w-full">
            <TabsList className="w-full justify-around border-b rounded-none h-auto p-0 bg-transparent mb-4">
              {isSeriesContent && (
                <TabsTrigger 
                  value="episodes" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-3 py-2 text-xs data-[state=active]:text-red-500"
                >
                  Episodes
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="foryou" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-3 py-2 text-xs data-[state=active]:text-red-500"
              >
                For You
              </TabsTrigger>
              <TabsTrigger 
                value="comments" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-3 py-2 text-xs data-[state=active]:text-red-500"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Comments
              </TabsTrigger>
              <TabsTrigger 
                value="home" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-3 py-2 text-xs data-[state=active]:text-red-500"
              >
                <Home className="w-3 h-3 mr-1" />
                Home
              </TabsTrigger>
            </TabsList>

            {/* Episodes - Horizontal Scroll */}
            {isSeriesContent && (
              <TabsContent value="episodes" className="mt-0">
                <div ref={mobileEpisodesScrollRef} className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide scroll-smooth">
                  {episodes.slice(0, 8).map((episode) => {
                    const progressPercent = getProgressPercentage(episode.id);
                    return (
                      <div
                        key={episode.id}
                        onClick={() => fetchVideoSource(episode.id)}
                        className="flex-shrink-0 w-32 cursor-pointer"
                      >
                        <div className={`relative aspect-video rounded-md overflow-hidden mb-1.5 ${
                          currentEpisode?.id === episode.id ? 'ring-2 ring-primary' : ''
                        }`}>
                          <img
                            src={episode.still_path || content?.backdrop_url || "/placeholder.svg"}
                            alt={episode.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Access Badge - Top Right */}
                          {episode.access && episode.access !== 'free' && (
                            <div className="absolute top-1 right-1">
                              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                episode.access === 'vip' 
                                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black' 
                                  : 'bg-primary text-primary-foreground'
                              }`}>
                                {episode.access === 'vip' ? (
                                  <Crown className="h-3 w-3" />
                                ) : (
                                  <ShoppingBag className="h-3 w-3" />
                                )}
                                <span className="uppercase">{episode.access}</span>
                              </div>
                            </div>
                          )}
                          {episode.access === 'free' && (
                            <div className="absolute top-1 right-1">
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500 text-white">
                                <span>FREE</span>
                              </div>
                            </div>
                          )}
                          {/* Progress Bar */}
                          {progressPercent > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                              <div 
                                className="h-full bg-red-600 transition-all"
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                              />
                            </div>
                          )}
                          {/* Large Episode Number in Bottom Corner */}
                          <div className="absolute bottom-1 left-1">
                            <span className="text-5xl font-black text-white/90 leading-none" style={{
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)'
                            }}>
                              {episode.episode_number}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            )}

            {/* For You */}
            <TabsContent value="foryou" className="mt-0">
              <div ref={mobileForYouScrollRef} className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide scroll-smooth">
                {forYouContent?.slice(0, 8).map((item) => (
                  <div 
                    key={item.id}
                    className="flex-shrink-0 w-28 cursor-pointer"
                    onClick={() => navigate(`/watch/${item.content_type}/${item.tmdb_id}`)}
                  >
                    <div className="aspect-[2/3] rounded-md overflow-hidden">
                      <img
                        src={item.poster_path || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Comments */}
            <TabsContent value="comments" className="mt-0">
              <CommentsSection 
                episodeId={currentEpisode?.id}
                movieId={content?.type === 'movie' ? content.id : undefined}
              />
            </TabsContent>

            {/* Home */}
            <TabsContent value="home" className="mt-0">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="w-full justify-start gap-3 h-11"
                >
                  <Home className="h-5 w-5" />
                  <span>Go Home</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="w-full justify-start gap-3 h-11"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/series')}
                  className="w-full justify-start gap-3 h-11"
                >
                  <Tv className="h-5 w-5" />
                  <span>Series</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/movies')}
                  className="w-full justify-start gap-3 h-11"
                >
                  <Film className="h-5 w-5" />
                  <span>Movies</span>
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Recommended Section */}
          <div className="mt-6">
            <h3 className="text-base font-semibold mb-3">Recommended</h3>
            <div className="grid grid-cols-3 gap-2">
              {relatedContent && relatedContent.length > 0 ? (
                relatedContent.slice(0, 6).map((item) => (
                  <div 
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/watch/${item.content_type || 'series'}/${item.tmdb_id || item.id}`)}
                  >
                    <div className="aspect-[2/3] rounded-md overflow-hidden">
                      <img
                        src={item.poster_path || item.thumbnail || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))
              ) : (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx}>
                    <div className="aspect-[2/3] rounded-md overflow-hidden bg-muted">
                      <img
                        src="/placeholder.svg"
                        alt={`Recommended ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <TopupDialog open={showTopupDialog} onOpenChange={setShowTopupDialog} />
      <SubscriptionDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog} />
      <DeviceLimitWarning
        open={showDeviceLimitWarning}
        onOpenChange={setShowDeviceLimitWarning}
        maxDevices={maxDevices}
        activeSessions={sessions}
        currentDeviceId={currentDeviceId}
        onSignOutDevice={signOutDevice}
        onSignOutAllDevices={signOutAllDevices}
      />
      </>
    );
  }

  // iPad Layout (all sizes: mini, Air, Pro) - NO HEADER
  if (isTablet) {
    return (
      <>
      <div className="min-h-screen bg-background text-foreground">
        <SocialShareMeta
          title={content.title}
          description={content.description || ''}
          image={content.backdrop_url || content.thumbnail}
          type={content.type === 'movie' ? 'video.movie' : 'video.tv_show'}
        />
        {/* Video Player */}
        {videoSources.length > 0 && (
          <VideoPlayer 
            videoSources={videoSources}
            onEpisodeSelect={fetchVideoSource}
            episodes={episodes}
            currentEpisodeId={currentEpisode?.id}
            contentBackdrop={content?.backdrop_url}
            accessType={content?.access}
            excludeFromPlan={content?.exclude_from_plan}
            rentalPrice={content?.rental_price}
            rentalPeriodDays={content?.rental_period_days}
            mediaId={content?.id}
            mediaType={content?.type}
            title={content?.title}
            movieId={content?.type === 'movie' ? content?.id : undefined}
          />
        )}

        {/* Scrollable Content */}
        <div className="pb-6">
          {/* User Profile with Wallet and Subscribe */}
          <div className="flex items-center gap-3 py-4 px-4">
            <Avatar className="w-14 h-14 border-2 border-primary flex-shrink-0 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <AvatarImage 
                src={profileImageUrl || undefined} 
                alt={userProfile?.display_name || user?.email || 'User'}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {(userProfile?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{userProfile?.display_name || user?.email?.split('@')[0] || 'Guest'}</h1>
              <div 
                className="flex items-center gap-1 text-sm text-primary font-medium cursor-pointer hover:text-primary/80"
                onClick={() => setShowTopupDialog(true)}
              >
                <Wallet className="h-4 w-4" />
                <span>{walletLoading ? '...' : `$${balance.toFixed(2)}`}</span>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className={`h-9 px-3 gap-1.5 ${hasActiveSubscription ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600' : 'border-primary/50 text-primary hover:bg-primary/10'}`}
              onClick={() => setShowSubscriptionDialog(true)}
            >
              <Crown className="h-4 w-4" />
              {hasActiveSubscription ? (
                <span className="flex items-center gap-1">
                  VIP
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-yellow-500/20 text-yellow-600">
                    {remainingDays}d
                  </Badge>
                </span>
              ) : 'VIP'}
            </Button>
          </div>

          {/* Content Poster, Title and Watching Info with Action Buttons inline */}
          <div className="flex items-center gap-3 px-4 pb-3 border-b border-border/40">
            <div className="w-14 h-20 rounded-lg overflow-hidden border-2 border-muted flex-shrink-0">
              <img
                src={content?.thumbnail || "/placeholder.svg"}
                alt={content?.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold truncate">{content?.title}</h2>
              <p className="text-sm text-primary">
                {isSeriesContent && currentEpisode 
                  ? `Watching S1 EP${currentEpisode.episode_number}` 
                  : isSeriesContent 
                    ? `${episodes.length} Episodes`
                    : 'Watching Movie'}
              </p>
            </div>
            <div className="flex-shrink-0">
              <ActionButtons 
                contentId={content?.id}
                contentType={content?.type}
                episodeId={currentEpisode?.id}
                userId={user?.id}
                contentTitle={content?.title}
              />
            </div>
          </div>

          {/* Description - 2 lines max */}
          <div className="py-4 px-4">
            {showFullDescription ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {content?.description}
                </p>
                <button
                  onClick={() => setShowFullDescription(false)}
                  className="text-sm text-primary hover:underline mt-1"
                >
                  Show less
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {content?.description}
                </p>
                {content?.description && content.description.length > 100 && (
                  <button
                    onClick={() => setShowFullDescription(true)}
                    className="text-sm text-primary hover:underline mt-1"
                  >
                    ... Read more
                  </button>
                )}
              </>
            )}
          </div>

          {/* Series Cast - Horizontal Scroll */}
          {castMembers.length > 0 && (
            <div className="px-4">
              <h3 className="text-base font-semibold mb-3">Series Cast</h3>
              <div ref={tabletCastScrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
                {castMembers.slice(0, 10).map((member, idx) => (
                  <button 
                    key={idx} 
                    type="button"
                    className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer bg-transparent border-none p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSelectedCastMember(member);
                    }}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-muted pointer-events-none">
                      <img
                        src={member.profile_url || "/placeholder.svg"}
                        alt={member.actor_name}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </div>
                    <p className="text-xs text-center max-w-[64px] truncate pointer-events-none">
                      {member.actor_name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tabs Section */}
          <Tabs defaultValue={isSeriesContent ? "episodes" : "foryou"} className="w-full mt-4">
            <TabsList className="w-full justify-around border-b rounded-none h-auto p-0 bg-transparent px-4">
              {isSeriesContent && (
                <TabsTrigger 
                  value="episodes" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                >
                  Episodes
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="foryou" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
              >
                For You
              </TabsTrigger>
              <TabsTrigger 
                value="comments" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Comments
              </TabsTrigger>
              <TabsTrigger 
                value="home" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
              >
                <Home className="w-4 h-4 mr-1" />
                Home
              </TabsTrigger>
            </TabsList>

            {/* Episodes - Horizontal Scroll */}
            {isSeriesContent && (
              <TabsContent value="episodes" className="mt-4 px-4">
                <div ref={tabletEpisodesScrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
                  {episodes.map((episode) => {
                    const progressPercent = getProgressPercentage(episode.id);
                    return (
                      <div
                        key={episode.id}
                        onClick={() => fetchVideoSource(episode.id)}
                        className="flex-shrink-0 w-40 cursor-pointer"
                      >
                        <div className={`relative aspect-video rounded-lg overflow-hidden mb-2 border-2 transition-all ${
                          currentEpisode?.id === episode.id ? 'border-primary' : 'border-transparent'
                        }`}>
                          <img
                            src={episode.still_path || content?.backdrop_url || "/placeholder.svg"}
                            alt={episode.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Access Badge - Top Right */}
                          {episode.access && episode.access !== 'free' && (
                            <div className="absolute top-1 right-1">
                              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                episode.access === 'vip' 
                                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black' 
                                  : 'bg-primary text-primary-foreground'
                              }`}>
                                {episode.access === 'vip' ? (
                                  <Crown className="h-3 w-3" />
                                ) : (
                                  <ShoppingBag className="h-3 w-3" />
                                )}
                                <span className="uppercase">{episode.access}</span>
                              </div>
                            </div>
                          )}
                          {episode.access === 'free' && (
                            <div className="absolute top-1 right-1">
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500 text-white">
                                <span>FREE</span>
                              </div>
                            </div>
                          )}
                          {/* Progress Bar */}
                          {progressPercent > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                              <div 
                                className="h-full bg-red-600 transition-all"
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                              />
                            </div>
                          )}
                          {/* Large Episode Number in Bottom Corner */}
                          <div className="absolute bottom-1 left-1">
                            <span className="text-5xl font-black text-white/90 leading-none" style={{
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)'
                            }}>
                              {episode.episode_number}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs font-medium line-clamp-2">{episode.name}</p>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            )}

            {/* For You */}
            <TabsContent value="foryou" className="mt-4 px-4">
              <div ref={tabletForYouScrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
                {forYouContent?.slice(0, 8).map((item) => (
                  <div 
                    key={item.id}
                    className="flex-shrink-0 w-32 cursor-pointer"
                    onClick={() => navigate(`/watch/${item.content_type}/${item.tmdb_id}`)}
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2">
                      <img
                        src={item.poster_path || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-medium line-clamp-2">{item.title}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Comments */}
            <TabsContent value="comments" className="mt-4 px-4">
              <CommentsSection 
                episodeId={currentEpisode?.id}
                movieId={content?.type === 'movie' ? content.id : undefined}
              />
            </TabsContent>

            {/* Home */}
            <TabsContent value="home" className="mt-4 px-4">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="w-full justify-start gap-3 h-11"
                >
                  <Home className="h-5 w-5" />
                  <span>Go Home</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="w-full justify-start gap-3 h-11"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/series')}
                  className="w-full justify-start gap-3 h-11"
                >
                  <Tv className="h-5 w-5" />
                  <span>Series</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/movies')}
                  className="w-full justify-start gap-3 h-11"
                >
                  <Film className="h-5 w-5" />
                  <span>Movies</span>
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Recommended - Horizontal Scroll */}
          <div className="mt-6 px-4">
            <h3 className="text-base font-semibold mb-3">Recommended</h3>
            <div ref={tabletRecommendedScrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
              {relatedContent && relatedContent.length > 0 ? (
                relatedContent.slice(0, 8).map((item) => (
                  <div 
                    key={item.id}
                    className="flex-shrink-0 w-32 cursor-pointer"
                    onClick={() => navigate(`/watch/${item.content_type || 'series'}/${item.tmdb_id || item.id}`)}
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2">
                      <img
                        src={item.poster_path || item.thumbnail || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-medium line-clamp-2">{item.title}</p>
                  </div>
                ))
              ) : (
                Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="flex-shrink-0 w-32">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                      <img
                        src={content?.thumbnail || "/placeholder.svg"}
                        alt={`Recommended ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <TopupDialog open={showTopupDialog} onOpenChange={setShowTopupDialog} />
      <SubscriptionDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog} />
      <DeviceLimitWarning
        open={showDeviceLimitWarning}
        onOpenChange={setShowDeviceLimitWarning}
        maxDevices={maxDevices}
        activeSessions={sessions}
        currentDeviceId={currentDeviceId}
        onSignOutDevice={signOutDevice}
        onSignOutAllDevices={signOutAllDevices}
      />
      </>
    );
  }

  // Desktop Layout - Two Column Layout (60% Left + 40% Right)
  return (
    <>
    <div className="min-h-screen bg-background text-foreground transition-all duration-300 ease-in-out">
      <SocialShareMeta
        title={content.title}
        description={content.description || ''}
        image={content.backdrop_url || content.thumbnail}
        type={content.type === 'movie' ? 'video.movie' : 'video.tv_show'}
      />
      <div className="flex h-screen overflow-hidden">
        {/* Left Column: 60% width, independently scrollable */}
        <div className="w-[60%] flex flex-col overflow-hidden">
          {/* Video Player */}
          {videoSources.length > 0 && (
            <VideoPlayer 
              videoSources={videoSources}
              onEpisodeSelect={fetchVideoSource}
              episodes={episodes}
              currentEpisodeId={currentEpisode?.id}
              contentBackdrop={content?.backdrop_url}
              accessType={content?.access}
              excludeFromPlan={content?.exclude_from_plan}
              rentalPrice={content?.rental_price}
              rentalPeriodDays={content?.rental_period_days}
              mediaId={content?.id}
              mediaType={content?.type}
              title={content?.title}
              movieId={content?.type === 'movie' ? content?.id : undefined}
            />
          )}
            
          {/* Scrollable Content Below Player */}
          <div className="flex-1 overflow-y-auto">
            {/* User Profile with Wallet Balance */}
            <div className="px-6 flex items-center gap-4" style={{ marginTop: '0.3px', marginBottom: '0.3px', paddingTop: '12px', paddingBottom: '12px' }}>
              <Avatar className="w-14 h-14 border-2 border-primary flex-shrink-0 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <AvatarImage 
                  src={profileImageUrl || undefined} 
                  alt={userProfile?.display_name || user?.email || 'User'}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {(userProfile?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold truncate">{userProfile?.display_name || user?.email?.split('@')[0] || 'Guest'}</h1>
                <div 
                  className="flex items-center gap-1 text-sm text-primary font-medium cursor-pointer hover:text-primary/80"
                  onClick={() => setShowTopupDialog(true)}
                >
                  <Wallet className="h-4 w-4" />
                  <span>{walletLoading ? '...' : `$${balance.toFixed(2)}`}</span>
                </div>
              </div>

              <Button 
                size="sm" 
                variant="outline" 
                className={`h-9 px-3 gap-1.5 ${hasActiveSubscription ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600' : 'border-primary/50 text-primary hover:bg-primary/10'}`}
                onClick={() => setShowSubscriptionDialog(true)}
              >
                <Crown className="h-4 w-4" />
                {hasActiveSubscription ? (
                  <span className="flex items-center gap-1">
                    VIP
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-yellow-500/20 text-yellow-600">
                      {remainingDays}d
                    </Badge>
                  </span>
                ) : 'VIP'}
              </Button>

              <ActionButtons
                contentId={content?.id}
                contentType={content?.type}
                episodeId={currentEpisode?.id}
                userId={user?.id}
                contentTitle={content?.title}
              />
            </div>

            {/* Cast Section - No heading */}
            <div className="px-6" style={{ marginTop: '0.3px', marginBottom: '0.3px', paddingTop: '12px', paddingBottom: '12px' }}>
              {castLoading ? (
                <CastSkeleton />
              ) : castMembers.length > 0 ? (
                <div ref={desktopCastScrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
                  {castMembers.slice(0, 8).map((member, idx) => (
                    <div 
                      key={idx} 
                      className="flex-shrink-0 cursor-pointer"
                      onClick={() => setSelectedCastMember(member)}
                    >
                      <div className="w-24 h-36 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={member.profile_url || "/placeholder.svg"}
                          alt={member.actor_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-center mt-1 w-24 truncate">
                        {member.actor_name}
                      </p>
                      {member.character_name && (
                        <p className="text-xs text-center text-muted-foreground w-24 truncate">
                          {member.character_name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

          </div>
        </div>

        {/* Right Sidebar: 40% width, independently scrollable */}
        <div className="w-[40%] overflow-y-auto border-l border-border/40 transition-all duration-300 ease-in-out">
          <div className="p-4 space-y-3">
            {/* Content Poster, Title and Watching Info - Only for Movies */}
            {!isSeriesContent && (
              <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary flex-shrink-0">
                  <img
                    src={content?.thumbnail || "/placeholder.svg"}
                    alt={content?.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold truncate">{content?.title}</h2>
                  <p className="text-sm text-primary font-medium">Watching Movie</p>
                </div>
              </div>
            )}

            {/* Collapsible Tabs Section */}
            <CollapsibleTabsSection
              isSeriesContent={isSeriesContent}
              seasons={seasons}
              selectedSeasonId={selectedSeasonId}
              setSelectedSeasonId={setSelectedSeasonId}
              episodes={episodes}
              episodesLoading={episodesLoading}
              content={content}
              currentEpisode={currentEpisode}
              fetchVideoSource={fetchVideoSource}
              getProgressPercentage={getProgressPercentage}
              forYouContent={forYouContent}
              navigate={navigate}
            />

            {/* Subscription Banner */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">
                  Subscribe to Membership, Enjoy watching our Premium videos
                </p>
                <Button size="sm" variant="outline" className="h-7 px-2">
                  <ShoppingBag className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Recommended Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recommended</h3>
              {loading ? (
                <RecommendedSkeleton columns={4} />
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {relatedContent && relatedContent.length > 0 ? (
                      relatedContent.slice(0, 8).map((item) => (
                        <div
                          key={item.id}
                          className="cursor-pointer transition-transform hover:scale-105"
                          onClick={() => navigate(`/watch/${item.content_type || 'series'}/${item.tmdb_id || item.id}`)}
                        >
                          <div className="aspect-[2/3] rounded-lg overflow-hidden">
                            <img
                              src={item.poster_path || item.thumbnail || "/placeholder.svg"}
                              alt={item.title}
                              className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      Array.from({ length: 8 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="aspect-[2/3] rounded-lg overflow-hidden bg-muted"
                        >
                          <img
                            src="/placeholder.svg"
                            alt={`Recommended ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))
                    )}
                  </div>
                  <button className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3">
                    ... More
                  </button>
                </>
              )}
            </div>

            {/* Shorts Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Shorts</h3>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-[9/16] rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-all hover:scale-105"
                  >
                    <img
                      src="/placeholder.svg"
                      alt={`Short ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Dialogs */}
    <TopupDialog open={showTopupDialog} onOpenChange={setShowTopupDialog} />
    <SubscriptionDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog} />
    <CastMemberDialog 
      castMember={selectedCastMember} 
      isOpen={!!selectedCastMember} 
      onClose={() => setSelectedCastMember(null)}
      castType={content?.type === 'movie' ? 'movie' : 'series'}
    />
    <DeviceLimitWarning
      open={showDeviceLimitWarning}
      onOpenChange={setShowDeviceLimitWarning}
      maxDevices={maxDevices}
      activeSessions={sessions}
      currentDeviceId={currentDeviceId}
      onSignOutDevice={signOutDevice}
      onSignOutAllDevices={signOutAllDevices}
    />
    </>
  );
};

  export default Watch;
