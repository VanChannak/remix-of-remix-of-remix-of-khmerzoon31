import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function CasterEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = id !== "new";

  const [formData, setFormData] = useState({
    actor_name: "",
    character_name: "",
    profile_url: "",
    media_id: "",
    media_type: "movie",
    order_index: "0",
  });

  const { data: movies } = useQuery({
    queryKey: ["movies-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: series } = useQuery({
    queryKey: ["series-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: caster, isLoading } = useQuery({
    queryKey: ["caster", id],
    queryFn: async () => {
      if (!isEdit) return null;
      
      const { data: movieCast, error: movieError } = await supabase
        .from("movie_cast")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (movieCast) {
        return { ...movieCast, media_type: "movie", media_id: movieCast.movie_id };
      }
      
      const { data: seriesCast, error: seriesError } = await supabase
        .from("series_cast")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (seriesCast) {
        return { ...seriesCast, media_type: "series", media_id: seriesCast.series_id };
      }
      
      throw new Error("Cast member not found");
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (caster) {
      setFormData({
        actor_name: caster.actor_name || "",
        character_name: caster.character_name || "",
        profile_url: caster.profile_url || "",
        media_id: caster.media_id || "",
        media_type: caster.media_type || "movie",
        order_index: caster.order_index?.toString() || "0",
      });
    }
  }, [caster]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        actor_name: data.actor_name,
        character_name: data.character_name,
        profile_url: data.profile_url,
        order_index: parseInt(data.order_index),
      };

      if (data.media_type === "movie") {
        const moviePayload = { ...payload, movie_id: data.media_id };
        if (isEdit) {
          const { error } = await supabase
            .from("movie_cast")
            .update(moviePayload)
            .eq("id", id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("movie_cast")
            .insert([moviePayload]);
          if (error) throw error;
        }
      } else {
        const seriesPayload = { ...payload, series_id: data.media_id };
        if (isEdit) {
          const { error } = await supabase
            .from("series_cast")
            .update(seriesPayload)
            .eq("id", id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("series_cast")
            .insert([seriesPayload]);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cast-members"] });
      toast.success(isEdit ? "Cast member updated" : "Cast member created");
      navigate("/admin/casters");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save cast member");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.actor_name.trim() || !formData.media_id) {
      toast.error("Actor name and media are required");
      return;
    }
    saveMutation.mutate(formData);
  };

  if (isEdit && isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  const mediaList = formData.media_type === "movie" ? movies : series;

  return (
    <AdminLayout>
      <div className="p-8 space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/casters")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{isEdit ? "Edit Cast Member" : "Add Cast Member"}</h1>
            <p className="text-muted-foreground">Manage cast information for movies and series</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border">
          <div>
            <Label htmlFor="actor_name">Actor Name *</Label>
            <Input
              id="actor_name"
              value={formData.actor_name}
              onChange={(e) => setFormData({ ...formData, actor_name: e.target.value })}
              placeholder="Actor's full name"
            />
          </div>

          <div>
            <Label htmlFor="character_name">Character Name</Label>
            <Input
              id="character_name"
              value={formData.character_name}
              onChange={(e) => setFormData({ ...formData, character_name: e.target.value })}
              placeholder="Character played"
            />
          </div>

          <div>
            <Label htmlFor="profile_url">Profile Image URL</Label>
            <Input
              id="profile_url"
              value={formData.profile_url}
              onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              placeholder="https://..."
            />
            {formData.profile_url && (
              <img 
                src={formData.profile_url} 
                alt="Profile preview" 
                className="mt-2 w-24 h-32 object-cover rounded"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="media_type">Media Type *</Label>
              <Select
                value={formData.media_type}
                onValueChange={(value) => setFormData({ ...formData, media_type: value, media_id: "" })}
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

            <div>
              <Label htmlFor="media_id">Select {formData.media_type === "movie" ? "Movie" : "Series"} *</Label>
              <Select
                value={formData.media_id}
                onValueChange={(value) => setFormData({ ...formData, media_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose..." />
                </SelectTrigger>
                <SelectContent>
                  {mediaList?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="order_index">Display Order</Label>
            <Input
              id="order_index"
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
              placeholder="0"
            />
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/casters")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : isEdit ? "Update Cast Member" : "Create Cast Member"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
