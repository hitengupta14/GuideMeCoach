import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface WorkoutTimerProps {
  exerciseName?: string;
  restSeconds?: number;
  onComplete?: () => void;
}

export function WorkoutTimer({ exerciseName, restSeconds = 60, onComplete }: WorkoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState(restSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const playSound = async (type: 'tick' | 'complete') => {
    try {
      const source =
        type === 'complete'
          ? require('../../assets/sounds/complete.mp3')
          : require('../../assets/sounds/tick.mp3');
      const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
      // Auto-unload when playback finishes
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && (status.didJustFinish || status.positionMillis >= (status.durationMillis || 0))) {
          sound.unloadAsync();
        }
      });
    } catch (err) {
      // If files are placeholders or missing, just skip audio
      console.log('Sound playback skipped:', err?.message || String(err));
    }
  };

  const startTimer = () => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          playSound('complete');
          scheduleNotification('Rest complete!', `Time to start ${exerciseName || 'next set'}`);
          if (onComplete) onComplete();
          return 0;
        }
        if (prev <= 3) {
          playSound('tick');
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetTimer = () => {
    stopTimer();
    setTimeLeft(restSeconds);
  };

  const scheduleNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null, // immediate
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerCircle}>
        <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
        {exerciseName && <Text style={styles.exerciseText}>{exerciseName}</Text>}
      </View>

      <View style={styles.controls}>
        {!isRunning ? (
          <TouchableOpacity style={styles.startButton} onPress={startTimer}>
            <MaterialCommunityIcons name="play" size={32} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.pauseButton} onPress={stopTimer}>
            <MaterialCommunityIcons name="pause" size={32} color="#fff" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.resetButton} onPress={resetTimer}>
          <MaterialCommunityIcons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 8,
    borderColor: '#007AFF',
  },
  timeText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000',
  },
  exerciseText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  startButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
