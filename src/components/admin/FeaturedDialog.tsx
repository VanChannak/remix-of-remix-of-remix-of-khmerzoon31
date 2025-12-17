import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface FeaturedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: {
    id: string;
    media_id: string;
    media_type: string;
    display_order: number;
  } | null;
}

export function FeaturedDialog({ open, onOpenChange, item }: FeaturedDialogProps) {
  const [mediaType, setMediaType] = useState(item?.media_type || "movie");
  const [selectedMediaId, setSelectedMediaId] = useState(item?.media_id || "");
  const [displayOrder, setDisplayOrder] = useState(item?.display_order?.toString() || "0");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (item) {
      setMediaType(item.media_type);
      setSelectedMediaId(item.media_id);
      setDisplayOrder(item.display_order.toString());
    } else {
      setMediaType("movie");
      setSelectedMediaId("");
      setDisplayOrder("0");
    }
  }, [item, open]);

  const { data: mediaItems } = useQuery({
    queryKey: ["media-items", mediaType],
    queryFn: async () => {
      const table = mediaType === "anime" ? "animes" : mediaType === "series" ? "series" : "movies";
      const { data, error } = await supabase
        .from(table)
        .select("id, title")
        .order("title");
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        media_id: selectedMediaId,
        media_type: mediaType,
        display_order: parseInt(displayOrder),
      };

      if (item) {
        const { error } = await supabase
          .from("featured_content")
          .update(data)
          .eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("featured_content")
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-content"] });
      toast.success(item ? "Featured item updated successfully! ✨" : "Featured item added successfully! ✨");
      
      // Smooth close with slight delay for better UX
      setTimeout(() => {
        onOpenChange(false);
        // Reset form
        setMediaType("movie");
        setSelectedMediaId("");
        setDisplayOrder("0");
      }, 300);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save featured item");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMediaId) {
      toast.error("Please select a media item");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Featured Item" : "Add Featured Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="media-type">Media Type</Label>
            <Select value={mediaType} onValueChange={setMediaType}>
              <SelectTrigger id="media-type">
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
            <Label htmlFor="media">Select {mediaType}</Label>
            <Select value={selectedMediaId} onValueChange={setSelectedMediaId}>
              <SelectTrigger id="media">
                <SelectValue placeholder={`Select a ${mediaType}`} />
              </SelectTrigger>
              <SelectContent>
                {mediaItems?.map((media) => (
                  <SelectItem key={media.id} value={media.id}>
                    {media.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              min="0"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saveMutation.isPending || !selectedMediaId}
              className="min-w-[100px]"
            >
              {saveMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⚙️</span>
                  Saving...
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
