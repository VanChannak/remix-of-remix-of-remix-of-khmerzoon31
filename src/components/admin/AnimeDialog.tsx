import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageUploadField } from "./ImageUploadField";

interface Anime {
  id?: string;
  title: string;
  description: string;
  thumbnail: string;
  backdrop_url: string;
  trailer_url: string;
  genre: string;
  studio: string;
  source_material: string;
  type: string;
  access: string;
  status: string;
  release_year: number | null;
  episodes_count: number;
  rating: number;
  rental_price: number;
  rental_period_days: number;
  exclude_from_plan: boolean;
  tmdb_id: string;
  mal_id: string;
  anilist_id: string;
}

interface AnimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anime: Anime | null;
}

export function AnimeDialog({ open, onOpenChange, anime }: AnimeDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!anime?.id;

  const [formData, setFormData] = useState<Anime>({
    title: "",
    description: "",
    thumbnail: "",
    backdrop_url: "",
    trailer_url: "",
    genre: "",
    studio: "",
    source_material: "manga",
    type: "tv",
    access: "free",
    status: "published",
    release_year: null,
    episodes_count: 0,
    rating: 0,
    rental_price: 0,
    rental_period_days: 7,
    exclude_from_plan: false,
    tmdb_id: "",
    mal_id: "",
    anilist_id: "",
  });

  useEffect(() => {
    if (anime) {
      setFormData(anime);
    } else {
      setFormData({
        title: "",
        description: "",
        thumbnail: "",
        backdrop_url: "",
        trailer_url: "",
        genre: "",
        studio: "",
        source_material: "manga",
        type: "tv",
        access: "free",
        status: "published",
        release_year: null,
        episodes_count: 0,
        rating: 0,
        rental_price: 0,
        rental_period_days: 7,
        exclude_from_plan: false,
        tmdb_id: "",
        mal_id: "",
        anilist_id: "",
      });
    }
  }, [anime, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEditing) {
        const { error } = await supabase
          .from("animes")
          .update(formData)
          .eq("id", anime.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("animes")
          .insert([formData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Anime updated successfully!" : "Anime added successfully!");
      queryClient.invalidateQueries({ queryKey: ["animes"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to save anime: " + error.message);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} Anime</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter anime title"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
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
              <Label htmlFor="source_material">Source</Label>
              <Select
                value={formData.source_material}
                onValueChange={(value) => setFormData({ ...formData, source_material: value })}
              >
                <SelectTrigger id="source_material">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manga">Manga</SelectItem>
                  <SelectItem value="light_novel">Light Novel</SelectItem>
                  <SelectItem value="visual_novel">Visual Novel</SelectItem>
                  <SelectItem value="original">Original</SelectItem>
                  <SelectItem value="game">Game</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="studio">Studio</Label>
              <Input
                id="studio"
                value={formData.studio}
                onChange={(e) => setFormData({ ...formData, studio: e.target.value })}
                placeholder="Studio name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="Action, Adventure, Fantasy"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="release_year">Release Year</Label>
              <Input
                id="release_year"
                type="number"
                value={formData.release_year || ""}
                onChange={(e) => setFormData({ ...formData, release_year: parseInt(e.target.value) || null })}
                placeholder="2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="episodes_count">Episodes</Label>
              <Input
                id="episodes_count"
                type="number"
                value={formData.episodes_count}
                onChange={(e) => setFormData({ ...formData, episodes_count: parseInt(e.target.value) || 0 })}
                placeholder="12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                max="10"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                placeholder="8.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access">Access Type</Label>
            <Select
              value={formData.access}
              onValueChange={(value) => setFormData({ ...formData, access: value })}
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

          {formData.access === "rent" && (
            <div className="grid gap-4 md:grid-cols-3 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="rental_price">Rent Price</Label>
                <Input
                  id="rental_price"
                  type="number"
                  step="0.01"
                  value={formData.rental_price}
                  onChange={(e) => setFormData({ ...formData, rental_price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rental_period_days">Rental Period (Days)</Label>
                <Input
                  id="rental_period_days"
                  type="number"
                  value={formData.rental_period_days}
                  onChange={(e) => setFormData({ ...formData, rental_period_days: parseInt(e.target.value) || 7 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exclude_from_plan">Exclude from plan</Label>
                <Select
                  value={formData.exclude_from_plan ? "yes" : "no"}
                  onValueChange={(value) => setFormData({ ...formData, exclude_from_plan: value === "yes" })}
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description..."
              rows={4}
            />
          </div>

          <ImageUploadField
            label="Poster/Thumbnail"
            value={formData.thumbnail}
            onChange={(url) => setFormData({ ...formData, thumbnail: url })}
            bucketPath="animes/posters"
          />

          <ImageUploadField
            label="Backdrop Image"
            value={formData.backdrop_url}
            onChange={(url) => setFormData({ ...formData, backdrop_url: url })}
            bucketPath="animes/backdrops"
          />

          <div className="grid gap-4 md:grid-cols-3">
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
              <Label htmlFor="mal_id">MyAnimeList ID</Label>
              <Input
                id="mal_id"
                value={formData.mal_id}
                onChange={(e) => setFormData({ ...formData, mal_id: e.target.value })}
                placeholder="12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="anilist_id">AniList ID</Label>
              <Input
                id="anilist_id"
                value={formData.anilist_id}
                onChange={(e) => setFormData({ ...formData, anilist_id: e.target.value })}
                placeholder="12345"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : isEditing ? "Update" : "Add"} Anime
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
