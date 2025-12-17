import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/public/Header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Search, Calendar, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { TrailerDialog } from "@/components/admin/TrailerDialog";

interface UpcomingRelease {
  id: string;
  title: string;
  thumbnail: string | null;
  type: string;
  release_date: string | null;
  status: string;
  genre: string | null;
  description: string | null;
  trailer_url: string | null;
  tmdb_id: string | null;
}

interface Reservation {
  release_id: string;
}

const ComingSoonPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [trailerDialogOpen, setTrailerDialogOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<UpcomingRelease | null>(null);

  const { data: upcomingReleases, isLoading } = useQuery({
    queryKey: ['upcoming-releases', typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('upcoming_releases')
        .select('*')
        .order('release_date', { ascending: true });

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UpcomingRelease[];
    },
  });

  const { data: reservations } = useQuery({
    queryKey: ['user-reservations'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('reservations')
        .select('release_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as Reservation[];
    },
    enabled: !!user,
  });

  const reserveMutation = useMutation({
    mutationFn: async (releaseId: string) => {
      if (!user) throw new Error("Please sign in to reserve");

      const { error } = await supabase
        .from('reservations')
        .insert({ user_id: user.id, release_id: releaseId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reservations'] });
      toast.success("Reserved! You'll be notified when it's released.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reserve");
    },
  });

  const unreserveMutation = useMutation({
    mutationFn: async (releaseId: string) => {
      if (!user) throw new Error("Please sign in");

      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('user_id', user.id)
        .eq('release_id', releaseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reservations'] });
      toast.success("Reservation cancelled");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel reservation");
    },
  });

  const isReserved = (releaseId: string) => {
    return reservations?.some(r => r.release_id === releaseId) || false;
  };

  const handleReserveToggle = (releaseId: string) => {
    if (isReserved(releaseId)) {
      unreserveMutation.mutate(releaseId);
    } else {
      reserveMutation.mutate(releaseId);
    }
  };

  const handlePosterClick = (release: UpcomingRelease) => {
    if (release.trailer_url) {
      setSelectedRelease(release);
      setTrailerDialogOpen(true);
    }
  };

  const formatReleaseDate = (dateString: string | null) => {
    if (!dateString) return 'Coming soon';
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Coming soon';
    }
  };

  const getTypeBadge = (genre: string | null) => {
    if (!genre) return null;
    
    if (genre.toLowerCase().includes('original')) {
      return <Badge className="bg-green-500 text-white">Original</Badge>;
    }
    if (genre.toLowerCase().includes('iqiyi')) {
      return <Badge className="bg-green-400 text-black">iQIYI Only</Badge>;
    }
    return null;
  };

  const filteredReleases = upcomingReleases?.filter(release =>
    release.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-8 mt-16">
        <h1 className="text-3xl font-bold text-foreground mb-8">Coming Soon</h1>

        {/* Filters */}
        <Card className="p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search releases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="movie">Movies</SelectItem>
                <SelectItem value="series">Series</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="announced">Announced</SelectItem>
                <SelectItem value="in_production">In Production</SelectItem>
                <SelectItem value="post_production">Post Production</SelectItem>
                <SelectItem value="coming_soon">Coming Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Releases Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-[420px] bg-secondary animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredReleases?.map((release) => (
              <div key={release.id} className="flex flex-col">
                <div 
                  onClick={() => release.trailer_url && handlePosterClick(release)}
                  className={`relative aspect-[2/3] rounded-lg overflow-hidden mb-3 group ${release.trailer_url ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {getTypeBadge(release.genre)}
                  <img
                    src={release.thumbnail || '/placeholder.svg'}
                    alt={release.title}
                    className={`w-full h-full object-cover transition-all duration-300 ${release.trailer_url ? 'group-hover:scale-105 group-hover:brightness-75' : ''}`}
                  />
                  {release.trailer_url && (
                    <>
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="bg-primary rounded-full p-4 transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                          <Play className="w-8 h-8 text-primary-foreground" fill="currentColor" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-xs text-white line-clamp-2 mb-1">
                          {release.description || 'No description available'}
                        </p>
                        <p className="text-xs text-white/80 font-medium">Click to watch trailer</p>
                      </div>
                    </>
                  )}
                </div>
                
                <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2 min-h-[40px]">
                  {release.title}
                </h3>

                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatReleaseDate(release.release_date)}</span>
                </div>

                <Button
                  variant={isReserved(release.id) ? "default" : "secondary"}
                  size="sm"
                  className="w-full"
                  onClick={() => handleReserveToggle(release.id)}
                  disabled={!user || reserveMutation.isPending || unreserveMutation.isPending}
                >
                  {isReserved(release.id) ? (
                    <>
                      <BellOff className="w-4 h-4 mr-2" />
                      Reserved
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      Reserve
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredReleases?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No upcoming releases found</p>
          </div>
        )}
      </div>

      {/* Trailer Dialog */}
      <TrailerDialog
        open={trailerDialogOpen}
        onOpenChange={setTrailerDialogOpen}
        title={selectedRelease?.title || ""}
        trailerUrl={selectedRelease?.trailer_url || null}
        description={selectedRelease?.description}
        releaseDate={selectedRelease?.release_date}
        genre={selectedRelease?.genre}
        status={selectedRelease?.status}
      />
    </div>
  );
};

export default ComingSoonPage;
