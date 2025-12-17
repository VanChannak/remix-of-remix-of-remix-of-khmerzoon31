import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NetworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: any;
}

export function NetworkDialog({ open, onOpenChange, network }: NetworkDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    origin_country: "",
    tmdb_id: "",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (network) {
      setFormData({
        name: network.name || "",
        logo_url: network.logo_url || "",
        origin_country: network.origin_country || "",
        tmdb_id: network.tmdb_id || "",
      });
    } else {
      setFormData({ name: "", logo_url: "", origin_country: "", tmdb_id: "" });
    }
  }, [network, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        tmdb_id: data.tmdb_id ? parseInt(data.tmdb_id) : null,
      };
      
      if (network) {
        const { error } = await supabase
          .from("networks")
          .update(payload)
          .eq("id", network.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("networks")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networks"] });
      toast.success(network ? "Network updated" : "Network created");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save network");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Network name is required");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{network ? "Edit Network" : "Add Network"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Network name"
            />
          </div>
          <div>
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label htmlFor="origin_country">Origin Country</Label>
            <Input
              id="origin_country"
              value={formData.origin_country}
              onChange={(e) => setFormData({ ...formData, origin_country: e.target.value.toUpperCase() })}
              placeholder="US, UK, JP, etc."
              maxLength={2}
            />
          </div>
          <div>
            <Label htmlFor="tmdb_id">TMDB ID</Label>
            <Input
              id="tmdb_id"
              type="number"
              value={formData.tmdb_id}
              onChange={(e) => setFormData({ ...formData, tmdb_id: e.target.value })}
              placeholder="TMDB network ID"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : network ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
