import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useImageCompression } from './useImageCompression';

interface UploadOptions {
  bucket?: string;
  path?: string;
  category?: string; // 'profile_picture', 'cover_picture', 'general'
  maxRetries?: number;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  bucket?: string;
  size?: number;
  contentType?: string;
  storageAccount?: number;
  accessKeyIndex?: number;
  isPrivate?: boolean;
  error?: string;
}

export const useIDriveUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const { compressImage, validateImageSize, validateImageType, compressing } = useImageCompression();

  const uploadWithRetry = async (
    file: File,
    options: UploadOptions,
    attempt: number = 1
  ): Promise<UploadResult> => {
    const maxRetries = options.maxRetries || 3;
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (options.bucket) formData.append('bucket', options.bucket);
      if (options.path) formData.append('path', options.path);
      if (options.category) formData.append('category', options.category);

      console.log(`Upload attempt ${attempt}/${maxRetries} for:`, file.name);

      // Simulate progress during upload
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          const next = Math.min(prev + 10, 90);
          options.onProgress?.(next);
          return next;
        });
      }, 200);

      // Get the session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      // Use fetch directly to send FormData
      const response = await fetch(
        `https://zmdqloustkrtaeumkrau.supabase.co/functions/v1/upload-to-idrivee2`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: formData,
        }
      );

      if (progressInterval) clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(100);
      options.onProgress?.(100);
      console.log('Upload successful:', data);
      console.log('Storage account used:', data.storageAccount);

      return data as UploadResult;
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      
      const errorMessage = error instanceof Error ? error.message : '';
      const isBucketError = /bucket/i.test(errorMessage);
      
      // Don't retry on authentication/credential errors - just throw
      if (
        errorMessage.includes('Access Key') || 
        errorMessage.includes('credentials') || 
        errorMessage.includes('Unauthorized')
      ) {
        console.error(`Upload attempt ${attempt} failed:`, error);
        throw error;
      }
      
      // For bucket errors, throw immediately to trigger fallback (no retries needed, no error log)
      if (isBucketError) {
        throw error;
      }
      
      // Log other errors
      console.error(`Upload attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying in ${delay}ms...`);
        toast.info(`Upload failed, retrying... (${attempt}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return uploadWithRetry(file, options, attempt + 1);
      }
      
      throw error;
    }
  };

  const uploadFile = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);
    setCurrentFile(file.name);

    // We'll keep a reference to the file we actually upload (compressed or original)
    let fileToUpload: File = file;

    // Helper: temporary fallback to Supabase Storage when iDrive E2 bucket is missing
    const uploadToSupabaseStorage = async (fallbackFile: File, uploadOpts: UploadOptions): Promise<UploadResult> => {
      try {
        const bucketName = 'profile-images';
        // Build a clean folder path: strip any leading 'profile-images/' passed from callers
        let folder = (uploadOpts.path || '').replace(/^profile-images\//, '').replace(/^\/+/, '').replace(/\/+$/, '');
        const ext = (fallbackFile.name.split('.').pop() || 'jpg').toLowerCase();
        const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
        const key = folder ? `${folder}/${filename}` : filename;

        const { error: upErr } = await supabase.storage
          .from(bucketName)
          .upload(key, fallbackFile, { contentType: fallbackFile.type, upsert: true });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from(bucketName).getPublicUrl(key);
        const publicUrl = pub.publicUrl;

        toast.success('Uploaded via fallback storage');
        return {
          success: true,
          path: publicUrl,
          url: publicUrl,
          bucket: bucketName,
          size: fallbackFile.size,
          contentType: fallbackFile.type,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Fallback upload failed';
        toast.error(msg);
        return { success: false, error: msg };
      }
    };

    try {
      // Validate file type
      if (!validateImageType(file)) {
        throw new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.');
      }

      // Validate file size (max 10MB before compression)
      if (!validateImageSize(file, 10)) {
        throw new Error('File size exceeds 10MB limit.');
      }

      // Compress image if it's larger than 2MB
      if (file.size / 1024 / 1024 > 2) {
        toast.info('Compressing image...');
        fileToUpload = await compressImage(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          quality: 0.85,
        });
        console.log(`Compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
      }

      console.log('Starting upload to iDriveE2:', fileToUpload.name);

      const result = await uploadWithRetry(fileToUpload, options);

      // For private buckets, fetch a signed URL for immediate display
      if (result.success && result.isPrivate && result.path) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const signedResponse = await fetch(
            `https://zmdqloustkrtaeumkrau.supabase.co/functions/v1/get-signed-url`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.access_token || ''}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ filePath: result.path, expiryHours: 24 }),
            }
          );
          
          if (signedResponse.ok) {
            const signedData = await signedResponse.json();
            if (signedData.success && signedData.url) {
              result.url = signedData.url;
            }
          }
        } catch (signedError) {
          console.warn('Failed to get signed URL:', signedError);
          // Not critical - the path is still stored
        }
      }

      toast.success('File uploaded successfully');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      // If iDrive bucket is missing, transparently fallback to Supabase Storage
      const bucketMissing = /bucket.*does not exist/i.test(errorMessage) || 
                           /specified bucket does not exist/i.test(errorMessage) || 
                           /Bucket\s*"?media-files"?/i.test(errorMessage);
      if (bucketMissing) {
        console.log('iDrive E2 bucket not configured. Using Supabase Storage...');
        const fallbackResult = await uploadToSupabaseStorage(fileToUpload, options);
        if (fallbackResult.success) {
          return fallbackResult;
        }
      }
      
      // Only log as error if fallback didn't work
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setUploading(false);
      setProgress(0);
      setCurrentFile('');
    }
  }, []);

  const uploadMultiple = useCallback(async (
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const result = await uploadFile(files[i], {
        ...options,
        onProgress: (fileProgress) => {
          const totalProgress = ((i + (fileProgress / 100)) / files.length) * 100;
          setProgress(totalProgress);
        }
      });
      results.push(result);
    }
    
    return results;
  }, [uploadFile]);

  return {
    uploadFile,
    uploadMultiple,
    uploading: uploading || compressing,
    progress,
    currentFile,
  };
};
