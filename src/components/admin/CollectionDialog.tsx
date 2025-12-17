import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: any;
}

export function CollectionDialog({ open, onOpenChange, collection }: CollectionDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    poster_url: "",
    backdrop_url: "",
    tmdb_id: "",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name || "",
        description: collection.description || "",
        poster_url: collection.poster_url || "",
        backdrop_url: collection.backdrop_url || "",
        tmdb_id: collection.tmdb_id || "",
      });
    } else {
      setFormData({ name: "", description: "", poster_url: "", backdrop_url: "", tmdb_id: "" });
    }
  }, [collection, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        tmdb_id: data.tmdb_id ? parseInt(data.tmdb_id) : null,
      };
      
      if (collection) {
        const { error } = await supabase
          .from("collections")
          .update(payload)
          .eq("id", collection.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("collections")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success(collection ? "Collection updated" : "Collection created");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save collection");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Collection name is required");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{collection ? "Edit Collection" : "Add Collection"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Collection name"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Collection description"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="poster_url">Poster URL</Label>
              <Input
                id="poster_url"
                value={formData.poster_url}
                onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="backdrop_url">Backdrop URL</Label>
              <Input
                id="backdrop_url"
                value={formData.backdrop_url}
                onChange={(e) => setFormData({ ...formData, backdrop_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <div>
            <Label htmlFor="tmdb_id">TMDB ID</Label>
            <Input
              id="tmdb_id"
              type="number"
              value={formData.tmdb_id}
              onChange={(e) => setFormData({ ...formData, tmdb_id: e.target.value })}
              placeholder="TMDB collection ID"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : collection ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
