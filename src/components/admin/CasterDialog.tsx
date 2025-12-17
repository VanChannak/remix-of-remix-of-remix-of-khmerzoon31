import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CastMember {
  id?: string;
  actor_name: string;
  character_name: string | null;
  profile_url: string | null;
  order_index: number | null;
  media_id: string | null;
  media_type: "movie" | "series";
}

interface CasterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  castMember: CastMember | null;
  onSave: (castMember: Omit<CastMember, "id" | "media_title">) => void;
}

interface MediaOption {
  id: string;
  title: string;
}

export function CasterDialog({ open, onOpenChange, castMember, onSave }: CasterDialogProps) {
  const [formData, setFormData] = useState<Omit<CastMember, "id" | "media_title">>({
    actor_name: "",
    character_name: "",
    profile_url: "",
    order_index: 0,
    media_id: null,
    media_type: "movie",
  });
  const [movies, setMovies] = useState<MediaOption[]>([]);
  const [series, setSeries] = useState<MediaOption[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMedia();
    }
  }, [open]);

  useEffect(() => {
    if (castMember) {
      setFormData({
        actor_name: castMember.actor_name,
        character_name: castMember.character_name,
        profile_url: castMember.profile_url,
        order_index: castMember.order_index,
        media_id: castMember.media_id,
        media_type: castMember.media_type,
      });
    } else {
      setFormData({
        actor_name: "",
        character_name: "",
        profile_url: "",
        order_index: 0,
        media_id: null,
        media_type: "movie",
      });
    }
  }, [castMember, open]);

  const fetchMedia = async () => {
    try {
      setLoadingMedia(true);
      
      const [moviesData, seriesData] = await Promise.all([
        supabase.from("movies").select("id, title").eq("status", "published").order("title"),
        supabase.from("series").select("id, title").eq("status", "published").order("title"),
      ]);

      if (moviesData.data) setMovies(moviesData.data);
      if (seriesData.data) setSeries(seriesData.data);
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  const mediaOptions = formData.media_type === "movie" ? movies : series;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{castMember ? "Edit Cast Member" : "Add Cast Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="actor_name">Actor Name *</Label>
            <Input
              id="actor_name"
              value={formData.actor_name}
              onChange={(e) => setFormData({ ...formData, actor_name: e.target.value })}
              required
              placeholder="e.g., Tom Hanks"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="character_name">Character Name</Label>
            <Input
              id="character_name"
              value={formData.character_name || ""}
              onChange={(e) => setFormData({ ...formData, character_name: e.target.value })}
              placeholder="e.g., Forrest Gump"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile_url">Profile Photo URL</Label>
            <Input
              id="profile_url"
              value={formData.profile_url || ""}
              onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              placeholder="https://image.tmdb.org/t/p/w500/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media_type">Media Type *</Label>
            <Select
              value={formData.media_type}
              onValueChange={(value: "movie" | "series") =>
                setFormData({ ...formData, media_type: value, media_id: null })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movie">Movie</SelectItem>
                <SelectItem value="series">Series</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="media_id">{formData.media_type === "movie" ? "Movie" : "Series"}</Label>
            <Select
              value={formData.media_id || ""}
              onValueChange={(value) => setFormData({ ...formData, media_id: value })}
              disabled={loadingMedia}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingMedia ? "Loading..." : "Select media"} />
              </SelectTrigger>
              <SelectContent>
                {mediaOptions.map((media) => (
                  <SelectItem key={media.id} value={media.id}>
                    {media.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_index">Display Order</Label>
            <Input
              id="order_index"
              type="number"
              value={formData.order_index || 0}
              onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {castMember ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
