import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { apiClient } from '../services/api';

export type QueuedWorkout = {
  id: string;
  userId: string;
  planId?: string;
  dayName: string;
  startTime: number;
  duration: number;
  exercises: Array<{
    exerciseId: string;
    notes: string;
    sets: Array<{ reps: string; weight: string; completed: boolean }>;
  }>;
};

const STORAGE_KEY = 'gm-offline-workouts-v1';

async function readQueue(): Promise<QueuedWorkout[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedWorkout[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

/**
 * Phase 3: Prevent duplicate workout uploads
 * Checks if workout with same ID already exists in queue
 */
export async function enqueueWorkout(workout: QueuedWorkout) {
  const queue = await readQueue();
  
  // Check for duplicate by ID
  const isDuplicate = queue.some(item => item.id === workout.id);
  if (isDuplicate) {
    console.warn(`[WorkoutQueue] Duplicate workout prevented: ${workout.id}`);
    return; // Don't add duplicate
  }
  
  await writeQueue([...queue, workout]);
}

export async function getQueue() {
  return readQueue();
}

export async function clearQueue() {
  await writeQueue([]);
}

export async function flushQueuedWorkouts(): Promise<{ synced: number; remaining: number }> {
  const state = await NetInfo.fetch();
  const online = Boolean(state.isConnected && state.isInternetReachable !== false);
  if (!online) return { synced: 0, remaining: (await readQueue()).length };

  const queue = await readQueue();
  let synced = 0;
  const remaining: QueuedWorkout[] = [];

  for (const item of queue) {
    try {
      const session: any = await apiClient.startWorkoutSession(item.userId, item.dayName, item.planId);
      const sessionId = session?.id || session?.data?.id;
      if (!sessionId) throw new Error('No session id');

      for (const ex of item.exercises) {
        const completedSets = ex.sets.filter((s) => s.completed);
        const completedReps = completedSets.reduce((sum, s) => sum + (parseInt(s.reps || '0', 10) || 0), 0);
        const lastWeight = completedSets.length > 0
          ? parseFloat(completedSets[completedSets.length - 1].weight || '0') || 0
          : 0;

        await apiClient.logExercise({
          userId: item.userId,
          sessionId,
          exerciseId: ex.exerciseId,
          plannedSets: ex.sets.length,
          completedSets: completedSets.length,
          completedReps,
          weight: lastWeight,
          duration: item.duration,
          notes: ex.notes,
        });

        for (let i = 0; i < ex.sets.length; i += 1) {
          const s = ex.sets[i];
          const reps = parseInt(String(s.reps || '').trim() || '0', 10);
          const weight = parseFloat(String(s.weight || '').trim() || '0');
          const hasData =
            Boolean(s.completed) ||
            (Number.isFinite(reps) && reps > 0) ||
            (Number.isFinite(weight) && weight > 0);

          if (!hasData) continue;

          await apiClient.saveWorkoutSet({
            sessionId,
            exerciseId: ex.exerciseId,
            setNumber: i + 1,
            completedReps: Number.isFinite(reps) && reps > 0 ? reps : undefined,
            weight: Number.isFinite(weight) && weight > 0 ? weight : undefined,
          });
        }
      }

      const completedAt = Number.isFinite(item.startTime)
        ? new Date(item.startTime + (Number(item.duration || 0) || 0) * 60_000)
        : new Date();
      await apiClient.updateWorkoutSession(sessionId, { duration: item.duration, completedAt });

      synced += 1;
    } catch (err) {
      remaining.push(item);
    }
  }

  await writeQueue(remaining);
  return { synced, remaining: remaining.length };
}

export async function onReconnectFlush(callback?: (synced: number, remaining: number) => void) {
  return NetInfo.addEventListener(async (state) => {
    const online = Boolean(state.isConnected && state.isInternetReachable !== false);
    if (online) {
      const { synced, remaining } = await flushQueuedWorkouts();
      if (callback) callback(synced, remaining);
    }
  });
}
