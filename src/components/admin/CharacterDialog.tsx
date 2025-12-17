import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Download } from "lucide-react";

interface Character {
  id?: string;
  anime_id: string;
  name: string;
  name_native: string;
  description: string;
  image_url: string;
  role: string;
  age: string;
  gender: string;
  birth_date: string;
  anilist_id: number | null;
  mal_id: number | null;
}

interface CharacterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character | null;
  animeId: string;
}

export function CharacterDialog({ open, onOpenChange, character, animeId }: CharacterDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!character?.id;
  const [isLoadingAniList, setIsLoadingAniList] = useState(false);

  const [formData, setFormData] = useState<Character>({
    anime_id: animeId,
    name: "",
    name_native: "",
    description: "",
    image_url: "",
    role: "supporting",
    age: "",
    gender: "",
    birth_date: "",
    anilist_id: null,
    mal_id: null,
  });

  useEffect(() => {
    if (character) {
      setFormData(character);
    } else {
      setFormData({
        anime_id: animeId,
        name: "",
        name_native: "",
        description: "",
        image_url: "",
        role: "supporting",
        age: "",
        gender: "",
        birth_date: "",
        anilist_id: null,
        mal_id: null,
      });
    }
  }, [character, animeId, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEditing) {
        const { error } = await supabase
          .from("anime_characters")
          .update(formData)
          .eq("id", character.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("anime_characters")
          .insert([formData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Character updated!" : "Character added!");
      queryClient.invalidateQueries({ queryKey: ["anime_characters", animeId] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to save character: " + error.message);
    },
  });

  const fetchFromAniList = async () => {
    if (!formData.anilist_id) {
      toast.error("Please enter an AniList ID first");
      return;
    }

    setIsLoadingAniList(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-anilist-data", {
        body: { anilistId: formData.anilist_id, type: "character" },
      });

      if (error) throw error;

      const char = data.Character;
      if (char) {
        setFormData(prev => ({
          ...prev,
          name: char.name.full || prev.name,
          name_native: char.name.native || prev.name_native,
          description: char.description ? char.description.replace(/<[^>]*>/g, "") : prev.description,
          image_url: char.image?.large || prev.image_url,
          age: char.age?.toString() || prev.age,
          gender: char.gender || prev.gender,
          birth_date: char.dateOfBirth ? 
            `${char.dateOfBirth.year || ""}${char.dateOfBirth.month ? `-${char.dateOfBirth.month.toString().padStart(2, "0")}` : ""}${char.dateOfBirth.day ? `-${char.dateOfBirth.day.toString().padStart(2, "0")}` : ""}` 
            : prev.birth_date,
        }));
        toast.success("Character data loaded from AniList!");
      }
    } catch (error: any) {
      toast.error("Failed to fetch from AniList: " + error.message);
    } finally {
      setIsLoadingAniList(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Character name is required");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} Character</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AniList Integration */}
          <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
            <Label>Auto-fill from AniList</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter AniList Character ID"
                value={formData.anilist_id || ""}
                onChange={(e) => setFormData({ ...formData, anilist_id: parseInt(e.target.value) || null })}
              />
              <Button
                type="button"
                onClick={fetchFromAniList}
                disabled={isLoadingAniList || !formData.anilist_id}
              >
                {isLoadingAniList ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_native">Native Name</Label>
              <Input
                id="name_native"
                value={formData.name_native}
                onChange={(e) => setFormData({ ...formData, name_native: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main</SelectItem>
                  <SelectItem value="supporting">Supporting</SelectItem>
                  <SelectItem value="background">Background</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                placeholder="Male, Female, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="16, Unknown, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Character Image URL</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
            {formData.image_url && (
              <img 
                src={formData.image_url} 
                alt="Character preview" 
                className="w-32 h-40 object-cover rounded-lg border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Birth Date</Label>
              <Input
                id="birth_date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                placeholder="YYYY-MM-DD or just month/day"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mal_id">MyAnimeList ID</Label>
              <Input
                id="mal_id"
                type="number"
                value={formData.mal_id || ""}
                onChange={(e) => setFormData({ ...formData, mal_id: parseInt(e.target.value) || null })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : isEditing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
