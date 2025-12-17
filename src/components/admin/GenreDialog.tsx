import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genre: any;
}

export function GenreDialog({ open, onOpenChange, genre }: GenreDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    tmdb_id: "",
    description: "",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (genre) {
      setFormData({
        name: genre.name || "",
        tmdb_id: genre.tmdb_id || "",
        description: genre.description || "",
      });
    } else {
      setFormData({ name: "", tmdb_id: "", description: "" });
    }
  }, [genre, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (genre) {
        const { error } = await supabase
          .from("genres")
          .update({ ...data, tmdb_id: data.tmdb_id ? parseInt(data.tmdb_id) : null })
          .eq("id", genre.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("genres")
          .insert([{ ...data, tmdb_id: data.tmdb_id ? parseInt(data.tmdb_id) : null }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
      toast.success(genre ? "Genre updated" : "Genre created");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save genre");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Genre name is required");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{genre ? "Edit Genre" : "Add Genre"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Genre name"
            />
          </div>
          <div>
            <Label htmlFor="tmdb_id">TMDB ID</Label>
            <Input
              id="tmdb_id"
              type="number"
              value={formData.tmdb_id}
              onChange={(e) => setFormData({ ...formData, tmdb_id: e.target.value })}
              placeholder="TMDB genre ID"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Genre description"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : genre ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
