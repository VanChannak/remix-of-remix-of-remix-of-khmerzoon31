import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Save, X, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CastDialog } from "@/components/admin/CastDialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface VideoSource {
  server: string;
  version: "free" | "rent" | "vip";
  permission: "Web & Mobile" | "Web" | "Mobile";
  type: "iframe" | "mp4" | "hls";
  url: string;
  quality?: string;
  mp4Urls?: {
    "480p"?: string;
    "720p"?: string;
    "1080p"?: string;
  };
  defaultQuality?: "480p" | "720p" | "1080p";
  isDefault: boolean;
}

const MoviesEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedMovie, setEditedMovie] = useState<any>(null);
  const [isEditingVideoSources, setIsEditingVideoSources] = useState(false);
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);
  const [castDialogOpen, setCastDialogOpen] = useState(false);
  const [selectedCast, setSelectedCast] = useState<any>(null);

  const { data: movie, isLoading } = useQuery({
    queryKey: ["movie", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: cast = [], refetch: refetchCast } = useQuery({
    queryKey: ["movie-cast", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movie_cast" as any)
        .select("*")
        .eq("movie_id", id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Initialize edited movie when entering edit mode
  useEffect(() => {
    if (isEditingInfo && movie && !editedMovie) {
      const movieWithFields = movie as any;
      setEditedMovie({
        thumbnail: movie.thumbnail || "",
        backdrop_url: movieWithFields.backdrop_url || "",
        trailer_url: movieWithFields.trailer_url || "",
        genre: movie.genre || "",
        description: movie.description || "",
        access: movie.access || "free",
        rental_price: movie.rental_price || 0,
        rental_period_days: movie.rental_period_days || 7,
        rental_max_devices: movie.rental_max_devices || 1,
        exclude_from_plan: movie.exclude_from_plan || false,
      });
    }
  }, [isEditingInfo, movie, editedMovie]);

  // Initialize video sources
  useEffect(() => {
    if (movie?.video_sources) {
      setVideoSources(movie.video_sources as unknown as VideoSource[]);
    }
  }, [movie]);

  const updateMovieMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from("movies")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Movie information updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["movie", id] });
      setIsEditingInfo(false);
      setEditedMovie(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to update movie: " + error.message);
    },
  });

  const handleSaveMovieInfo = () => {
    if (!editedMovie) return;
    updateMovieMutation.mutate(editedMovie);
  };

  const handleCancelEdit = () => {
    setIsEditingInfo(false);
    setEditedMovie(null);
  };

  const updateVideoSourcesMutation = useMutation({
    mutationFn: async (sources: VideoSource[]) => {
      const { error } = await supabase
        .from("movies")
        .update({ video_sources: sources as any })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Video sources updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["movie", id] });
      setIsEditingVideoSources(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to update video sources: " + error.message);
    },
  });

  const handleAddVideoSource = () => {
    setVideoSources([
      ...videoSources,
      {
        server: `Server ${videoSources.length + 1}`,
        version: "free",
        permission: "Web & Mobile",
        type: "iframe",
        url: "",
        isDefault: videoSources.length === 0,
      },
    ]);
  };

  const handleRemoveVideoSource = (index: number) => {
    setVideoSources(videoSources.filter((_, i) => i !== index));
  };

  const handleVideoSourceChange = (index: number, field: keyof VideoSource, value: any) => {
    const updated = [...videoSources];
    updated[index] = { ...updated[index], [field]: value };
    
    // If changing type to MP4, initialize mp4Urls and defaultQuality
    if (field === "type" && value === "mp4" && !updated[index].mp4Urls) {
      updated[index].mp4Urls = { "480p": "", "720p": "", "1080p": "" };
      updated[index].defaultQuality = "720p";
    }
    
    setVideoSources(updated);
  };

  const handleMp4QualityChange = (index: number, quality: "480p" | "720p" | "1080p", url: string) => {
    const updated = [...videoSources];
    if (!updated[index].mp4Urls) {
      updated[index].mp4Urls = {};
    }
    updated[index].mp4Urls![quality] = url;
    setVideoSources(updated);
  };

  const handleDefaultChange = (index: number) => {
    const updated = videoSources.map((source, i) => ({
      ...source,
      isDefault: i === index,
    }));
    setVideoSources(updated);
  };

  const handleSaveVideoSources = () => {
    updateVideoSourcesMutation.mutate(videoSources);
  };

  const handleCancelVideoSourcesEdit = () => {
    setIsEditingVideoSources(false);
    if (movie?.video_sources) {
      setVideoSources(movie.video_sources as unknown as VideoSource[]);
    }
  };

  // Cast management mutations
  const addCastMutation = useMutation({
    mutationFn: async (castData: any) => {
      const { error } = await supabase
        .from("movie_cast" as any)
        .insert({ ...castData, movie_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cast member added successfully!");
      refetchCast();
    },
    onError: (error: Error) => {
      toast.error("Failed to add cast member: " + error.message);
    },
  });

  const updateCastMutation = useMutation({
    mutationFn: async ({ castId, castData }: { castId: string; castData: any }) => {
      const { error } = await supabase
        .from("movie_cast" as any)
        .update(castData)
        .eq("id", castId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cast member updated successfully!");
      refetchCast();
    },
    onError: (error: Error) => {
      toast.error("Failed to update cast member: " + error.message);
    },
  });

  const deleteCastMutation = useMutation({
    mutationFn: async (castId: string) => {
      const { error } = await supabase
        .from("movie_cast" as any)
        .delete()
        .eq("id", castId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cast member deleted successfully!");
      refetchCast();
    },
    onError: (error: Error) => {
      toast.error("Failed to delete cast member: " + error.message);
    },
  });

  const handleSaveCast = (castData: any) => {
    if (selectedCast) {
      updateCastMutation.mutate({ castId: selectedCast.id, castData });
    } else {
      addCastMutation.mutate(castData);
    }
    setSelectedCast(null);
  };

  const handleEditCast = (castMember: any) => {
    setSelectedCast(castMember);
    setCastDialogOpen(true);
  };

  const handleDeleteCast = (castId: string) => {
    if (confirm("Are you sure you want to delete this cast member?")) {
      deleteCastMutation.mutate(castId);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/movies")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isLoading ? "Loading..." : movie?.title}
              </h1>
              <p className="text-muted-foreground">Edit movie information</p>
            </div>
          </div>
        </div>

        {!isLoading && movie && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Movie Information</CardTitle>
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
                    onClick={handleSaveMovieInfo} 
                    size="sm"
                    disabled={updateMovieMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateMovieMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditingInfo && editedMovie ? (
                // Edit Mode
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail">Poster URL</Label>
                      <Input
                        id="thumbnail"
                        placeholder="https://image.tmdb.org/t/p/original/..."
                        value={editedMovie.thumbnail}
                        onChange={(e) =>
                          setEditedMovie({ ...editedMovie, thumbnail: e.target.value })
                        }
                      />
                      {editedMovie.thumbnail && (
                        <img 
                          src={editedMovie.thumbnail} 
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
                        value={editedMovie.backdrop_url}
                        onChange={(e) =>
                          setEditedMovie({ ...editedMovie, backdrop_url: e.target.value })
                        }
                      />
                      {editedMovie.backdrop_url && (
                        <img 
                          src={editedMovie.backdrop_url} 
                          alt="Backdrop preview" 
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
                        value={editedMovie.genre}
                        onChange={(e) =>
                          setEditedMovie({ ...editedMovie, genre: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="access">Version (Access Type)</Label>
                      <Select
                        value={editedMovie.access}
                        onValueChange={(value) =>
                          setEditedMovie({ ...editedMovie, access: value })
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

                  {editedMovie.access === "rent" && (
                    <div className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <Label htmlFor="rental_price">Rent Price</Label>
                        <Input
                          id="rental_price"
                          type="number"
                          placeholder="1"
                          value={editedMovie.rental_price}
                          onChange={(e) =>
                            setEditedMovie({ ...editedMovie, rental_price: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rental_period_days">Rental Period (Days)</Label>
                        <Input
                          id="rental_period_days"
                          type="number"
                          placeholder="7"
                          value={editedMovie.rental_period_days}
                          onChange={(e) =>
                            setEditedMovie({ ...editedMovie, rental_period_days: parseInt(e.target.value) || 1 })
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
                          value={editedMovie.rental_max_devices}
                          onChange={(e) =>
                            setEditedMovie({ ...editedMovie, rental_max_devices: parseInt(e.target.value) || 1 })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="exclude_from_plan">Exclude from plan</Label>
                        <Select
                          value={editedMovie.exclude_from_plan ? "yes" : "no"}
                          onValueChange={(value) =>
                            setEditedMovie({ ...editedMovie, exclude_from_plan: value === "yes" })
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
                      value={editedMovie.trailer_url}
                      onChange={(e) =>
                        setEditedMovie({ ...editedMovie, trailer_url: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description / Overview</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter movie description..."
                      rows={6}
                      value={editedMovie.description}
                      onChange={(e) =>
                        setEditedMovie({ ...editedMovie, description: e.target.value })
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
                      {movie.thumbnail ? (
                        <img 
                          src={movie.thumbnail} 
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
                          <p className="font-medium">{movie.genre}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Release Year</p>
                          <p className="font-medium">{movie.release_year}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Rating</p>
                          <p className="font-medium">⭐ {movie.rating}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Views</p>
                          <p className="font-medium">{movie.views?.toLocaleString() || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Version</p>
                          <Badge variant={movie.access === 'free' ? 'default' : movie.access === 'vip' ? 'secondary' : 'outline'}>
                            {movie.access?.toUpperCase() || 'FREE'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant="outline">{movie.status}</Badge>
                        </div>
                      </div>

                      {movie.access === 'rent' && (
                        <div className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg bg-muted/50">
                          <div>
                            <p className="text-sm text-muted-foreground">Rent Price</p>
                            <p className="font-medium">{movie.rental_price || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Rental Period</p>
                            <p className="font-medium">{movie.rental_period_days || 7} days</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Max Devices</p>
                            <p className="font-medium">{movie.rental_max_devices || 1}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Exclude from plan</p>
                            <Badge variant="outline">
                              {movie.exclude_from_plan ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {(movie as any).backdrop_url && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Banner/Backdrop</p>
                      <img 
                        src={(movie as any).backdrop_url} 
                        alt="Backdrop" 
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    </div>
                  )}

                  {(movie as any).trailer_url && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Trailer URL</p>
                      <a 
                        href={(movie as any).trailer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {(movie as any).trailer_url}
                      </a>
                    </div>
                  )}

                  {movie.description && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm leading-relaxed">{movie.description}</p>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">TMDB ID</p>
                      <p className="font-mono text-sm">{movie.tmdb_id || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">IMDB ID</p>
                      <p className="font-mono text-sm">{movie.imdb_id || "-"}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {!isLoading && movie && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Video Sources</CardTitle>
              {!isEditingVideoSources ? (
                <Button onClick={() => setIsEditingVideoSources(true)} variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Sources
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleCancelVideoSourcesEdit} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveVideoSources} 
                    size="sm"
                    disabled={updateVideoSourcesMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateVideoSourcesMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isEditingVideoSources ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-lg font-semibold">Video Sources</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddVideoSource}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Source
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {/* Table Header with green background - Always visible */}
                    <div className="grid grid-cols-[1.2fr,1fr,1.2fr,1fr,2fr,1fr,0.8fr,0.5fr] gap-2 p-3 bg-[hsl(142,76%,36%)] text-white rounded-lg font-medium text-sm">
                      <div>Server Name</div>
                      <div>Version</div>
                      <div>Permission</div>
                      <div>URL Type</div>
                      <div>URL</div>
                      <div>Quality</div>
                      <div>Default</div>
                      <div>Action</div>
                    </div>

                    {/* Table Rows or Empty State */}
                    {videoSources.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground border rounded-lg">
                        No video sources added yet. Click "Add Source" to add one.
                      </div>
                    ) : (
                      videoSources.map((source, index) => (
                        <div key={index} className="space-y-2">
                          <div className="grid grid-cols-[1.2fr,1fr,1.2fr,1fr,2fr,1fr,0.8fr,0.5fr] gap-2 p-3 border rounded-lg items-center">
                            {/* Server Name - Editable */}
                            <Input
                              value={source.server}
                              onChange={(e) => handleVideoSourceChange(index, "server", e.target.value)}
                              placeholder="Server 1"
                              className="h-9"
                            />

                            {/* Version */}
                            <Select
                              value={source.version}
                              onValueChange={(value) => handleVideoSourceChange(index, "version", value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="rent">Premium</SelectItem>
                                <SelectItem value="vip">VIP</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Permission */}
                            <Select
                              value={source.permission}
                              onValueChange={(value) => handleVideoSourceChange(index, "permission", value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Web & Mobile">Web & Mobile</SelectItem>
                                <SelectItem value="Web">Web only</SelectItem>
                                <SelectItem value="Mobile">Mobile only</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* URL Type */}
                            <Select
                              value={source.type}
                              onValueChange={(value) => handleVideoSourceChange(index, "type", value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="iframe">Embed</SelectItem>
                                <SelectItem value="mp4">MP4</SelectItem>
                                <SelectItem value="hls">HLS</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Main URL (for iframe and hls) */}
                            {source.type !== "mp4" ? (
                              <Input
                                value={source.url}
                                onChange={(e) => handleVideoSourceChange(index, "url", e.target.value)}
                                placeholder="https://player.example.com"
                                className="h-9"
                              />
                            ) : (
                              <div className="text-sm text-muted-foreground">See below</div>
                            )}

                            {/* Quality (for non-MP4) or Default Quality Selector (for MP4) */}
                            {source.type === "mp4" ? (
                              <Select
                                value={source.defaultQuality || "720p"}
                                onValueChange={(value) => handleVideoSourceChange(index, "defaultQuality", value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="480p">480p</SelectItem>
                                  <SelectItem value="720p">720p</SelectItem>
                                  <SelectItem value="1080p">1080p</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {source.type === "iframe" ? "auto" : "auto"}
                              </div>
                            )}

                            {/* Default Checkbox */}
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={source.isDefault}
                                onChange={() => handleDefaultChange(index)}
                                className="w-5 h-5 accent-blue-500 cursor-pointer"
                              />
                            </div>

                            {/* Delete Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveVideoSource(index)}
                              className="h-9 w-9"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          {/* Additional Quality URLs for MP4 */}
                          {source.type === "mp4" && (
                            <div className="ml-4 p-4 border-l-4 border-blue-200 bg-muted/30 rounded space-y-3">
                              <div className="text-sm font-medium text-muted-foreground mb-2">
                                Additional Quality URLs:
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <Label className="w-16 text-sm">480p:</Label>
                                  <Input
                                    value={source.mp4Urls?.["480p"] || ""}
                                    onChange={(e) => handleMp4QualityChange(index, "480p", e.target.value)}
                                    placeholder="https://1a-1791.com/video/480p.mp4"
                                    className="flex-1"
                                  />
                                </div>
                                <div className="flex items-center gap-3">
                                  <Label className="w-16 text-sm">720p:</Label>
                                  <Input
                                    value={source.mp4Urls?.["720p"] || ""}
                                    onChange={(e) => handleMp4QualityChange(index, "720p", e.target.value)}
                                    placeholder="https://1a-1791.com/video/720p.mp4"
                                    className="flex-1"
                                  />
                                </div>
                                <div className="flex items-center gap-3">
                                  <Label className="w-16 text-sm">1080p:</Label>
                                  <Input
                                    value={source.mp4Urls?.["1080p"] || ""}
                                    onChange={(e) => handleMp4QualityChange(index, "1080p", e.target.value)}
                                    placeholder="https://1a-1791.com/video/1080p.mp4"
                                    className="flex-1"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {videoSources.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No video sources configured yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-[1.2fr,1fr,1.2fr,1fr,0.8fr] gap-2 p-3 bg-muted rounded-lg font-medium text-sm">
                        <div>Server Name</div>
                        <div>Version</div>
                        <div>Permission</div>
                        <div>URL Type</div>
                        <div>Default</div>
                      </div>
                      {videoSources.map((source, index) => (
                        <div key={index} className="grid grid-cols-[1.2fr,1fr,1.2fr,1fr,0.8fr] gap-2 p-3 border rounded-lg items-center">
                          <div className="text-sm">{source.server}</div>
                          <div>
                            <Badge variant="outline">{source.version}</Badge>
                          </div>
                          <div className="text-sm">{source.permission}</div>
                          <div>
                            <Badge variant="secondary">{source.type.toUpperCase()}</Badge>
                          </div>
                          <div className="flex justify-center">
                            {source.isDefault && (
                              <Badge variant="default">Default</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cast Management Section */}
        {!isLoading && movie && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cast Members</CardTitle>
              <Button 
                onClick={() => {
                  setSelectedCast(null);
                  setCastDialogOpen(true);
                }} 
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Cast
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cast && cast.length > 0 ? (
                  <div className="grid gap-4">
                    {cast.map((member: any) => (
                      <div 
                        key={member.id} 
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={member.profile_url} alt={member.actor_name} />
                          <AvatarFallback>{member.actor_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{member.actor_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            as {member.character_name || "Unknown Character"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Order: {member.order_index}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCast(member)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCast(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No cast members added yet. Click "Add Cast" to start.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <CastDialog
          open={castDialogOpen}
          onOpenChange={setCastDialogOpen}
          castMember={selectedCast}
          onSave={handleSaveCast}
        />
      </div>
    </AdminLayout>
  );
};

export default MoviesEdit;