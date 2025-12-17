import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UpcomingRelease {
  title: string;
  type: string;
  description: string;
  thumbnail: string;
  backdrop_url: string;
  trailer_url: string;
  release_date: Date | undefined;
  genre: string;
  status: string;
  tmdb_id: string;
  imdb_id: string;
}

export default function UpcomingCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<UpcomingRelease>({
    title: "",
    type: "movie",
    description: "",
    thumbnail: "",
    backdrop_url: "",
    trailer_url: "",
    release_date: undefined,
    genre: "",
    status: "announced",
    tmdb_id: "",
    imdb_id: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced TMDB search
  useEffect(() => {
    const searchTMDB = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase.functions.invoke('search-tmdb', {
          body: { query: searchQuery, type: 'multi' }
        });

        if (error) throw error;
        setSearchResults(data.results || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('TMDB search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchTMDB, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectItem = async (item: any) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-tmdb-details', {
        body: { tmdb_id: item.tmdb_id, type: item.type }
      });

      if (error) throw error;

      setFormData({
        ...formData,
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        backdrop_url: data.backdrop_url,
        trailer_url: data.trailer_url || "",
        release_date: data.release_date ? new Date(data.release_date) : undefined,
        genre: data.genre,
        tmdb_id: data.tmdb_id,
        imdb_id: data.imdb_id,
        type: item.type === 'tv' ? 'series' : item.type,
      });

      setSearchQuery(data.title);
      setShowSuggestions(false);
      toast.success('Data imported from TMDB!');
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Failed to import data from TMDB');
    } finally {
      setIsSearching(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const dataToSave = {
        ...formData,
        release_date: formData.release_date?.toISOString().split('T')[0] || null,
      };

      const { error } = await supabase
        .from("upcoming_releases")
        .insert([dataToSave]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Release added successfully!");
      queryClient.invalidateQueries({ queryKey: ["upcoming_releases"] });
      navigate("/admin/upcoming");
    },
    onError: (error: Error) => {
      toast.error("Failed to save release: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.type) {
      toast.error("Please fill in all required fields");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/upcoming")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Upcoming Release</h1>
            <p className="text-muted-foreground">Create a new upcoming release entry</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Release Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 relative">
                  <Label htmlFor="title">Title * (Search TMDB)</Label>
                  <div className="relative">
                    <Input
                      id="title"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setFormData({ ...formData, title: e.target.value });
                      }}
                      onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                      placeholder="Type to search TMDB..."
                      required
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  
                  {showSuggestions && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-auto">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            {searchResults.map((item) => (
                              <CommandItem
                                key={item.id}
                                value={item.title}
                                onSelect={() => handleSelectItem(item)}
                                className="cursor-pointer"
                              >
                                <div className="flex items-start gap-3">
                                  {item.poster && (
                                    <img 
                                      src={item.poster} 
                                      alt={item.title}
                                      className="w-12 h-16 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium">{item.title}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {item.type} • {item.year}
                                    </div>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movie">Movie</SelectItem>
                      <SelectItem value="series">Series</SelectItem>
                      <SelectItem value="anime">Anime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    placeholder="Action, Drama, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announced">Announced</SelectItem>
                      <SelectItem value="coming_soon">Coming Soon</SelectItem>
                      <SelectItem value="released">Released</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Release Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.release_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.release_date ? format(formData.release_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.release_date}
                        onSelect={(date) => setFormData({ ...formData, release_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description..."
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backdrop">Backdrop URL</Label>
                  <Input
                    id="backdrop"
                    value={formData.backdrop_url}
                    onChange={(e) => setFormData({ ...formData, backdrop_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trailer">Trailer URL</Label>
                  <Input
                    id="trailer"
                    value={formData.trailer_url}
                    onChange={(e) => setFormData({ ...formData, trailer_url: e.target.value })}
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tmdb_id">TMDB ID</Label>
                  <Input
                    id="tmdb_id"
                    value={formData.tmdb_id}
                    onChange={(e) => setFormData({ ...formData, tmdb_id: e.target.value })}
                    placeholder="12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imdb_id">IMDB ID</Label>
                  <Input
                    id="imdb_id"
                    value={formData.imdb_id}
                    onChange={(e) => setFormData({ ...formData, imdb_id: e.target.value })}
                    placeholder="tt1234567"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/admin/upcoming")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Release
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}
