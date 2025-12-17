import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface CastMember {
  id?: string;
  actor_name: string;
  character_name: string;
  profile_url: string;
  order_index: number;
}

interface CastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  castMember: CastMember | null;
  onSave: (castMember: Omit<CastMember, 'id'>) => void;
}

export function CastDialog({ open, onOpenChange, castMember, onSave }: CastDialogProps) {
  const [formData, setFormData] = useState<Omit<CastMember, 'id'>>({
    actor_name: "",
    character_name: "",
    profile_url: "",
    order_index: 0,
  });

  useEffect(() => {
    if (castMember) {
      setFormData({
        actor_name: castMember.actor_name,
        character_name: castMember.character_name,
        profile_url: castMember.profile_url,
        order_index: castMember.order_index,
      });
    } else {
      setFormData({
        actor_name: "",
        character_name: "",
        profile_url: "",
        order_index: 0,
      });
    }
  }, [castMember, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{castMember ? "Edit Cast Member" : "Add Cast Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="actor_name">Actor Name</Label>
            <Input
              id="actor_name"
              value={formData.actor_name}
              onChange={(e) => setFormData({ ...formData, actor_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="character_name">Character Name</Label>
            <Input
              id="character_name"
              value={formData.character_name}
              onChange={(e) => setFormData({ ...formData, character_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile_url">Profile Photo URL</Label>
            <Input
              id="profile_url"
              value={formData.profile_url}
              onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              placeholder="https://image.tmdb.org/t/p/w500/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_index">Display Order</Label>
            <Input
              id="order_index"
              type="number"
              value={formData.order_index}
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
