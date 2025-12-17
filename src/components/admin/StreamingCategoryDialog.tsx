import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StreamingCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: { name: string; count: number } | null;
}

export function StreamingCategoryDialog({ open, onOpenChange, category }: StreamingCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (category) {
      setCategoryName(category.name);
    } else {
      setCategoryName("");
    }
  }, [category, open]);

  const saveMutation = useMutation({
    mutationFn: async (newName: string) => {
      if (category) {
        // Update all channels with the old category name to the new name
        const { error } = await supabase
          .from("streaming_channels")
          .update({ category: newName })
          .eq("category", category.name);
        if (error) throw error;
      } else {
        // For new categories, we don't create a record, just validate the name
        // The category will be created when a channel is assigned to it
        return;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streaming_categories"] });
      queryClient.invalidateQueries({ queryKey: ["streaming_channels"] });
      toast.success(category ? "Category updated successfully" : "Category ready to use");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save category");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    saveMutation.mutate(categoryName.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Sports, News, Entertainment"
              />
            </div>
            {category && (
              <p className="text-sm text-muted-foreground">
                This will update {category.count} channel{category.count !== 1 ? 's' : ''} using this category.
              </p>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
