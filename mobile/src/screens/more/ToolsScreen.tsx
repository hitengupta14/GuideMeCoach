import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';

function bmi(weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm) return 0;
  const h = heightCm / 100;
  return weightKg / (h * h);
}

function tdee(weightKg: number, heightCm: number, age: number, sex: 'm' | 'f', activity: number) {
  if (!weightKg || !heightCm || !age) return 0;
  const bmr = sex === 'm' ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5 : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  return Math.round(bmr * activity);
}

function oneRm(weight: number, reps: number) {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30));
}

export default function ToolsScreen() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'m' | 'f'>('m');
  const [activity, setActivity] = useState('1.55');
  const [liftWeight, setLiftWeight] = useState('');
  const [liftReps, setLiftReps] = useState('');

  const bmiVal = bmi(Number(weight), Number(height));
  const tdeeVal = tdee(Number(weight), Number(height), Number(age), sex, Number(activity));
  const oneRmVal = oneRm(Number(liftWeight), Number(liftReps));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>Tools</Text>
      <Text style={styles.subtitle}>Quick fitness calculators.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>BMI</Text>
        <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} />
        <TextInput style={styles.input} placeholder="Height (cm)" keyboardType="numeric" value={height} onChangeText={setHeight} />
        <Text style={styles.result}>BMI: {bmiVal ? bmiVal.toFixed(1) : '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>TDEE</Text>
        <View style={styles.row}>
          {['m', 'f'].map((s) => (
            <Text key={s} style={[styles.chip, sex === s && styles.chipActive]} onPress={() => setSex(s as any)}>{s === 'm' ? 'Male' : 'Female'}</Text>
          ))}
        </View>
        <TextInput style={styles.input} placeholder="Age" keyboardType="numeric" value={age} onChangeText={setAge} />
        <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} />
        <TextInput style={styles.input} placeholder="Height (cm)" keyboardType="numeric" value={height} onChangeText={setHeight} />
        <TextInput style={styles.input} placeholder="Activity (1.2 sedentary - 1.9 very active)" keyboardType="numeric" value={activity} onChangeText={setActivity} />
        <Text style={styles.result}>TDEE: {tdeeVal ? `${tdeeVal} kcal` : '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1RM (Epley)</Text>
        <TextInput style={styles.input} placeholder="Weight lifted" keyboardType="numeric" value={liftWeight} onChangeText={setLiftWeight} />
        <TextInput style={styles.input} placeholder="Reps" keyboardType="numeric" value={liftReps} onChangeText={setLiftReps} />
        <Text style={styles.result}>Estimated 1RM: {oneRmVal ? `${oneRmVal} units` : '—'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, backgroundColor: '#fff', marginBottom: 8 },
  result: { fontSize: 15, fontWeight: '700', color: '#111' },
  row: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#e5e7eb', color: '#111', fontWeight: '700' },
  chipActive: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
});
