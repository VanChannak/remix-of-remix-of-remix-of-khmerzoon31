import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: any;
}

export function LanguageDialog({ open, onOpenChange, language }: LanguageDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    iso_639_1: "",
    english_name: "",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (language) {
      setFormData({
        name: language.name || "",
        iso_639_1: language.iso_639_1 || "",
        english_name: language.english_name || "",
      });
    } else {
      setFormData({ name: "", iso_639_1: "", english_name: "" });
    }
  }, [language, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (language) {
        const { error } = await supabase
          .from("languages")
          .update(data)
          .eq("id", language.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("languages")
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages"] });
      toast.success(language ? "Language updated" : "Language created");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save language");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.iso_639_1.trim()) {
      toast.error("Name and ISO code are required");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{language ? "Edit Language" : "Add Language"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Native Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Native language name"
            />
          </div>
          <div>
            <Label htmlFor="english_name">English Name</Label>
            <Input
              id="english_name"
              value={formData.english_name}
              onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
              placeholder="English language name"
            />
          </div>
          <div>
            <Label htmlFor="iso_639_1">ISO 639-1 Code *</Label>
            <Input
              id="iso_639_1"
              value={formData.iso_639_1}
              onChange={(e) => setFormData({ ...formData, iso_639_1: e.target.value.toLowerCase() })}
              placeholder="e.g., en, es, fr"
              maxLength={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : language ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
