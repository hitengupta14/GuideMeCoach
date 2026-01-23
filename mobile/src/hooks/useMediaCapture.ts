import { useCallback, useState } from 'react';
import { capturePhoto, captureVideo, pickImageFromLibrary, pickVideoFromLibrary, uploadMedia } from '@/services/camera';

export function useMediaCapture(options?: { onProgress?: (p: number) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleProgress = useCallback((p: number) => {
    setProgress(Math.round(p * 100));
    options?.onProgress?.(p);
  }, [options]);

  const takePhoto = useCallback(async () => {
    setError(null);
    try {
      const asset = await capturePhoto();
      return asset;
    } catch (e: any) {
      setError(e?.message || 'Failed to capture photo');
      return null;
    }
  }, []);

  const takeVideo = useCallback(async () => {
    setError(null);
    try {
      const asset = await captureVideo();
      return asset;
    } catch (e: any) {
      setError(e?.message || 'Failed to capture video');
      return null;
    }
  }, []);

  const pickPhoto = useCallback(async () => {
    setError(null);
    try {
      const asset = await pickImageFromLibrary();
      return asset;
    } catch (e: any) {
      setError(e?.message || 'Failed to pick image');
      return null;
    }
  }, []);

  const pickVideo = useCallback(async () => {
    setError(null);
    try {
      const asset = await pickVideoFromLibrary();
      return asset;
    } catch (e: any) {
      setError(e?.message || 'Failed to pick video');
      return null;
    }
  }, []);

  const upload = useCallback(async (asset: { uri: string }, type: 'photo' | 'video', exerciseId?: string) => {
    if (!asset?.uri) return null;
    setIsUploading(true);
    setProgress(0);
    setError(null);
    try {
      const res = await uploadMedia(asset.uri, type, exerciseId, handleProgress);
      return res;
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [handleProgress]);

  return {
    isUploading,
    progress,
    error,
    takePhoto,
    takeVideo,
    pickPhoto,
    pickVideo,
    upload,
  };
}
