import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, RefreshCw, Youtube, Plus, Pencil, Trash2, Download, ChevronDown, ChevronRight, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CharacterDialog } from "@/components/admin/CharacterDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EpisodeEditDialog } from "@/components/admin/EpisodeEditDialog";
import { ImportEpisodeSourcesDialog } from "@/components/admin/ImportEpisodeSourcesDialog";
import { VideoSourcesImportDialog } from "@/components/admin/VideoSourcesImportDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AnimesEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingAPI, setFetchingAPI] = useState(false);
  const [anime, setAnime] = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<any>(null);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [editingEpisode, setEditingEpisode] = useState<any>(null);
  const [importingSeasonId, setImportingSeasonId] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAnime();
      fetchCharacters();
    }
  }, [id]);

  const { data: seasons = [] } = useQuery({
    queryKey: ["anime-seasons", id],
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
    queryKey: ["anime-episodes", id],
    queryFn: async () => {
      const seasonIds = seasons.map((s) => s.id);
      if (seasonIds.length === 0) return {};

      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .in("season_id", seasonIds)
        .order("episode_number", { ascending: true });

      if (error) throw error;

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

  const handleImportEpisodes = async () => {
    try {
      setImporting(true);
      toast.info("Importing episodes...");

      const { data, error } = await supabase.functions.invoke('import-anime-episodes', {
        body: { animeId: id },
      });

      if (error) throw error;

      toast.success(data.message || "Episodes imported successfully!");
      queryClient.invalidateQueries({ queryKey: ["anime-seasons", id] });
      queryClient.invalidateQueries({ queryKey: ["anime-episodes", id] });
    } catch (error: any) {
      console.error("Error importing episodes:", error);
      toast.error("Failed to import episodes: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  const fetchAnime = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("animes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setAnime(data);
    } catch (error: any) {
      console.error("Error fetching anime:", error);
      toast.error("Failed to load anime data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from("anime_characters")
        .select(`
          *,
          character_voice_actors(
            voice_actors(*)
          )
        `)
        .eq("anime_id", id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setCharacters(data || []);
    } catch (error) {
      console.error("Error fetching characters:", error);
    }
  };

  const fetchFullDataFromAPI = async () => {
    if (!anime?.anilist_id) {
      toast.error("AniList ID is required to fetch data from API");
      return;
    }

    try {
      setFetchingAPI(true);
      toast.info("Fetching full data from AniList API...");

      const { data, error } = await supabase.functions.invoke("fetch-anilist-data", {
        body: { anilistId: anime.anilist_id, type: "anime" },
      });

      if (error) throw error;

      const media = data.Media;
      if (media) {

        // Build trailer URL
        let trailerUrl = "";
        if (media.trailer) {
          if (media.trailer.site === "youtube") {
            trailerUrl = `https://www.youtube.com/watch?v=${media.trailer.id}`;
          } else if (media.trailer.site === "dailymotion") {
            trailerUrl = `https://www.dailymotion.com/video/${media.trailer.id}`;
          }
        }

        // Update anime with trailer
        const updatedAnime = {
          ...anime,
          trailer_url: trailerUrl,
        };
        setAnime(updatedAnime);

        // Process and save characters
        if (media.characters?.edges && media.characters.edges.length > 0) {
          toast.info(`Processing ${media.characters.edges.length} characters...`);
          
          const characterPromises = media.characters.edges
            .filter((edge: any) => edge.node && edge.role !== "BACKGROUND")
            .map(async (edge: any, index: number) => {
              const char = edge.node;
              
              let birthDate = "";
              if (char.dateOfBirth) {
                const parts = [];
                if (char.dateOfBirth.year) parts.push(char.dateOfBirth.year);
                if (char.dateOfBirth.month) parts.push(char.dateOfBirth.month.toString().padStart(2, "0"));
                if (char.dateOfBirth.day) parts.push(char.dateOfBirth.day.toString().padStart(2, "0"));
                birthDate = parts.join("-");
              }

              // Check if character already exists
              const { data: existing } = await supabase
                .from("anime_characters")
                .select("id")
                .eq("anime_id", id)
                .eq("anilist_id", char.id)
                .maybeSingle();

              const characterData = {
                anime_id: id,
                name: char.name.full || "",
                name_native: char.name.native || "",
                description: char.description ? char.description.replace(/<[^>]*>/g, "") : "",
                image_url: char.image?.large || "",
                role: edge.role === "MAIN" ? "main" : "supporting",
                age: char.age?.toString() || "",
                gender: char.gender || "",
                birth_date: birthDate,
                anilist_id: char.id,
                order_index: index,
              };

              let characterId: string;
              
              if (existing) {
                // Update existing character
                await supabase
                  .from("anime_characters")
                  .update(characterData)
                  .eq("id", existing.id);
                characterId = existing.id;
              } else {
                // Insert new character
                const { data: newChar, error: insertError } = await supabase
                  .from("anime_characters")
                  .insert(characterData)
                  .select("id")
                  .single();
                
                if (insertError) throw insertError;
                characterId = newChar.id;
              }

              // Process voice actors
              if (edge.voiceActors && edge.voiceActors.length > 0) {
                for (const va of edge.voiceActors) {
                  if (!va.id) continue;

                  // Check if voice actor exists
                  const { data: existingVA } = await supabase
                    .from("voice_actors")
                    .select("id")
                    .eq("anilist_id", va.id)
                    .maybeSingle();

                  let vaId: string;
                  
                  const vaData = {
                    name: va.name?.full || "",
                    name_native: va.name?.native || "",
                    image_url: va.image?.large || "",
                    language: va.language || "Japanese",
                    gender: va.gender || "",
                    date_of_birth: va.dateOfBirth ? 
                      `${va.dateOfBirth.year || ""}-${va.dateOfBirth.month?.toString().padStart(2, "0") || ""}-${va.dateOfBirth.day?.toString().padStart(2, "0") || ""}`.replace(/^-+|-+$/g, "") 
                      : null,
                    age: va.age || null,
                    description: va.description || "",
                    anilist_id: va.id,
                  };

                  if (existingVA) {
                    await supabase
                      .from("voice_actors")
                      .update(vaData)
                      .eq("id", existingVA.id);
                    vaId = existingVA.id;
                  } else {
                    const { data: newVA, error: vaError } = await supabase
                      .from("voice_actors")
                      .insert(vaData)
                      .select("id")
                      .single();
                    
                    if (vaError) throw vaError;
                    vaId = newVA.id;
                  }

                  // Link character to voice actor
                  const { data: existingLink } = await supabase
                    .from("character_voice_actors")
                    .select("id")
                    .eq("character_id", characterId)
                    .eq("voice_actor_id", vaId)
                    .maybeSingle();

                  if (!existingLink) {
                    await supabase
                      .from("character_voice_actors")
                      .insert({
                        character_id: characterId,
                        voice_actor_id: vaId,
                      });
                  }
                }
              }
            });

          await Promise.all(characterPromises);
          await fetchCharacters();
          toast.success(`Fetched and saved ${media.characters.edges.filter((e: any) => e.node && e.role !== "BACKGROUND").length} characters with voice actors!`);
        } else {
          toast.info("No characters found for this anime.");
        }

        toast.success("Successfully fetched full data from AniList API!");
      } else {
        toast.error("No anime data found in AniList response");
      }
    } catch (error: any) {
      console.error("Error fetching from API:", error);
      toast.error("Failed to fetch data from AniList API: " + error.message);
    } finally {
      setFetchingAPI(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("animes")
        .update({
          title: anime.title,
          description: anime.description,
          thumbnail: anime.thumbnail,
          backdrop_url: anime.backdrop_url,
          trailer_url: anime.trailer_url,
          genre: anime.genre,
          studio: anime.studio,
          source_material: anime.source_material,
          type: anime.type,
          status: anime.status,
          release_year: anime.release_year,
          episodes_count: anime.episodes_count,
          rating: anime.rating,
          access: anime.access,
          version: anime.version,
          rental_price: anime.rental_price,
          rental_period_days: anime.rental_period_days,
          rental_max_devices: anime.rental_max_devices,
          exclude_from_plan: anime.exclude_from_plan,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Anime updated successfully!");
      navigate("/admin/animes");
    } catch (error: any) {
      console.error("Error saving anime:", error);
      toast.error("Failed to save anime: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading anime data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!anime) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Anime not found</p>
            <Button onClick={() => navigate("/admin/animes")} className="mt-4">
              Back to Animes
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/animes")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Anime</h1>
              <p className="text-muted-foreground">{anime.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchFullDataFromAPI}
              disabled={fetchingAPI || !anime.anilist_id}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${fetchingAPI ? "animate-spin" : ""}`} />
              Fetch from API
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="episodes">
              Episodes ({seasons.reduce((total, s) => total + (episodesBySeason[s.id]?.length || 0), 0)})
            </TabsTrigger>
            <TabsTrigger value="characters">
              Characters ({characters.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={anime.title}
                        onChange={(e) => setAnime({ ...anime, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={anime.description || ""}
                        onChange={(e) => setAnime({ ...anime, description: e.target.value })}
                        rows={6}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                          value={anime.type}
                          onValueChange={(value) => setAnime({ ...anime, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tv">TV Series</SelectItem>
                            <SelectItem value="movie">Movie</SelectItem>
                            <SelectItem value="ova">OVA</SelectItem>
                            <SelectItem value="ona">ONA</SelectItem>
                            <SelectItem value="special">Special</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={anime.status}
                          onValueChange={(value) => setAnime({ ...anime, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="on_air">On Air</SelectItem>
                            <SelectItem value="ended">Ended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="release_year">Release Year</Label>
                        <Input
                          id="release_year"
                          type="number"
                          value={anime.release_year || ""}
                          onChange={(e) =>
                            setAnime({ ...anime, release_year: parseInt(e.target.value) || null })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="episodes">Episodes</Label>
                        <Input
                          id="episodes"
                          type="number"
                          value={anime.episodes_count || ""}
                          onChange={(e) =>
                            setAnime({ ...anime, episodes_count: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rating">Rating (0-10)</Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={anime.rating || ""}
                        onChange={(e) =>
                          setAnime({ ...anime, rating: parseFloat(e.target.value) || null })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Production Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="studio">Studio</Label>
                      <Input
                        id="studio"
                        value={anime.studio || ""}
                        onChange={(e) => setAnime({ ...anime, studio: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="source">Source Material</Label>
                      <Input
                        id="source"
                        value={anime.source_material || ""}
                        onChange={(e) => setAnime({ ...anime, source_material: e.target.value })}
                        placeholder="e.g., Manga, Light Novel, Original"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="genre">Genres</Label>
                      <Input
                        id="genre"
                        value={anime.genre || ""}
                        onChange={(e) => setAnime({ ...anime, genre: e.target.value })}
                        placeholder="Comma-separated genres"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Media Assets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail">Thumbnail URL</Label>
                      <Input
                        id="thumbnail"
                        value={anime.thumbnail || ""}
                        onChange={(e) => setAnime({ ...anime, thumbnail: e.target.value })}
                        placeholder="https://..."
                      />
                      {anime.thumbnail && (
                        <img
                          src={anime.thumbnail}
                          alt="Thumbnail preview"
                          className="w-32 h-48 object-cover rounded border"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backdrop">Backdrop URL</Label>
                      <Input
                        id="backdrop"
                        value={anime.backdrop_url || ""}
                        onChange={(e) => setAnime({ ...anime, backdrop_url: e.target.value })}
                        placeholder="https://..."
                      />
                      {anime.backdrop_url && (
                        <img
                          src={anime.backdrop_url}
                          alt="Backdrop preview"
                          className="w-full h-32 object-cover rounded border"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trailer" className="flex items-center gap-2">
                        <Youtube className="h-4 w-4" />
                        Trailer URL
                      </Label>
                      <Input
                        id="trailer"
                        value={anime.trailer_url || ""}
                        onChange={(e) => setAnime({ ...anime, trailer_url: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      {anime.trailer_url && (
                        <Badge variant="outline" className="gap-2">
                          <Youtube className="h-3 w-3" />
                          Trailer Available
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>API Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="anilist_id">AniList ID</Label>
                      <Input
                        id="anilist_id"
                        value={anime.anilist_id || ""}
                        onChange={(e) => setAnime({ ...anime, anilist_id: e.target.value })}
                        placeholder="e.g., 21"
                      />
                      <p className="text-xs text-muted-foreground">
                        Required to fetch data from AniList API
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mal_id">MyAnimeList ID</Label>
                      <Input
                        id="mal_id"
                        value={anime.mal_id || ""}
                        onChange={(e) => setAnime({ ...anime, mal_id: e.target.value })}
                        placeholder="e.g., 21"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Access & Version</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="access">Access Type</Label>
                      <Select
                        value={anime.access}
                        onValueChange={(value) => setAnime({ ...anime, access: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="version">Version</Label>
                      <Select
                        value={anime.version || "Free"}
                        onValueChange={(value) => setAnime({ ...anime, version: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Free">Free</SelectItem>
                          <SelectItem value="Rent">Rent</SelectItem>
                          <SelectItem value="VIP">VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {anime.version === "Rent" && (
                      <div className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg bg-muted/50">
                        <div className="space-y-2">
                          <Label htmlFor="rental_price">Rent Price</Label>
                          <Input
                            id="rental_price"
                            type="number"
                            placeholder="1"
                            value={anime.rental_price || 0}
                            onChange={(e) =>
                              setAnime({ ...anime, rental_price: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="rental_period_days">Rental Period (Days)</Label>
                          <Input
                            id="rental_period_days"
                            type="number"
                            placeholder="7"
                            value={anime.rental_period_days || 7}
                            onChange={(e) =>
                              setAnime({ ...anime, rental_period_days: parseInt(e.target.value) || 1 })
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
                            value={anime.rental_max_devices || 1}
                            onChange={(e) =>
                              setAnime({ ...anime, rental_max_devices: parseInt(e.target.value) || 1 })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="exclude_from_plan">Exclude from plan</Label>
                          <Select
                            value={anime.exclude_from_plan ? "yes" : "no"}
                            onValueChange={(value) =>
                              setAnime({ ...anime, exclude_from_plan: value === "yes" })
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="episodes">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Import Episodes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      This will create episodes based on the episode count set in the Details tab.
                      Make sure to set the Episodes Count before importing.
                    </p>
                    <Button 
                      onClick={handleImportEpisodes}
                      disabled={importing}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {importing ? "Importing..." : "Import Episodes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Seasons & Episodes</CardTitle>
                </CardHeader>
                <CardContent>
                  {seasons.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No episodes found. Use the Import button above to create episodes.
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
                                        {season.name}
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
                                          <TableHead className="w-32">Video Sources</TableHead>
                                          <TableHead className="w-24 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {episodes.map((episode) => (
                                          <TableRow key={episode.id}>
                                            <TableCell className="font-medium">{episode.episode_number}</TableCell>
                                            <TableCell>
                                              {episode.still_path ? (
                                                <img 
                                                  src={episode.still_path} 
                                                  alt={episode.name} 
                                                  className="w-20 h-12 object-cover rounded"
                                                />
                                              ) : (
                                                <div className="w-20 h-12 bg-muted rounded flex items-center justify-center text-xs">
                                                  No image
                                                </div>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <div className="max-w-xs">
                                                <p className="font-medium line-clamp-1">{episode.name}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                  {episode.overview || "No description"}
                                                </p>
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              {episode.air_date
                                                ? new Date(episode.air_date).toLocaleDateString()
                                                : "TBA"}
                                            </TableCell>
                                            <TableCell>
                                              {episode.runtime ? `${episode.runtime}m` : "N/A"}
                                            </TableCell>
                                            <TableCell>
                                              <Badge variant={episode.access === 'free' ? 'default' : 'secondary'}>
                                                {episode.access?.toUpperCase() || 'FREE'}
                                              </Badge>
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex items-center gap-1">
                                                {Array.isArray(episode.video_sources) && episode.video_sources.length > 0 ? (
                                                  <>
                                                    <Badge variant="outline" className="text-xs">
                                                      {episode.video_sources.length} source{episode.video_sources.length > 1 ? 's' : ''}
                                                    </Badge>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-6 w-6"
                                                      onClick={() => setShowBulkImport(true)}
                                                    >
                                                      <Upload className="h-3 w-3" />
                                                    </Button>
                                                  </>
                                                ) : (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs"
                                                    onClick={() => setShowBulkImport(true)}
                                                  >
                                                    <Upload className="h-3 w-3 mr-1" />
                                                    Add
                                                  </Button>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-right">
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
          </TabsContent>

          <TabsContent value="characters">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Characters & Cast</CardTitle>
                <Button onClick={() => { setSelectedCharacter(null); setCharacterDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Character
                </Button>
              </CardHeader>
              <CardContent>
                {characters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No characters added yet.</p>
                    <p className="text-sm mt-2">
                      Use "Fetch from API" to automatically import characters from AniList.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {characters.map((character) => {
                      const voiceActors = character.character_voice_actors?.map((cva: any) => cva.voice_actors) || [];
                      
                      return (
                        <Card key={character.id} className="overflow-hidden">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-6">
                              {/* Character Section */}
                              <div className="flex items-start gap-4 flex-1">
                                <Avatar className="h-20 w-20 rounded-lg">
                                  <AvatarImage src={character.image_url || ""} alt={character.name} className="object-cover" />
                                  <AvatarFallback className="rounded-lg">{character.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-lg">{character.name}</h4>
                                  {character.name_native && (
                                    <p className="text-sm text-muted-foreground">
                                      {character.name_native}
                                    </p>
                                  )}
                                  <Badge variant="outline" className="mt-2 capitalize">
                                    {character.role}
                                  </Badge>
                                </div>
                              </div>

                              {/* Voice Actors Section */}
                              {voiceActors.length > 0 && (
                                <div className="flex items-start gap-4 flex-1">
                                  {voiceActors.slice(0, 2).map((va: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-3 flex-1">
                                      <div className="flex-1 min-w-0 text-right">
                                        <h4 className="font-semibold">{va.name}</h4>
                                        {va.name_native && (
                                          <p className="text-sm text-muted-foreground">
                                            {va.name_native}
                                          </p>
                                        )}
                                        <Badge variant="secondary" className="mt-2">
                                          {va.language}
                                        </Badge>
                                      </div>
                                      <Avatar className="h-20 w-20 rounded-lg">
                                        <AvatarImage src={va.image_url || ""} alt={va.name} className="object-cover" />
                                        <AvatarFallback className="rounded-lg">{va.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => { setSelectedCharacter(character); setCharacterDialogOpen(true); }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => { setCharacterToDelete(character); setDeleteDialogOpen(true); }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Character Dialog */}
      <CharacterDialog
        open={characterDialogOpen}
        onOpenChange={(open) => {
          setCharacterDialogOpen(open);
          if (!open) {
            setSelectedCharacter(null);
            fetchCharacters();
          }
        }}
        character={selectedCharacter}
        animeId={id!}
      />

      {/* Episode Edit Dialog */}
      {editingEpisode && (
        <EpisodeEditDialog
          episode={editingEpisode}
          open={!!editingEpisode}
          onOpenChange={(open) => {
            if (!open) {
              setEditingEpisode(null);
              queryClient.invalidateQueries({ queryKey: ["anime-episodes", id] });
            }
          }}
          seriesId={id!}
        />
      )}

      {/* Import Episode Sources Dialog */}
      {importingSeasonId && (
        <ImportEpisodeSourcesDialog
          seasonId={importingSeasonId}
          isOpen={!!importingSeasonId}
          onOpenChange={(open) => {
            if (!open) {
              setImportingSeasonId(null);
            }
          }}
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["anime-episodes", id] });
            setImportingSeasonId(null);
          }}
        />
      )}

      {/* Bulk Video Sources Import Dialog */}
      {showBulkImport && (
        <VideoSourcesImportDialog
          open={showBulkImport}
          onOpenChange={(open) => {
            setShowBulkImport(open);
            if (!open) {
              queryClient.invalidateQueries({ queryKey: ["anime-episodes", id] });
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Character?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{characterToDelete?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from("anime_characters")
                    .delete()
                    .eq("id", characterToDelete.id);
                  
                  if (error) throw error;
                  
                  toast.success("Character deleted successfully!");
                  fetchCharacters();
                  setDeleteDialogOpen(false);
                  setCharacterToDelete(null);
                } catch (error: any) {
                  toast.error("Failed to delete character: " + error.message);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
