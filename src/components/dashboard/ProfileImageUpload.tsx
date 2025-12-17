import { useState, useRef } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ImageCropper } from "./ImageCropper";
import { useIDriveUpload } from "@/hooks/useIDriveUpload";
import { useImageCompression } from "@/hooks/useImageCompression";

interface ProfileImageUploadProps {
  type: "profile" | "cover";
  currentImage?: string;
  onUploadSuccess: (url: string) => void;
  children: React.ReactNode;
}

export const ProfileImageUpload = ({ type, currentImage, onUploadSuccess, children }: ProfileImageUploadProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [showCropper, setShowCropper] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { uploadFile, uploading } = useIDriveUpload();
  const { compressImage, compressing, validateImageSize, validateImageType } = useImageCompression();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!validateImageType(file)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, or WebP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB before compression)
    if (!validateImageSize(file, 10)) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      // Compress image before processing
      const compressedFile = await compressImage(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: type === "cover" ? 1920 : 800,
        quality: 0.85,
      });

      setSelectedFile(compressedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setShowDialog(true);
        setShowCropper(true);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Compression error:', error);
      toast({
        title: "Error processing image",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCropComplete = async (croppedArea: any) => {
    setCroppedAreaPixels(croppedArea);
    setShowCropper(false);
  };

  // Delete old file from storage before uploading new one
  const deleteOldFile = async (oldImagePath: string) => {
    if (!user || !oldImagePath) return;

    try {
      // Check if it's a Supabase storage URL
      if (oldImagePath.includes('supabase.co/storage')) {
        // Extract the path from the Supabase URL
        const urlParts = oldImagePath.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const pathParts = urlParts[1].split('/');
          const bucket = pathParts[0];
          const filePath = pathParts.slice(1).join('/');
          
          const { error } = await supabase.storage.from(bucket).remove([filePath]);
          if (error) {
            console.warn('Failed to delete from Supabase storage:', error);
          } else {
            console.log('Deleted from Supabase storage:', filePath);
          }
        }
        return;
      }

      // Extract file path from URL if it's an iDrive URL
      let filePath = oldImagePath;
      if (oldImagePath.includes('idrivee2.com')) {
        const urlObj = new URL(oldImagePath.split('?')[0]); // Remove query params
        filePath = urlObj.pathname.replace(/^\//, '');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch(
        'https://zmdqloustkrtaeumkrau.supabase.co/functions/v1/delete-media-file',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filePath }),
        }
      );
      console.log('Old file deleted:', filePath);
    } catch (error) {
      console.warn('Failed to delete old file:', error);
      // Don't throw - continue with upload even if delete fails
    }
  };

  const handleRemoveImage = async () => {
    if (!user || !currentImage) return;

    setIsDeleting(true);
    try {
      // Delete the file from storage
      await deleteOldFile(currentImage);

      // Update database to remove the image URL
      const updateField = type === "profile" ? "profile_picture_url" : "cover_picture_url";
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onUploadSuccess('');
      
      toast({
        title: "Success",
        description: `${type === "profile" ? "Profile" : "Cover"} photo removed`,
      });
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: "Remove failed",
        description: error instanceof Error ? error.message : "Failed to remove image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpload = async () => {
    if (!user || !preview) return;

    try {
      let fileToUpload: Blob;
      
      if (croppedAreaPixels) {
        fileToUpload = await getCroppedImg(preview, croppedAreaPixels);
      } else {
        if (!selectedFile) return;
        fileToUpload = selectedFile;
      }

      // Delete old file first if exists
      if (currentImage) {
        await deleteOldFile(currentImage);
      }

      // Convert Blob to File
      const file = new File([fileToUpload], `${type}-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Upload to iDrive E2
      const result = await uploadFile(file, {
        bucket: 'media-files',
        path: `profile-images/${user.id}`,
        category: type === 'profile' ? 'profile_picture' : 'cover_picture',
      });

      if (!result.success || !result.path) {
        throw new Error(result.error || 'Upload failed');
      }

      // Store only the file PATH in database (not the signed URL)
      const updateField = type === "profile" ? "profile_picture_url" : "cover_picture_url";
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: result.path })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onUploadSuccess(result.path);
      setShowDialog(false);
      setSelectedFile(null);
      setPreview("");
      setCroppedAreaPixels(null);
      setShowCropper(false);

      toast({
        title: "Success",
        description: `${type === "profile" ? "Profile" : "Cover"} photo updated successfully`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="cursor-pointer group relative">
        <div onClick={() => fileInputRef.current?.click()}>
          {children}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
            <Camera className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* Delete button - only show if there's an image */}
        {currentImage && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className={`absolute ${type === 'profile' ? 'bottom-0 right-0' : 'bottom-4 right-4'} z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity`}
                onClick={(e) => e.stopPropagation()}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {type === "profile" ? "Profile" : "Cover"} Photo</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove your {type === "profile" ? "profile" : "cover"} photo? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveImage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload {type === "profile" ? "Profile" : "Cover"} Photo</DialogTitle>
          </DialogHeader>
          
          {preview && (
            <div className="space-y-4">
              {showCropper ? (
                <ImageCropper
                  image={preview}
                  onCropComplete={handleCropComplete}
                  onCancel={() => {
                    setShowDialog(false);
                    setShowCropper(false);
                    setPreview("");
                    setSelectedFile(null);
                  }}
                  aspect={type === "profile" ? 1 : 16 / 9}
                />
              ) : (
                <>
                  <div className="relative w-full h-64 bg-muted rounded overflow-hidden">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCropper(true)}
                      disabled={uploading}
                    >
                      Adjust Crop
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowDialog(false);
                        setPreview("");
                        setSelectedFile(null);
                        setCroppedAreaPixels(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading || compressing}>
                      {uploading ? "Uploading..." : compressing ? "Compressing..." : "Upload"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
