import { useState } from 'react';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
}

export const useImageCompression = () => {
  const [compressing, setCompressing] = useState(false);

  const compressImage = async (
    file: File,
    options: CompressionOptions = {}
  ): Promise<File> => {
    const {
      maxSizeMB = 2,
      maxWidthOrHeight = 1920,
      quality = 0.85,
    } = options;

    // If file is already small enough, return it
    if (file.size / 1024 / 1024 <= maxSizeMB) {
      return file;
    }

    setCompressing(true);

    try {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            
            // Calculate new dimensions
            if (width > height) {
              if (width > maxWidthOrHeight) {
                height = (height * maxWidthOrHeight) / width;
                width = maxWidthOrHeight;
              }
            } else {
              if (height > maxWidthOrHeight) {
                width = (width * maxWidthOrHeight) / height;
                height = maxWidthOrHeight;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Canvas to Blob conversion failed'));
                  return;
                }
                
                const compressedFile = new File(
                  [blob],
                  file.name,
                  {
                    type: file.type,
                    lastModified: Date.now(),
                  }
                );
                
                resolve(compressedFile);
              },
              file.type,
              quality
            );
          };
          
          img.onerror = () => reject(new Error('Image loading failed'));
        };
        
        reader.onerror = () => reject(new Error('File reading failed'));
      });
    } finally {
      setCompressing(false);
    }
  };

  const validateImageSize = (file: File, maxSizeMB: number = 10): boolean => {
    const sizeMB = file.size / 1024 / 1024;
    return sizeMB <= maxSizeMB;
  };

  const validateImageType = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
  };

  return {
    compressImage,
    validateImageSize,
    validateImageType,
    compressing,
  };
};
