import React from 'react';
import { useThemeStore } from '../../store/theme';
import { lightColors, darkColors } from '../../theme/colors';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const features = [
  { title: 'Progress Insights', desc: 'AI summaries of your progress', route: 'AiInsights' },
  { title: 'Form Feedback', desc: 'Text consultation for your lifts', route: 'FormFeedback' },
  { title: 'Recovery Coach', desc: 'Rest day guidance and routines', route: 'Recovery' },
  { title: 'Adaptive Planner', desc: 'AI-generated workout plans', route: 'Planner' },
];

export default function AIHubScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Features</Text>
      <Text style={styles.subtitle}>Overview of AI capabilities.</Text>
      <FlatList
        data={features}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.desc}</Text>
            <Text style={styles.link} onPress={() => navigation.navigate(item.route)}>Open →</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  meta: { fontSize: 13, color: '#444', marginTop: 2 },
  link: { marginTop: 8, color: '#1D4ED8', fontWeight: '700' },
});
