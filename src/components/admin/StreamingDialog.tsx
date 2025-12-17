import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StreamingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: any;
}

export function StreamingDialog({ open, onOpenChange, channel }: StreamingDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    thumbnail_url: "",
    stream_url: "",
    category: "",
    is_active: true,
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (channel) {
      setFormData({
        name: channel.name || "",
        description: channel.description || "",
        thumbnail_url: channel.thumbnail_url || "",
        stream_url: channel.stream_url || "",
        category: channel.category || "",
        is_active: channel.is_active ?? true,
      });
    } else {
      setFormData({ name: "", description: "", thumbnail_url: "", stream_url: "", category: "", is_active: true });
    }
  }, [channel, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (channel) {
        const { error } = await supabase
          .from("streaming_channels")
          .update(data)
          .eq("id", channel.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("streaming_channels")
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streaming_channels"] });
      toast.success(channel ? "Channel updated" : "Channel created");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save channel");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.stream_url.trim()) {
      toast.error("Name and stream URL are required");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{channel ? "Edit Channel" : "Add Channel"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Channel Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Channel name"
            />
          </div>
          <div>
            <Label htmlFor="stream_url">Stream URL *</Label>
            <Input
              id="stream_url"
              value={formData.stream_url}
              onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Channel description"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Sports, News, Entertainment..."
              />
            </div>
            <div>
              <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : channel ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
