import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronRight, Download, Pencil, Save, X, Upload } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EpisodeEditDialog } from "@/components/admin/EpisodeEditDialog";
import { ImportEpisodeSourcesDialog } from "@/components/admin/ImportEpisodeSourcesDialog";
import { VideoSourcesImportDialog } from "@/components/admin/VideoSourcesImportDialog";

const SeriesEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [tmdbId, setTmdbId] = useState("");
  const [editingEpisode, setEditingEpisode] = useState<any>(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedSeries, setEditedSeries] = useState<any>(null);
  const [importingSeasonId, setImportingSeasonId] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const { data: series, isLoading } = useQuery({
    queryKey: ["series", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: cast = [] } = useQuery({
    queryKey: ["series-cast", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series_cast")
        .select("*")
        .eq("series_id", id)
        .order("order_index", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: producers = [] } = useQuery({
    queryKey: ["series-producers", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series_producers")
        .select("*")
        .eq("series_id", id);

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Pre-populate TMDB ID when series data loads
  useEffect(() => {
    if (series?.tmdb_id && !tmdbId) {
      setTmdbId(series.tmdb_id);
    }
  }, [series, tmdbId]);

  // Initialize edited series when entering edit mode
  useEffect(() => {
    if (isEditingInfo && series && !editedSeries) {
      setEditedSeries({
        poster_url: series.poster_url || "",
        backdrop_url: series.backdrop_url || "",
        genre: series.genre || "",
        overview: series.overview || "",
        trailer_url: series.trailer_url || "",
        access: series.access || "free",
        rental_price: series.rental_price || 0,
        rental_period_days: series.rental_period_days || 7,
        rental_max_devices: series.rental_max_devices || 1,
        exclude_from_plan: series.exclude_from_plan || false,
      });
    }
  }, [isEditingInfo, series, editedSeries]);

  const updateSeriesMutation = useMutation({
    mutationFn: async (updates: any) => {
      // Check if access type has changed
      const accessChanged = series && updates.access && updates.access !== series.access;
      
      // Clean up the updates object - convert empty strings to null for nullable fields
      const cleanedUpdates = {
        ...updates,
        poster_url: updates.poster_url || null,
        backdrop_url: updates.backdrop_url || null,
        trailer_url: updates.trailer_url || null,
        overview: updates.overview || null,
        access: updates.access as 'free' | 'rent' | 'vip',
      };
      
      // Update series
      const { error } = await supabase
        .from("series")
        .update(cleanedUpdates)
        .eq("id", id);

      if (error) throw error;

      // If access type changed, cascade update to all episodes
      if (accessChanged) {
        // Get all season IDs for this series
        const { data: seasonsData } = await supabase
          .from("seasons")
          .select("id")
          .eq("media_id", id);

        if (seasonsData && seasonsData.length > 0) {
          const seasonIds = seasonsData.map(s => s.id);
          
          // Update all episodes in these seasons
          const { error: episodesError } = await supabase
            .from("episodes")
            .update({ access: updates.access as 'free' | 'rent' | 'vip' })
            .in("season_id", seasonIds);

          if (episodesError) throw episodesError;
        }
      }
    },
    onSuccess: () => {
      toast.success("Series information updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["series", id] });
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      setIsEditingInfo(false);
      setEditedSeries(null);
    },
    onError: (error: Error) => {
      console.error("Series update error:", error);
      toast.error("Failed to update series: " + error.message);
    },
  });

  const handleSaveSeriesInfo = () => {
    if (!editedSeries) return;
    updateSeriesMutation.mutate(editedSeries);
  };

  const handleCancelEdit = () => {
    setIsEditingInfo(false);
    setEditedSeries(null);
  };

  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("media_id", id)
        .order("season_number", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: episodesBySeason = {} } = useQuery({
    queryKey: ["episodes", id],
    queryFn: async () => {
      const seasonIds = seasons.map((s) => s.id);
      if (seasonIds.length === 0) return {};

      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .in("season_id", seasonIds)
        .order("episode_number", { ascending: true });

      if (error) throw error;

      // Group episodes by season_id
      const grouped: Record<string, any[]> = {};
      data.forEach((episode) => {
        if (!grouped[episode.season_id]) {
          grouped[episode.season_id] = [];
        }
        grouped[episode.season_id].push(episode);
      });

      return grouped;
    },
    enabled: seasons.length > 0,
  });

  const toggleSeason = (seasonId: string) => {
    setExpandedSeasons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(seasonId)) {
        newSet.delete(seasonId);
      } else {
        newSet.add(seasonId);
      }
      return newSet;
    });
  };

  const importMutation = useMutation({
    mutationFn: async (tmdbId: string) => {
      const { data, error } = await supabase.functions.invoke('import-series-episodes', {
        body: { mediaId: id, tmdbId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Episodes imported successfully!");
      queryClient.invalidateQueries({ queryKey: ["seasons", id] });
      queryClient.invalidateQueries({ queryKey: ["episodes", id] });
      setTmdbId("");
    },
    onError: (error: Error) => {
      toast.error("Failed to import episodes: " + error.message);
    },
  });

  const handleImport = () => {
    if (!tmdbId.trim()) {
      toast.error("Please enter a TMDB ID");
      return;
    }
    importMutation.mutate(tmdbId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/series")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isLoading ? "Loading..." : series?.title}
              </h1>
              <p className="text-muted-foreground">Manage seasons and episodes</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Card className="w-96">
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="tmdbId" className="text-sm">TMDB ID</Label>
                    <Input
                      id="tmdbId"
                      placeholder="Enter TMDB series ID"
                      value={tmdbId}
                      onChange={(e) => setTmdbId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleImport}
                      disabled={importMutation.isPending}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {importMutation.isPending ? "Importing..." : "Import"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button
              onClick={() => setShowBulkImport(true)}
              variant="outline"
              className="self-end"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import CSV
            </Button>
          </div>
        </div>

        {!isLoading && series && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Series Information</CardTitle>
              {!isEditingInfo ? (
                <Button onClick={() => setIsEditingInfo(true)} variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Info
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleCancelEdit} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveSeriesInfo} 
                    size="sm"
                    disabled={updateSeriesMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSeriesMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditingInfo && editedSeries ? (
                // Edit Mode
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="poster_url">Poster URL</Label>
                      <Input
                        id="poster_url"
                        placeholder="https://image.tmdb.org/t/p/w500/..."
                        value={editedSeries.poster_url}
                        onChange={(e) =>
                          setEditedSeries({ ...editedSeries, poster_url: e.target.value })
                        }
                      />
                      {editedSeries.poster_url && (
                        <img 
                          src={editedSeries.poster_url} 
                          alt="Poster preview" 
                          className="w-32 h-48 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.src = '';
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backdrop_url">Banner/Backdrop URL</Label>
                      <Input
                        id="backdrop_url"
                        placeholder="https://image.tmdb.org/t/p/original/..."
                        value={editedSeries.backdrop_url}
                        onChange={(e) =>
                          setEditedSeries({ ...editedSeries, backdrop_url: e.target.value })
                        }
                      />
                      {editedSeries.backdrop_url && (
                        <img 
                          src={editedSeries.backdrop_url} 
                          alt="Banner preview" 
                          className="w-full h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.src = '';
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="genre">Genre</Label>
                      <Input
                        id="genre"
                        placeholder="Drama, Action, Comedy"
                        value={editedSeries.genre}
                        onChange={(e) =>
                          setEditedSeries({ ...editedSeries, genre: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="access">Version (Access Type)</Label>
                      <Select
                        value={editedSeries.access}
                        onValueChange={(value) =>
                          setEditedSeries({ ...editedSeries, access: value })
                        }
                      >
                        <SelectTrigger id="access">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="rent">Rent</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {editedSeries.access === "rent" && (
                    <div className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <Label htmlFor="rental_price">Rent Price</Label>
                        <Input
                          id="rental_price"
                          type="number"
                          placeholder="1"
                          value={editedSeries.rental_price}
                          onChange={(e) =>
                            setEditedSeries({ ...editedSeries, rental_price: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rental_period_days">Rental Period (Days)</Label>
                        <Input
                          id="rental_period_days"
                          type="number"
                          placeholder="7"
                          value={editedSeries.rental_period_days}
                          onChange={(e) =>
                            setEditedSeries({ ...editedSeries, rental_period_days: parseInt(e.target.value) || 1 })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rental_max_devices">Max Devices</Label>
                        <Input
                          id="rental_max_devices"
                          type="number"
                          placeholder="1"
                          min="1"
                          value={editedSeries.rental_max_devices}
                          onChange={(e) =>
                            setEditedSeries({ ...editedSeries, rental_max_devices: parseInt(e.target.value) || 1 })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="exclude_from_plan">Exclude from plan</Label>
                        <Select
                          value={editedSeries.exclude_from_plan ? "yes" : "no"}
                          onValueChange={(value) =>
                            setEditedSeries({ ...editedSeries, exclude_from_plan: value === "yes" })
                          }
                        >
                          <SelectTrigger id="exclude_from_plan">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="trailer_url">Trailer URL</Label>
                    <Input
                      id="trailer_url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={editedSeries.trailer_url}
                      onChange={(e) =>
                        setEditedSeries({ ...editedSeries, trailer_url: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="overview">Description / Overview</Label>
                    <Textarea
                      id="overview"
                      placeholder="Enter series description..."
                      rows={6}
                      value={editedSeries.overview}
                      onChange={(e) =>
                        setEditedSeries({ ...editedSeries, overview: e.target.value })
                      }
                    />
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Poster</p>
                      {series.poster_url ? (
                        <img 
                          src={series.poster_url} 
                          alt="Poster" 
                          className="w-32 h-48 object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="w-32 h-48 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                          No poster
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Genre</p>
                          <p className="font-medium">{series.genre}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Release Year</p>
                          <p className="font-medium">{series.release_year}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Rating</p>
                          <p className="font-medium">⭐ {series.rating}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Seasons</p>
                          <p className="font-medium">{seasons.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Version</p>
                          <Badge variant={series.access === 'free' ? 'default' : series.access === 'vip' ? 'secondary' : 'outline'}>
                            {series.access?.toUpperCase() || 'FREE'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant="outline">{series.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {series.backdrop_url && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Banner</p>
                      <img 
                        src={series.backdrop_url} 
                        alt="Banner" 
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    </div>
                  )}

                  {series.trailer_url && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Trailer</p>
                      <a 
                        href={series.trailer_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        {series.trailer_url}
                      </a>
                    </div>
                  )}

                  {producers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Network / Producers</p>
                      <div className="flex flex-wrap gap-2">
                        {producers.map((producer) => (
                          <Badge key={producer.id} variant="secondary">
                            {producer.company_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {cast.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Cast (Top 10)</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {cast.map((member) => (
                          <div key={member.id} className="flex flex-col items-center text-center">
                            {member.profile_url ? (
                              <img 
                                src={member.profile_url} 
                                alt={member.actor_name} 
                                className="w-16 h-16 rounded-full object-cover border-2"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xs">
                                {member.actor_name.charAt(0)}
                              </div>
                            )}
                            <p className="text-xs font-medium mt-1 line-clamp-1">{member.actor_name}</p>
                            {member.character_name && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{member.character_name}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {series.overview && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Overview</p>
                      <p className="text-sm leading-relaxed">{series.overview}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Seasons & Episodes</CardTitle>
          </CardHeader>
          <CardContent>
            {seasons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No seasons found for this series.
              </div>
            ) : (
              <div className="space-y-4">
                {seasons.map((season) => {
                  const episodes = episodesBySeason[season.id] || [];
                  const isExpanded = expandedSeasons.has(season.id);

                  return (
                    <Card key={season.id}>
                      <Collapsible open={isExpanded} onOpenChange={() => toggleSeason(season.id)}>
                        <CardHeader>
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                                <CardTitle className="text-lg">
                                  Season {season.season_number}: {season.name}
                                </CardTitle>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {episodes.length} episodes
                              </div>
                            </div>
                          </CollapsibleTrigger>
                        </CardHeader>
                        <CollapsibleContent>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {season.overview || "No description available"}
                                </p>
                                <p className="text-sm">
                                  Air Date:{" "}
                                  {season.air_date
                                    ? new Date(season.air_date).toLocaleDateString()
                                    : "TBA"}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setImportingSeasonId(season.id)}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Import CSV
                              </Button>
                            </div>

                            {episodes.length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                No episodes found for this season.
                              </div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-16">Ep #</TableHead>
                                    <TableHead className="w-24">Thumbnail</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Air Date</TableHead>
                                    <TableHead className="w-24">Runtime</TableHead>
                                    <TableHead className="w-20">Version</TableHead>
                                    <TableHead className="w-20">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {episodes.map((episode) => (
                                    <TableRow key={episode.id}>
                                      <TableCell className="font-medium">
                                        {episode.episode_number}
                                      </TableCell>
                                      <TableCell>
                                        {episode.still_path ? (
                                          <img
                                            src={`https://image.tmdb.org/t/p/w185${episode.still_path}`}
                                            alt={episode.name}
                                            className="w-20 h-12 object-cover rounded"
                                          />
                                        ) : (
                                          <div className="w-20 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                                            No image
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div>
                                          <p className="font-medium">{episode.name}</p>
                                          {episode.overview && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                              {episode.overview}
                                            </p>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {episode.air_date
                                          ? new Date(episode.air_date).toLocaleDateString()
                                          : "TBA"}
                                      </TableCell>
                                      <TableCell>
                                        {episode.runtime ? `${episode.runtime} min` : "-"}
                                      </TableCell>
                                      <TableCell>
                                        <Badge 
                                          variant={
                                            episode.access === 'free' ? 'default' : 
                                            episode.access === 'vip' ? 'secondary' : 
                                            'outline'
                                          }
                                          className="text-xs"
                                        >
                                          {episode.access?.toUpperCase() || 'FREE'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setEditingEpisode(episode)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EpisodeEditDialog
        episode={editingEpisode}
        open={!!editingEpisode}
        onOpenChange={(open) => !open && setEditingEpisode(null)}
        seriesId={id || ""}
      />

      {importingSeasonId && (
        <ImportEpisodeSourcesDialog
          seasonId={importingSeasonId}
          isOpen={!!importingSeasonId}
          onOpenChange={(open) => !open && setImportingSeasonId(null)}
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["seasons", id] });
            toast.success("Episodes imported successfully");
          }}
        />
      )}

      <VideoSourcesImportDialog
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
      />
    </AdminLayout>
  );
};

export default SeriesEdit;
