import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';

interface Set {
  reps: string;
  weight: string;
  completed: boolean;
}

interface WorkoutExercise {
  id: string;
  exerciseName: string;
  sets: Set[];
  notes: string;
}

export default function WorkoutLoggerScreen() {
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutExercise[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [startTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const handleAddExercise = () => {
    const newExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseName: 'New Exercise',
      sets: [{ reps: '', weight: '', completed: false }],
      notes: '',
    };
    setTodaysWorkout([...todaysWorkout, newExercise]);
  };

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
  };

  const handleSaveWorkout = async () => {
    if (todaysWorkout.length === 0) {
      Alert.alert('Empty Workout', 'Please add at least one exercise');
      return;
    }

    setIsLoading(true);
    try {
      const workoutData = {
        date: new Date().toISOString(),
        duration: Math.round((new Date().getTime() - startTime.getTime()) / 60000),
        exercises: todaysWorkout.map((ex) => ({
          name: ex.exerciseName,
          sets: ex.sets,
          notes: ex.notes,
        })),
        notes: workoutNotes,
      };

      // TODO: Replace with actual API call
      console.log('Saving workout:', workoutData);

      Alert.alert('Success', 'Workout saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setTodaysWorkout([]);
            setWorkoutNotes('');
          },
        },
      ]);
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

  return (
    <View style={styles.container}>
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
            <Text style={styles.emptyText}>No exercises added yet</Text>
            <Text style={styles.emptySubtext}>
              Add exercises to start logging your workout
            </Text>
          </View>
        ) : (
          todaysWorkout.map((exercise, exIdx) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName} numberOfLines={2}>
                  {exercise.exerciseName}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveExercise(exercise.id)}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>

              {/* Sets */}
              {exercise.sets.map((set, setIdx) => (
                <View key={setIdx} style={styles.setRow}>
                  <TouchableOpacity
                    style={[
                      styles.setCheckbox,
                      set.completed && styles.setCheckboxCompleted,
                    ]}
                    onPress={() =>
                      handleToggleSetCompleted(exercise.id, setIdx)
                    }
                  >
                    {set.completed && (
                      <MaterialCommunityIcons
                        name="check"
                        size={16}
                        color="#fff"
                      />
                    )}
                  </TouchableOpacity>

                  <View style={styles.setInputs}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Reps</Text>
                      <TextInput
                        style={[
                          styles.input,
                          set.completed && styles.inputCompleted,
                        ]}
                        placeholder="0"
                        keyboardType="number-pad"
                        value={set.reps}
                        onChangeText={(value) =>
                          handleUpdateSet(exercise.id, setIdx, 'reps', value)
                        }
                        editable={!set.completed}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Weight (lbs)</Text>
                      <TextInput
                        style={[
                          styles.input,
                          set.completed && styles.inputCompleted,
                        ]}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        value={set.weight}
                        onChangeText={(value) =>
                          handleUpdateSet(exercise.id, setIdx, 'weight', value)
                        }
                        editable={!set.completed}
                      />
                    </View>
                  </View>

                  <Text style={styles.setNumber}>Set {setIdx + 1}</Text>
                </View>
              ))}

              {/* Add Set Button */}
              <TouchableOpacity
                style={styles.addSetButton}
                onPress={() => handleAddSet(exercise.id)}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#007AFF" />
                <Text style={styles.addSetText}>Add Set</Text>
              </TouchableOpacity>

              {/* Notes */}
              <TextInput
                style={styles.notesInput}
                placeholder="Notes for this exercise..."
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Notes</Text>
          <TextInput
            style={styles.workoutNotesInput}
            placeholder="How did you feel? Any PRs or achievements?"
            multiline
            numberOfLines={4}
            value={workoutNotes}
            onChangeText={setWorkoutNotes}
          />
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={handleAddExercise}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#007AFF" />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (todaysWorkout.length === 0 || isLoading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveWorkout}
          disabled={todaysWorkout.length === 0 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color="#fff" />
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
    backgroundColor: '#f5f5f5',
  },
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
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
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
});
