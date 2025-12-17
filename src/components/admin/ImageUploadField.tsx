import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useIDriveUpload } from '@/hooks/useIDriveUpload';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucketPath?: string;
  accept?: string;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  bucketPath = 'media',
  accept = 'image/*',
}: ImageUploadFieldProps) {
  const [preview, setPreview] = useState<string>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, uploading, progress } = useIDriveUpload();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to iDriveE2
    const result = await uploadFile(file, {
      bucket: 'media-files',
      path: bucketPath,
      category: 'general',
    });

    if (result.success && result.path) {
      onChange(result.path); // Store path instead of URL
      setPreview(reader.result as string); // Keep local preview
    } else {
      // Reset preview on failure
      setPreview(value);
    }
  };

  const handleClear = () => {
    onChange('');
    setPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    setPreview(url);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Preview */}
      {preview && (
        <div className="relative aspect-video w-full max-w-xs rounded-lg overflow-hidden border bg-muted">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-full object-cover"
            onError={() => setPreview('')}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">Uploading... {Math.round(progress)}%</p>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload to iDriveE2
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Manual URL Input */}
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Or paste image URL..."
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          disabled={uploading}
        />
      </div>
    </div>
  );
}
