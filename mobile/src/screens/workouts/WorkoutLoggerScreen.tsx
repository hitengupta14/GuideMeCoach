import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enqueueWorkout, getQueue, onReconnectFlush } from '../../lib/workoutQueue';
import { WorkoutTimer } from '../../components/WorkoutTimer';
import { SyncIndicator } from '../../components/SyncIndicator';
import { useThemeStore } from '../../store/theme';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import ScreenHeader from '../../components/ScreenHeader';
import { useMediaCapture } from '@/hooks/useMediaCapture';
import { enqueueUpload, getUploadQueue, onReconnectFlushUploads, QueuedUpload } from '../../lib/uploadQueue';

interface Set {
  reps: string;
  weight: string;
  completed: boolean;
}

interface WorkoutExercise {
  id: string;
  exerciseId?: string; // optional until user selects a real exercise
  exerciseName: string;
  sets: Set[];
  notes: string;
}

export default function WorkoutLoggerScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation<any>();
  const route: any = useRoute();
  const addExercise = route?.params?.addExercise;
  const planId = route?.params?.planId as string | undefined;
  const plannedDayName = route?.params?.dayName as string | undefined;
  const templateExercises = route?.params?.templateExercises as
    | Array<{ exerciseId: string; exerciseName?: string; sets?: number; reps?: string }>
    | undefined;
  const templateRequestId = route?.params?.templateRequestId as string | undefined;
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutExercise[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [startTime, setStartTime] = useState<Date>(() => new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerForId, setPickerForId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showTimer, setShowTimer] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<string | null>(null);
  const [mediaByExercise, setMediaByExercise] = useState<Record<string, Array<{ id: string; uri: string; type: 'photo' | 'video'; status: 'queued' | 'uploading' | 'done' | 'failed'; progress: number }>>>({});
  const [pendingUploads, setPendingUploads] = useState(0);
  const [pickerModalExerciseId, setPickerModalExerciseId] = useState<string | null>(null);

  const currentIdsRef = useRef<{ exerciseId: string | null; mediaId: string | null }>({ exerciseId: null, mediaId: null });
  const handledAddExerciseRef = useRef<string | null>(null);
  const handledTemplateRef = useRef<string | null>(null);

  useEffect(() => {
    if (!addExercise?.id) return;

    const key = `${addExercise.requestId || ''}:${addExercise.id}`;
    if (handledAddExerciseRef.current === key) return;
    handledAddExerciseRef.current = key;

    setTodaysWorkout((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        exerciseId: addExercise.id,
        exerciseName: addExercise.name || 'Exercise',
        sets: [{ reps: '', weight: '', completed: false }],
        notes: '',
      },
    ]);

    // Avoid repeated adds if user revisits the tab.
    navigation.setParams({ addExercise: undefined });
  }, [addExercise, navigation]);

  useEffect(() => {
    if (!templateRequestId) return;
    if (!Array.isArray(templateExercises) || templateExercises.length === 0) return;
    if (handledTemplateRef.current === templateRequestId) return;
    handledTemplateRef.current = templateRequestId;

    const nextWorkout: WorkoutExercise[] = templateExercises.map((ex) => {
      const setsCount = Math.max(1, Number(ex?.sets || 1) || 1);
      const reps = typeof ex?.reps === 'string' ? ex.reps : '';
      return {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName || 'Exercise',
        sets: Array.from({ length: setsCount }).map(() => ({ reps, weight: '', completed: false })),
        notes: '',
      };
    });

    const applyTemplate = () => {
      setTodaysWorkout(nextWorkout);
      setWorkoutNotes('');
      setStartTime(new Date());
      navigation.setParams({ templateExercises: undefined, templateRequestId: undefined });
    };

    if (todaysWorkout.length > 0) {
      Alert.alert(
        'Replace current workout?',
        'Starting this plan workout will replace your current unsaved workout.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => navigation.setParams({ templateExercises: undefined, templateRequestId: undefined }),
          },
          { text: 'Replace', style: 'destructive', onPress: applyTemplate },
        ]
      );
    } else {
      applyTemplate();
    }
  }, [templateRequestId, templateExercises, navigation, todaysWorkout.length]);
  const mediaCapture = useMediaCapture({
    onProgress: (p) => {
      const { exerciseId, mediaId } = currentIdsRef.current;
      if (!exerciseId || !mediaId) return;
      setMediaByExercise((prev) => ({
        ...prev,
        [exerciseId]: (prev[exerciseId] || []).map((m) => (m.id === mediaId ? { ...m, progress: p } : m)),
      }));
    },
  });

  // Restore media from storage on mount
  useEffect(() => {
    const loadMedia = async () => {
      try {
        const saved = await AsyncStorage.getItem('gm-exercise-media-v1');
        if (saved) setMediaByExercise(JSON.parse(saved));
      } catch (e) {
        console.log('Failed to load saved media:', e);
      }
    };
    loadMedia();
  }, []);

  // Persist media to storage whenever it changes
  useEffect(() => {
    try {
      AsyncStorage.setItem('gm-exercise-media-v1', JSON.stringify(mediaByExercise));
    } catch (e) {
      console.log('Failed to persist media:', e);
    }
  }, [mediaByExercise]);
  const { data: exercisesList, isLoading: isExercisesLoading } = useQuery({
    queryKey: ['exercises', search],
    queryFn: async () => {
      const params: any = { includeMuscles: true };
      if (search) params.search = search;
      const res: any = await apiClient.listExercises(params);
      return res?.exercises || [];
    },
  });

  const handleAddExercise = () => {
    const newExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseName: 'Select an exercise',
      sets: [{ reps: '', weight: '', completed: false }],
      notes: '',
    };
    setTodaysWorkout([...todaysWorkout, newExercise]);
    setPickerForId(null);
    setPickerVisible(true);
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let unsubscribeUploads: (() => void) | null = null;

    const bootstrap = async () => {
      const queue = await getQueue();
      setPendingCount(queue.length);
      const uploadQueue = await getUploadQueue();
      setPendingUploads(uploadQueue.length);
      unsubscribe = await onReconnectFlush((synced, remaining) => {
        setPendingCount(remaining);
        if (synced > 0) {
          Alert.alert('Synced workouts', `${synced} offline workout(s) synced.`);
        }
      });
      unsubscribeUploads = await onReconnectFlushUploads((synced, remaining) => {
        setPendingUploads(remaining);
        if (synced > 0) {
          Alert.alert('Synced uploads', `${synced} media upload(s) synced.`);
        }
      });
    };

    bootstrap();

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribeUploads) unsubscribeUploads();
    };
  }, []);

  const handleUpdateSet = (
    exerciseId: string,
    setIndex: number,
    field: 'reps' | 'weight',
    value: string
  ) => {
    setTodaysWorkout(
      todaysWorkout.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s, i) =>
                i === setIndex ? { ...s, [field]: value } : s
              ),
            }
          : ex
      )
    );
  };

  const handleToggleSetCompleted = (exerciseId: string, setIndex: number) => {
    setTodaysWorkout(
      todaysWorkout.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s, i) =>
                i === setIndex ? { ...s, completed: !s.completed } : s
              ),
            }
          : ex
      )
    );
  };

  const handleAddSet = (exerciseId: string) => {
    setTodaysWorkout(
      todaysWorkout.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: [...ex.sets, { reps: '', weight: '', completed: false }],
            }
          : ex
      )
    );
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setTodaysWorkout(todaysWorkout.filter((ex) => ex.id !== exerciseId));
    setMediaByExercise((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
  };

  const addMediaForExercise = async (exerciseId: string, source: 'camera-photo' | 'camera-video' | 'library-photo' | 'library-video') => {
    let asset: any;
    try {
      if (source === 'camera-photo') asset = await mediaCapture.takePhoto();
      else if (source === 'camera-video') asset = await mediaCapture.takeVideo();
      else if (source === 'library-photo') asset = await mediaCapture.pickPhoto();
      else if (source === 'library-video') asset = await mediaCapture.pickVideo();

      if (!asset) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const type = source.includes('video') ? 'video' : 'photo';

      setMediaByExercise((prev) => ({
        ...prev,
        [exerciseId]: [...(prev[exerciseId] || []), { id, uri: asset.uri, type, status: 'queued', progress: 0 }],
      }));

      const net = await NetInfo.fetch();
      const online = Boolean(net.isConnected && net.isInternetReachable !== false);
      if (!online) {
        await enqueueUpload({ id, uri: asset.uri, type, exerciseId } as QueuedUpload);
        setPendingUploads((c) => c + 1);
        return;
      }

      setMediaByExercise((prev) => ({
        ...prev,
        [exerciseId]: (prev[exerciseId] || []).map((m) => (m.id === id ? { ...m, status: 'uploading' } : m)),
      }));

      currentIdsRef.current = { exerciseId, mediaId: id };
      await mediaCapture.upload({ uri: asset.uri }, type, exerciseId);

      setMediaByExercise((prev) => ({
        ...prev,
        [exerciseId]: (prev[exerciseId] || []).map((m) => (m.id === id ? { ...m, status: 'done', progress: 1 } : m)),
      }));
    } catch (err) {
      setMediaByExercise((prev) => ({
        ...prev,
        [exerciseId]: (prev[exerciseId] || []).map((m) => (m.status === 'uploading' ? { ...m, status: 'failed' } : m)),
      }));
      Alert.alert('Upload failed', 'Could not upload media. Will retry when online.');
    }
    setPickerModalExerciseId(null);
  };

  const retryFailedUpload = async (exerciseId: string, mediaId: string) => {
    const mediaItem = mediaByExercise[exerciseId]?.find((m) => m.id === mediaId);
    if (!mediaItem) return;

    try {
      setMediaByExercise((prev) => ({
        ...prev,
        [exerciseId]: (prev[exerciseId] || []).map((m) => (m.id === mediaId ? { ...m, status: 'uploading', progress: 0 } : m)),
      }));

      currentIdsRef.current = { exerciseId, mediaId };
      await mediaCapture.upload({ uri: mediaItem.uri }, mediaItem.type as any, exerciseId);

      setMediaByExercise((prev) => ({
        ...prev,
        [exerciseId]: (prev[exerciseId] || []).map((m) => (m.id === mediaId ? { ...m, status: 'done', progress: 1 } : m)),
      }));
    } catch (err) {
      setMediaByExercise((prev) => ({
        ...prev,
        [exerciseId]: (prev[exerciseId] || []).map((m) => (m.id === mediaId ? { ...m, status: 'failed' } : m)),
      }));
      Alert.alert('Retry failed', 'Could not upload media. Will try again.');
    }
  };

  const handleSaveWorkout = async () => {
    if (todaysWorkout.length === 0) {
      Alert.alert('Empty Workout', 'Please add at least one exercise');
      return;
    }

    setIsLoading(true);
    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) {
        Alert.alert('Login Required', 'Please log in to save workouts.');
        return;
      }

      const duration = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
      const dayName =
        typeof plannedDayName === 'string' && plannedDayName.trim().length > 0
          ? plannedDayName.trim()
          : new Date().toLocaleDateString('en-US', { weekday: 'long' });

      const payload = {
        id: Date.now().toString(),
        userId: user.id,
        planId: planId || undefined,
        dayName,
        startTime: startTime.getTime(),
        duration,
        exercises: todaysWorkout
          .filter((ex) => ex.exerciseId)
          .map((ex) => ({
            exerciseId: ex.exerciseId as string,
            notes: ex.notes,
            sets: ex.sets,
          })),
      };

      const net = await NetInfo.fetch();
      const online = Boolean(net.isConnected && net.isInternetReachable !== false);

      if (!online) {
        await enqueueWorkout(payload as any);
        setPendingCount((c) => c + 1);
        Alert.alert('Saved offline', 'Workout will sync automatically when back online.');
        setTodaysWorkout([]);
        setWorkoutNotes('');
        setStartTime(new Date());
        navigation.setParams({ planId: undefined, dayName: undefined });
        return;
      }

      // Start a workout session
      const session: any = await apiClient.startWorkoutSession(user.id, dayName, planId);
      const sessionId = session?.id || session?.data?.id;

      // If we have a session, log each exercise with a real exerciseId
      if (sessionId) {
        for (const ex of todaysWorkout) {
          if (!ex.exerciseId) continue; // skip placeholder entries

          const completedSets = ex.sets.filter(
            (s) => s.completed || String(s.reps || '').trim().length > 0 || String(s.weight || '').trim().length > 0
          );
          const completedReps = completedSets.reduce((sum, s) => sum + (parseInt(s.reps || '0', 10) || 0), 0);
          const lastWeight = completedSets.length > 0
            ? parseFloat(completedSets[completedSets.length - 1].weight || '0') || 0
            : 0;

          await apiClient.logExercise({
            userId: user.id,
            sessionId,
            exerciseId: ex.exerciseId,
            plannedSets: ex.sets.length,
            completedSets: completedSets.length,
            completedReps,
            weight: lastWeight,
            duration,
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

        await apiClient.updateWorkoutSession(sessionId, { duration, completedAt: new Date() });
      }

      const buttons: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'default' | 'destructive' }> = [];
      if (sessionId) {
        buttons.push({
          text: 'View summary',
          onPress: () => navigation.navigate('WorkoutSummary', { sessionId }),
        });
      }
      buttons.push({
        text: 'Done',
        style: 'cancel',
        onPress: () => {
          setTodaysWorkout([]);
          setWorkoutNotes('');
          setStartTime(new Date());
          navigation.setParams({ planId: undefined, dayName: undefined });
        },
      });
      Alert.alert('Success', 'Workout saved successfully!', buttons);
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setIsLoading(false);
    }
  };

  const completedSets = todaysWorkout.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalSets = todaysWorkout.reduce((acc, ex) => acc + ex.sets.length, 0);
  const saveDisabled = todaysWorkout.length === 0 || isLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Workout"
        subtitle="Log today’s session."
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('WorkoutHistory')}
              activeOpacity={0.8}
              style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
              accessibilityRole="button"
              accessibilityLabel="Open workout history"
            >
              <MaterialCommunityIcons name="history" size={22} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowTimer((v) => !v)}
              activeOpacity={0.8}
              style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
              accessibilityRole="button"
              accessibilityLabel={showTimer ? 'Hide timer' : 'Show timer'}
            >
              <MaterialCommunityIcons
                name={showTimer ? 'timer-off-outline' : 'timer-outline'}
                size={22}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Phase 3: Enhanced Sync Indicators */}
      <SyncIndicator 
        pendingCount={pendingCount} 
        isSyncing={false}
        onPress={() => Alert.alert(
          'Pending Workouts',
          `${pendingCount} workout(s) will sync when you're back online.`,
          [{ text: 'OK' }]
        )}
      />
      <SyncIndicator 
        pendingCount={pendingUploads} 
        isSyncing={false}
        onPress={() => Alert.alert(
          'Pending Uploads',
          `${pendingUploads} media file(s) will upload when you're back online.`,
          [{ text: 'OK' }]
        )}
      />
      
      {/* Media Picker Modal */}
      <Modal visible={pickerModalExerciseId !== null} animationType="slide">
        <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Media</Text>
          <TouchableOpacity onPress={() => setPickerModalExerciseId(null)}>
            <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
          <View style={{ padding: 16 }}>
            <TouchableOpacity onPress={() => addMediaForExercise(pickerModalExerciseId!, 'camera-photo')} style={[styles.mediaPickerOption, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="camera" size={32} color={colors.primary} />
              <Text style={[styles.mediaPickerText, { color: colors.text }]}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => addMediaForExercise(pickerModalExerciseId!, 'camera-video')} style={[styles.mediaPickerOption, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="video" size={32} color={colors.primary} />
              <Text style={[styles.mediaPickerText, { color: colors.text }]}>Record Video</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => addMediaForExercise(pickerModalExerciseId!, 'library-photo')} style={[styles.mediaPickerOption, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="image" size={32} color={colors.primary} />
              <Text style={[styles.mediaPickerText, { color: colors.text }]}>Photo from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => addMediaForExercise(pickerModalExerciseId!, 'library-video')} style={[styles.mediaPickerOption, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="video-box" size={32} color={colors.primary} />
              <Text style={[styles.mediaPickerText, { color: colors.text }]}>Video from Library</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
      {/* Exercise Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide">
        <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }] }>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Exercise</Text>
          <TouchableOpacity onPress={() => setPickerVisible(false)}>
            <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search exercises"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <ScrollView style={{ flex: 1 }}>
          {isExercisesLoading ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} style={styles.exercisePickRow}>
                  <SkeletonLoader width="60%" height={16} />
                  <SkeletonLoader width={80} height={12} />
                </View>
              ))}
            </View>
          ) : (
          (exercisesList || []).map((ex: any) => (
            <TouchableOpacity
              key={ex.id}
              style={styles.exercisePickRow}
              onPress={() => {
                // Assign the picked exercise to the last placeholder
                setTodaysWorkout((prev) => {
                  const next = [...prev];
                  for (let i = next.length - 1; i >= 0; i--) {
                    if (!next[i].exerciseId) {
                      next[i] = {
                        ...next[i],
                        exerciseId: ex.id,
                        exerciseName: ex.name,
                      };
                      break;
                    }
                  }
                  return next;
                });
                setPickerVisible(false);
              }}
            >
              <Text style={[styles.exercisePickName, { color: colors.text }]}>{ex.name}</Text>
              <Text style={[styles.exercisePickMeta, { color: colors.textSecondary }]}>{ex.category} • {ex.difficulty}</Text>
            </TouchableOpacity>
          )))}
        </ScrollView>
      </Modal>
      {/* Header Stats */}
      <View style={styles.statsHeader}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Exercises</Text>
          <Text style={styles.statValue}>{todaysWorkout.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Sets</Text>
          <Text style={styles.statValue}>{totalSets}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={styles.statValue}>
            {completedSets}/{totalSets}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Exercises List */}
        {todaysWorkout.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="dumbbell" size={48} color="#ccc" />
            <Text style={[styles.emptyText, { color: colors.text } ]}>No exercises added yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Add exercises to start logging your workout
            </Text>
          </View>
        ) : (
          todaysWorkout.map((exercise, exIdx) => (
            <View key={exercise.id} style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>
                  {exercise.exerciseName}
                </Text>
                <TouchableOpacity
                  style={styles.timerBadge}
                  onPress={() => {
                    setCurrentExercise(exercise.exerciseName);
                    setShowTimer(true);
                  }}
                >
                  <MaterialCommunityIcons name="timer" size={16} color={colors.primary} />
                  <Text style={[styles.timerBadgeText, { color: colors.primary }]}>Rest Timer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleRemoveExercise(exercise.id)}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Sets */}
              {exercise.sets.map((set, setIdx) => (
                <View key={setIdx} style={[styles.setRow, { borderBottomColor: colors.borderLight }]}>
                  <TouchableOpacity
                    style={[
                      styles.setCheckbox,
                      { borderColor: colors.border },
                      set.completed && { backgroundColor: colors.success, borderColor: colors.success },
                    ]}
                    onPress={() =>
                      handleToggleSetCompleted(exercise.id, setIdx)
                    }
                  >
                    {set.completed && (
                      <MaterialCommunityIcons
                        name="check"
                        size={16}
                        color={colors.textInverse}
                      />
                    )}
                  </TouchableOpacity>

                  <View style={styles.setInputs}>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Reps</Text>
                      <TextInput
                        style={[
                          styles.input,
                          { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text },
                          set.completed && [styles.inputCompleted, { backgroundColor: colors.backgroundTertiary, color: colors.textTertiary }],
                        ]}
                        placeholder="0"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="number-pad"
                        value={set.reps}
                        onChangeText={(value) =>
                          handleUpdateSet(exercise.id, setIdx, 'reps', value)
                        }
                        editable={!set.completed}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Weight (lbs)</Text>
                      <TextInput
                        style={[
                          styles.input,
                          { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text },
                          set.completed && [styles.inputCompleted, { backgroundColor: colors.backgroundTertiary, color: colors.textTertiary }],
                        ]}
                        placeholder="0"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="decimal-pad"
                        value={set.weight}
                        onChangeText={(value) =>
                          handleUpdateSet(exercise.id, setIdx, 'weight', value)
                        }
                        editable={!set.completed}
                      />
                    </View>
                  </View>

                  <Text style={[styles.setNumber, { color: colors.textSecondary }]}>Set {setIdx + 1}</Text>
                </View>
              ))}

              {/* Add Set Button */}
              <TouchableOpacity
                style={[styles.addSetButton, { borderColor: colors.primary }]}
                onPress={() => handleAddSet(exercise.id)}
              >
                <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
                <Text style={[styles.addSetText, { color: colors.primary }]}>Add Set</Text>
              </TouchableOpacity>

              {/* Media Attachments */}
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="paperclip" size={16} color={colors.textSecondary} />
                  <Text style={{ marginLeft: 6, color: colors.textSecondary, fontWeight: '600' }}>Attachments</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {(mediaByExercise[exercise.id] || []).map((m) => (
                    <TouchableOpacity key={m.id} onLongPress={() => m.status === 'failed' && retryFailedUpload(exercise.id, m.id)} style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                      {m.type === 'photo' ? (
                        <Image source={{ uri: m.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      ) : (
                        <MaterialCommunityIcons name="video" size={20} color={colors.textSecondary} />
                      )}
                      {m.status === 'uploading' && (
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: colors.border }}>
                          <View style={{ width: `${Math.round(m.progress * 100)}%`, height: 3, backgroundColor: colors.primary }} />
                        </View>
                      )}
                      {m.status === 'done' && (
                        <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} style={{ position: 'absolute', top: 4, right: 4 }} />
                      )}
                      {m.status === 'failed' && (
                        <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(255, 0, 0, 0.3)', alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialCommunityIcons name="restart" size={20} color={colors.error} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => setPickerModalExerciseId(exercise.id)} style={{ width: 64, height: 64, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary }}>
                    <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notes */}
              <TextInput
                style={[styles.notesInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
                placeholder="Notes for this exercise..."
                placeholderTextColor={colors.textTertiary}
                multiline
                value={exercise.notes}
                onChangeText={(value) => {
                  setTodaysWorkout(
                    todaysWorkout.map((ex) =>
                      ex.id === exercise.id ? { ...ex, notes: value } : ex
                    )
                  );
                }}
              />
            </View>
          ))
        )}

        {/* Workout Notes */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Workout Notes</Text>
          <TextInput
            style={[styles.workoutNotesInput, { borderColor: colors.border, color: colors.text }]}
            placeholder="How did you feel? Any PRs or achievements?"
            multiline
            numberOfLines={4}
            value={workoutNotes}
            onChangeText={setWorkoutNotes}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </ScrollView>

      {showTimer && (
        <View style={[styles.timerContainer, { backgroundColor: colors.card }]}>
          <WorkoutTimer
            exerciseName={currentExercise || 'Current Set'}
            restSeconds={60}
            onComplete={() => setShowTimer(false)}
          />
          <TouchableOpacity style={styles.closeTimer} onPress={() => setShowTimer(false)}>
            <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Footer Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.addExerciseButton, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}
          onPress={handleAddExercise}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
          <Text style={[styles.addExerciseText, { color: colors.primary }]}>Add Exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: saveDisabled ? colors.disabled : colors.success, opacity: saveDisabled ? 0.8 : 1 },
          ]}
          onPress={handleSaveWorkout}
          disabled={saveDisabled}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color={colors.textInverse} />
              <Text style={styles.saveButtonText}>Save Workout</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  exercisePickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  exercisePickName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  exercisePickMeta: {
    fontSize: 12,
    color: '#666',
  },
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
  },
  syncText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  scrollContent: {
    flex: 1,
    padding: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  timerBadgeText: {
    color: '#1F6FEB',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  exerciseChangeHint: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  setCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  setCheckboxCompleted: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    marginRight: 12,
  },
  inputLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    borderWidth: 1,
  },
  inputCompleted: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  setNumber: {
    fontSize: 12,
    color: '#999',
    minWidth: 50,
    textAlign: 'right',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 6,
  },
  addSetText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  notesInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 60,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  workoutNotesInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  addExerciseButton: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addExerciseText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  timerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
    paddingBottom: 16,
  },
  closeTimer: {
    alignSelf: 'center',
    marginTop: -10,
  },
  mediaPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  mediaPickerText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});
