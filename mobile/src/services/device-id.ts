import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_STORAGE_KEY = 'deviceUUID';

/**
 * Generate a UUID v4 using pure JavaScript (React Native compatible)
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or generate a stable device UUID.
 * This UUID persists across app restarts for consistent device identification.
 */
export async function getOrGenerateDeviceUUID(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (stored) {
      return stored;
    }

    // Generate new UUID if not found
    const newUUID = generateUUID();
    await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, newUUID);
    return newUUID;
  } catch (error) {
    console.log('Failed to get/generate device UUID', error);
    // Fallback to a random UUID if storage fails
    return generateUUID();
  }
}

/**
 * Clear the stored device UUID (typically on hard reset or uninstall/reinstall).
 */
export async function resetDeviceUUID(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_STORAGE_KEY);
  } catch (error) {
    console.log('Failed to reset device UUID', error);
  }
}
