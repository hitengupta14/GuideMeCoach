import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_STORAGE_KEY = 'deviceUUID';

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
    const newUUID = uuidv4();
    await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, newUUID);
    return newUUID;
  } catch (error) {
    console.log('Failed to get/generate device UUID', error);
    // Fallback to a random UUID if storage fails
    return uuidv4();
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
