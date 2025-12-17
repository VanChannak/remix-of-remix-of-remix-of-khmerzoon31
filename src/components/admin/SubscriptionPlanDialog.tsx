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

interface SubscriptionPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: any;
}

export function SubscriptionPlanDialog({ open, onOpenChange, plan }: SubscriptionPlanDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_days: "",
    features: "",
    max_devices: "",
    is_active: true,
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || "",
        description: plan.description || "",
        price: plan.price?.toString() || "",
        duration_days: plan.duration_days?.toString() || "",
        features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
        max_devices: plan.max_devices?.toString() || "2",
        is_active: plan.is_active ?? true,
      });
    } else {
      setFormData({ name: "", description: "", price: "", duration_days: "", features: "", max_devices: "2", is_active: true });
    }
  }, [plan, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        duration_days: parseInt(data.duration_days),
        features: data.features.split("\n").filter(f => f.trim()),
        max_devices: parseInt(data.max_devices) || 2,
        is_active: data.is_active,
      };
      
      if (plan) {
        const { error } = await supabase
          .from("subscription_plans")
          .update(payload)
          .eq("id", plan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("subscription_plans")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription_plans"] });
      toast.success(plan ? "Plan updated" : "Plan created");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save plan");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.duration_days || !formData.max_devices) {
      toast.error("Name, price, duration, and max devices are required");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Plan" : "Add Plan"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Plan Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Basic, Premium, VIP..."
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Plan description"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="9.99"
              />
            </div>
            <div>
              <Label htmlFor="duration_days">Duration (Days) *</Label>
              <Input
                id="duration_days"
                type="number"
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                placeholder="30"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="features">Features (one per line)</Label>
            <Textarea
              id="features"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              placeholder="Unlimited streaming&#10;4K quality&#10;No ads"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="max_devices">Max Devices *</Label>
            <Input
              id="max_devices"
              type="number"
              min="1"
              max="10"
              value={formData.max_devices}
              onChange={(e) => setFormData({ ...formData, max_devices: e.target.value })}
              placeholder="2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum number of devices that can stream simultaneously
            </p>
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
              {saveMutation.isPending ? "Saving..." : plan ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
