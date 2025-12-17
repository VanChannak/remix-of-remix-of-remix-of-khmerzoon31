import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MediaFile {
  id: string;
  filePath: string;
  bucket: string;
  storageAccount: number;
  fileSize: number;
  contentType: string;
  fileCategory: string;
  createdAt: string;
}

export const useMediaFile = () => {
  const [loading, setLoading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const getSignedUrl = useCallback(async (
    filePath: string,
    expiryHours: number = 24
  ): Promise<string | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-signed-url', {
        body: { filePath, expiryHours },
      });

      if (error) throw error;

      if (data.success && data.url) {
        setSignedUrl(data.url);
        return data.url;
      }

      throw new Error('Failed to get signed URL');
    } catch (error) {
      console.error('Error getting signed URL:', error);
      toast.error('Failed to load image');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (filePath: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-media-file', {
        body: { filePath },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('File deleted successfully');
        return true;
      }

      throw new Error('Failed to delete file');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserFiles = useCallback(async (
    category?: string
  ): Promise<MediaFile[]> => {
    setLoading(true);
    try {
      let query = supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('file_category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(file => ({
        id: file.id,
        filePath: file.file_path,
        bucket: file.bucket_name,
        storageAccount: file.storage_account,
        fileSize: file.file_size,
        contentType: file.content_type,
        fileCategory: file.file_category,
        createdAt: file.created_at,
      }));
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    signedUrl,
    getSignedUrl,
    deleteFile,
    getUserFiles,
  };
};
