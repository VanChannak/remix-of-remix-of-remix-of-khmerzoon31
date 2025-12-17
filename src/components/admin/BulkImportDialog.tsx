import { useState } from "react";
import { Radio } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: 'movie' | 'series';
}

export function BulkImportDialog({ open, onOpenChange, type = 'series' }: BulkImportDialogProps) {
  const [tmdbIds, setTmdbIds] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [validIds, setValidIds] = useState<number[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const queryClient = useQueryClient();

  const parseIds = (input: string): number[] => {
    // Split by commas, spaces, line breaks
    const ids = input
      .split(/[\s,\n]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0)
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id) && id > 0);
    
    return [...new Set(ids)]; // Remove duplicates
  };

  const handleInputChange = (value: string) => {
    setTmdbIds(value);
    const ids = parseIds(value);
    setValidIds(ids);
  };

  const handleImport = async () => {
    if (validIds.length === 0) {
      toast.error("Please enter valid TMDB IDs");
      return;
    }

    setIsImporting(true);
    setProgress({ current: 0, total: validIds.length, percentage: 0 });

    const successfulImports: number[] = [];
    const failedImports: Array<{ id: number; error: string }> = [];

    try {
      const functionName = type === 'movie' ? 'import-tmdb-movies' : 'import-tmdb-series';
      
      // Process IDs one by one to track progress
      for (let i = 0; i < validIds.length; i++) {
        const id = validIds[i];
        
        try {
          const { data, error } = await supabase.functions.invoke(functionName, {
            body: { tmdbIds: [id] },
          });

          if (error) throw error;

          if (data?.results?.success?.length > 0) {
            successfulImports.push(id);
          } else if (data?.results?.failed?.length > 0) {
            failedImports.push({ id, error: data.results.failed[0].error });
          }
        } catch (error) {
          failedImports.push({ 
            id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }

        // Update progress
        const current = i + 1;
        const percentage = Math.round((current / validIds.length) * 100);
        setProgress({ current, total: validIds.length, percentage });
      }

      // Show results
      if (successfulImports.length > 0) {
        const contentType = type === 'movie' ? 'movies' : 'TV series';
        toast.success(`Successfully imported ${successfulImports.length} ${contentType}!`);
        queryClient.invalidateQueries({ queryKey: ["media"] });
        queryClient.invalidateQueries({ queryKey: ["movies"] });
        queryClient.invalidateQueries({ queryKey: ["series"] });
      }

      if (failedImports.length > 0) {
        const contentType = type === 'movie' ? 'movies' : 'series';
        toast.error(`Failed to import ${failedImports.length} ${contentType}. Check console for details.`);
        console.error('Failed imports:', failedImports);
      }

      if (successfulImports.length > 0) {
        onOpenChange(false);
        setTmdbIds("");
        setValidIds([]);
        setProgress({ current: 0, total: 0, percentage: 0 });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error("Failed to import: " + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {type === 'movie' ? 'Bulk Import Movies' : 'Bulk Import TV Shows'}
          </DialogTitle>
          <DialogDescription>
            {type === 'movie' 
              ? 'Import multiple movies at once by searching or entering TMDB IDs.'
              : 'Import multiple TV shows at once by searching or entering TMDB IDs. All seasons and episodes will be automatically imported.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" disabled>
              <Radio className="h-4 w-4 mr-2" />
              Search & Select
            </Button>
            <Button className="flex-1">
              <Radio className="h-4 w-4 mr-2" />
              Import by IDs
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Enter TMDB {type === 'movie' ? 'movie' : 'TV show'} IDs separated by commas, spaces, or line breaks.
            </p>
            <Textarea
              placeholder="e.g., 1399, 66732, 1402, 84958"
              value={tmdbIds}
              onChange={(e) => handleInputChange(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Example formats:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>1399, 66732, 1402</li>
                <li>1399 66732 1402</li>
                <li>One ID per line</li>
              </ul>
            </div>
            <p className="text-sm font-medium">
              {validIds.length} valid ID{validIds.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {isImporting && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Importing {progress.current} of {progress.total}...
                </span>
                <span className="font-semibold">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={validIds.length === 0 || isImporting}
            >
              {isImporting ? 'Importing...' : `Import ${type === 'movie' ? 'Movies' : 'TV Shows'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
