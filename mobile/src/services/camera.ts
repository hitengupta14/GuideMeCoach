import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { apiClient } from './api';

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
  const match = /\.(\w+)$/.exec(filename);
  const fileType = match ? `${type}/${match[1]}` : `${type}`;

  try {
    const uploadUrl = type === 'video' ? '/v1/video/upload' : '/users/upload-photo';
    
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

      if (exerciseId) {
        formData.append('exerciseId', exerciseId);
      }
      
      const headers = (apiClient as any).config?.headers || {};
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
