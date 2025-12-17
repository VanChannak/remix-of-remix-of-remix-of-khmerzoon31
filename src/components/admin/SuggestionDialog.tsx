import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface SuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: any;
}

export function SuggestionDialog({ open, onOpenChange, suggestion }: SuggestionDialogProps) {
  const [formData, setFormData] = useState({
    status: "",
    priority: "",
    admin_notes: "",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (suggestion) {
      setFormData({
        status: suggestion.status || "pending",
        priority: suggestion.priority || "medium",
        admin_notes: suggestion.admin_notes || "",
      });
    }
  }, [suggestion, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("suggestions")
        .update(data)
        .eq("id", suggestion.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Suggestion updated");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update suggestion");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (!suggestion) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Suggestion Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Submitted By</Label>
              <span className="text-sm font-medium">{(suggestion.profiles as any)?.email || "Unknown"}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Date</Label>
              <span className="text-sm">{format(new Date(suggestion.created_at), "MMM dd, yyyy HH:mm")}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Type</Label>
              <Badge className="capitalize">{suggestion.type.replace('_', ' ')}</Badge>
            </div>
          </div>

          <div>
            <Label>Title</Label>
            <div className="p-3 bg-muted rounded-md mt-2">
              <p className="font-medium">{suggestion.title}</p>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <div className="p-3 bg-muted rounded-md mt-2 max-h-48 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{suggestion.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="admin_notes">Admin Notes</Label>
            <Textarea
              id="admin_notes"
              value={formData.admin_notes}
              onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
              placeholder="Internal notes about this suggestion..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
