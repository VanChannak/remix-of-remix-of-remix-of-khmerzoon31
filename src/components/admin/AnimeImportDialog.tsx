import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Download } from "lucide-react";

interface AnimeImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnimeImportDialog({ open, onOpenChange }: AnimeImportDialogProps) {
  const queryClient = useQueryClient();
  const [anilistIds, setAnilistIds] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validIds, setValidIds] = useState<number[]>([]);

  const parseIds = (input: string): number[] => {
    const ids = input
      .split(/[\s,]+/)
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id) && id > 0);
    return [...new Set(ids)];
  };

  const handleInputChange = (value: string) => {
    setAnilistIds(value);
    const parsed = parseIds(value);
    setValidIds(parsed);
  };

  const handleImport = async () => {
    if (validIds.length === 0) {
      toast.error("Please enter at least one valid AniList ID");
      return;
    }

    setIsImporting(true);
    setProgress(0);

    const results = {
      success: [] as string[],
      failed: [] as string[],
    };

    for (let i = 0; i < validIds.length; i++) {
      const id = validIds[i];
      
      try {
        // Fetch anime data from AniList
        const { data, error } = await supabase.functions.invoke("fetch-anilist-data", {
          body: { anilistId: id, type: "anime" },
        });

        if (error) throw error;

        const media = data.Media;
        if (!media) {
          throw new Error("Anime not found");
        }

        // Map AniList data to our schema
        const sourceMaterialMap: Record<string, string> = {
          'MANGA': 'manga',
          'LIGHT_NOVEL': 'light_novel',
          'VISUAL_NOVEL': 'visual_novel',
          'VIDEO_GAME': 'video_game',
          'OTHER': 'other',
          'ORIGINAL': 'original',
          'NOVEL': 'novel',
          'ONE_SHOT': 'one_shot',
          'DOUJINSHI': 'doujinshi',
          'ANIME': 'anime',
          'WEB_NOVEL': 'web_novel',
          'LIVE_ACTION': 'live_action',
          'GAME': 'game',
          'COMIC': 'comic',
          'MULTIMEDIA_PROJECT': 'multimedia_project',
          'PICTURE_BOOK': 'picture_book'
        };

        const animeData = {
          title: media.title.english || media.title.romaji,
          description: media.description ? media.description.replace(/<[^>]*>/g, "") : "",
          thumbnail: media.coverImage?.extraLarge || media.coverImage?.large || "",
          backdrop_url: media.bannerImage || "",
          trailer_url: media.trailer?.site === "youtube" ? `https://youtube.com/watch?v=${media.trailer.id}` : "",
          genre: media.genres?.join(", ") || "",
          studio: media.studios?.nodes?.[0]?.name || "",
          source_material: sourceMaterialMap[media.source] || 'other',
          type: media.format?.toLowerCase() || "tv",
          status: media.status === "RELEASING" || media.status === "FINISHED" ? "published" : "draft",
          release_year: media.seasonYear || null,
          episodes_count: media.episodes || 0,
          rating: media.averageScore ? media.averageScore / 10 : 0,
          anilist_id: media.id.toString(),
          access: "free",
        };

        // Insert into database
        const { error: insertError } = await supabase
          .from("animes")
          .insert([animeData]);

        if (insertError) throw insertError;

        results.success.push(animeData.title);
        console.log(`✅ Successfully imported: ${animeData.title} (ID: ${id})`);
      } catch (error) {
        results.failed.push(`ID ${id}: ${error instanceof Error ? error.message : "Unknown error"}`);
        console.error(`❌ Failed to import ID ${id}:`, error);
      }

      setProgress(((i + 1) / validIds.length) * 100);
    }

    // Show results
    if (results.success.length > 0) {
      toast.success(`Successfully imported ${results.success.length} anime(s)!`);
    }
    
    if (results.failed.length > 0) {
      toast.error(`Failed to import ${results.failed.length} anime(s). Check console for details.`);
      console.log("Failed imports:", results.failed);
    }

    queryClient.invalidateQueries({ queryKey: ["animes"] });
    setAnilistIds("");
    setValidIds([]);
    setIsImporting(false);
    setProgress(0);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleImport();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Import Anime from AniList</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anilist_ids">AniList IDs</Label>
            <Textarea
              id="anilist_ids"
              placeholder="Enter AniList IDs (comma or space separated)&#10;Example: 21, 1535, 5114"
              value={anilistIds}
              onChange={(e) => handleInputChange(e.target.value)}
              rows={4}
              disabled={isImporting}
            />
            <p className="text-xs text-muted-foreground">
              Find IDs in URLs: anilist.co/anime/<strong>21</strong>/one-piece
            </p>
            {validIds.length > 0 && (
              <p className="text-xs text-primary font-medium">
                {validIds.length} valid ID(s) found
              </p>
            )}
          </div>

          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing anime...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium">What gets imported:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Title, description, and images</li>
              <li>• Genre, studio, and source material</li>
              <li>• Episodes count and rating</li>
              <li>• Release year and trailer (if available)</li>
            </ul>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isImporting || validIds.length === 0}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import {validIds.length > 0 ? `(${validIds.length})` : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
