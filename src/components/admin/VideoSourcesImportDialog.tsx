import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoSourcesImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoSourcesImportDialog({ open, onOpenChange }: VideoSourcesImportDialogProps) {
  const [csvData, setCsvData] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvData(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    
    return result.map(field => field.trim());
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error("Please paste or upload CSV data");
      return;
    }

    setImporting(true);
    
    try {
      const lines = csvData.split('\n').filter(line => line.trim());
      const headers = parseCsvLine(lines[0]);
      
      // Verify required columns exist
      const requiredCols = ['episode_id', 'source_type', 'server_name'];
      const missingCols = requiredCols.filter(col => !headers.includes(col));
      
      if (missingCols.length > 0) {
        toast.error(`Missing required columns: ${missingCols.join(', ')}`);
        setImporting(false);
        return;
      }

      const dataRows = lines.slice(1);
      setProgress({ current: 0, total: dataRows.length });

      const batchSize = 100;
      let imported = 0;
      
      for (let i = 0; i < dataRows.length; i += batchSize) {
        const batch = dataRows.slice(i, i + batchSize);
        
        const records = batch.map(line => {
          const values = parseCsvLine(line);
          const row: any = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || null;
          });

          // Parse JSON fields
          if (row.quality_urls) {
            try {
              row.quality_urls = JSON.parse(row.quality_urls);
            } catch {
              row.quality_urls = {};
            }
          }

          // Convert booleans
          if (row.is_default) {
            row.is_default = row.is_default === 'true' || row.is_default === 't';
          }

          return {
            media_id: row.media_id || null,
            episode_id: row.episode_id || null,
            source_type: row.source_type || 'mp4',
            url: row.url || null,
            quality: row.quality || null,
            is_default: row.is_default || false,
            language: row.language || null,
            version: row.version || 'free',
            quality_urls: row.quality_urls || {},
            permission: row.permission || 'web_and_mobile',
            server_name: row.server_name || 'Unknown',
          };
        });

        const { error } = await supabase
          .from("video_sources")
          .upsert(records, { onConflict: 'id' });

        if (error) throw error;
        
        imported += records.length;
        setProgress({ current: imported, total: dataRows.length });
      }

      toast.success(`Successfully imported ${imported} video sources!`);
      onOpenChange(false);
      setCsvData("");
      setProgress({ current: 0, total: 0 });
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Video Sources from CSV</DialogTitle>
          <DialogDescription>
            Upload or paste CSV data to bulk import video sources. The CSV should include columns:
            episode_id, media_id, source_type, url, server_name, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Required columns:</strong> episode_id (or media_id), source_type, server_name
              <br />
              <strong>Optional:</strong> url, quality, quality_urls (JSON), is_default, version, permission, language
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={importing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-data">Or Paste CSV Data</Label>
            <Textarea
              id="csv-data"
              placeholder="Paste your CSV data here..."
              rows={12}
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              disabled={importing}
              className="font-mono text-xs"
            />
          </div>

          {importing && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Importing...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={importing || !csvData.trim()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? `Importing... (${progress.current}/${progress.total})` : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}
