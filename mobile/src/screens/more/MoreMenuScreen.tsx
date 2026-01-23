import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const items = [
  { title: 'Body Map', icon: 'human-male', route: 'BodyMap' },
  { title: 'Favorites', icon: 'heart', route: 'Favorites' },
  { title: 'Achievements', icon: 'trophy', route: 'Achievements' },
  { title: 'AI Insights', icon: 'brain', route: 'AiInsights' },
  { title: 'Recovery', icon: 'heart-pulse', route: 'Recovery' },
  { title: 'Form Feedback', icon: 'video', route: 'FormFeedback' },
  { title: 'Settings', icon: 'cog', route: 'Settings' },
  { title: 'Tools', icon: 'calculator-variant', route: 'Tools' },
  { title: 'My Plans', icon: 'clipboard-text', route: 'Plans' },
  { title: 'AI Hub', icon: 'sparkles', route: 'AIHub' },
  { title: 'Progress V2', icon: 'chart-areaspline', route: 'ProgressV2' },
];

export default function MoreMenuScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>More</Text>
      <Text style={styles.subtitle}>Access all web-only features on mobile.</Text>
      {items.map((item) => (
        <TouchableOpacity
          key={item.route}
          style={styles.row}
          onPress={() => navigation.navigate(item.route)}
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name={item.icon as any} size={22} color="#007AFF" />
          </View>
          <Text style={styles.label}>{item.title}</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#999" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  label: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111' },
});
