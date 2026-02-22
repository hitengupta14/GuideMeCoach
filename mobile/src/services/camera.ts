import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { apiClient } from './api';
import { config } from '../config/api';

function inferMimeType(type: 'photo' | 'video', filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (type === 'video') {
    if (ext === 'mp4') return 'video/mp4';
    if (ext === 'mov' || ext === 'qt') return 'video/quicktime';
    if (ext === 'webm') return 'video/webm';
    return 'video/mp4';
  }

  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  return 'image/jpeg';
}

export async function requestCameraPermissions() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function requestMediaLibraryPermissions() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export async function capturePhoto() {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) {
    throw new Error('Camera permission denied');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0];
}

export async function captureVideo() {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) {
    throw new Error('Camera permission denied');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: false,
    quality: 0.7,
    videoMaxDuration: 30, // 30 second max for form videos
  });

  if (result.canceled) return null;
  return result.assets[0];
}

export async function pickImageFromLibrary() {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) {
    throw new Error('Media library permission denied');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0];
}

export async function pickVideoFromLibrary() {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) {
    throw new Error('Media library permission denied');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: false,
    quality: 0.7,
  });

  if (result.canceled) return null;
  return result.assets[0];
}

export async function uploadMedia(
  uri: string,
  type: 'photo' | 'video',
  exerciseId?: string,
  onProgress?: (progress: number) => void
) {
  const filename = uri.split('/').pop() || 'upload';
  const fileType = inferMimeType(type, filename);

	try {
	  if (type === 'video') {
	    const info = await FileSystem.getInfoAsync(uri, { size: true });
	    if (!info.exists) {
	      throw new Error('File not found');
	    }

	    const fileSize =
	      'size' in info && typeof (info as any).size === 'number' ? ((info as any).size as number) : undefined;

	    const init: any = await apiClient.createVideoUpload({
	      exerciseId: exerciseId || undefined,
	      fileName: filename,
        fileType,
        fileSize,
      });

      const upload = init?.data?.upload;
      const videoId = init?.data?.videoId;
      if (!upload?.url || !videoId) {
        throw new Error('Failed to initialize video upload');
      }

      const task = FileSystem.createUploadTask(
        upload.url,
        uri,
        {
          httpMethod: upload.method || 'PUT',
          headers: upload.headers || { 'Content-Type': fileType },
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        },
        (data) => {
          if (!onProgress || !data.totalBytesExpectedToSend) return;
          onProgress(data.totalBytesSent / data.totalBytesExpectedToSend);
        }
      );

      const result = await task.uploadAsync();
      if (!result || result.status < 200 || result.status >= 300) {
        throw new Error(`Upload failed: ${result?.status || 'unknown status'}`);
      }

      onProgress?.(1);
      return { success: true, videoId, s3Key: init?.data?.s3Key };
    }

    const uploadUrl = '/users/upload-photo';

    // Use XMLHttpRequest for accurate progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = e.loaded / e.total;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve({ success: true });
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed: network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      const formData = new FormData();
      formData.append(type, {
        uri,
        name: filename,
        type: fileType,
      } as any);

      const headers: Record<string, any> = {};
      const auth = (config.headers as any)?.Authorization;
      const cookie = (config.headers as any)?.Cookie;
      if (auth) headers.Authorization = auth;
      if (cookie) headers.Cookie = cookie;
      const fullUrl = `${apiClient.baseURL}${uploadUrl}`;

      xhr.open('POST', fullUrl, true);
      Object.keys(headers).forEach((key) => {
        xhr.setRequestHeader(key, headers[key]);
      });

      xhr.send(formData);
    });
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}
