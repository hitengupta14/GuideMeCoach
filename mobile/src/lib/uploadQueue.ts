import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { uploadMedia } from '../services/camera';

export type QueuedUpload = {
  id: string; // unique id
  uri: string;
  type: 'photo' | 'video';
  exerciseId?: string;
  thumbnailData?: string; // base64 for persistence
};

const STORAGE_KEY = 'gm-offline-uploads-v1';

async function readQueue(): Promise<QueuedUpload[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedUpload[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export async function enqueueUpload(item: QueuedUpload) {
  const queue = await readQueue();
  await writeQueue([...queue, item]);
}

export async function getUploadQueue() {
  return readQueue();
}

export async function clearUploadQueue() {
  await writeQueue([]);
}

export async function flushQueuedUploads(): Promise<{ synced: number; remaining: number }> {
  const state = await NetInfo.fetch();
  const online = Boolean(state.isConnected && state.isInternetReachable !== false);
  if (!online) return { synced: 0, remaining: (await readQueue()).length };

  const queue = await readQueue();
  let synced = 0;
  const remaining: QueuedUpload[] = [];

  for (const item of queue) {
    try {
      await uploadMedia(item.uri, item.type, item.exerciseId);
      synced += 1;
    } catch (err) {
      remaining.push(item);
    }
  }

  await writeQueue(remaining);
  return { synced, remaining: remaining.length };
}

export async function onReconnectFlushUploads(callback?: (synced: number, remaining: number) => void) {
  return NetInfo.addEventListener(async (state) => {
    const online = Boolean(state.isConnected && state.isInternetReachable !== false);
    if (online) {
      const { synced, remaining } = await flushQueuedUploads();
      if (callback) callback(synced, remaining);
    }
  });
}
