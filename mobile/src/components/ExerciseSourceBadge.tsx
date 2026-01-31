import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ExerciseSource = 'manual' | 'ai_generated' | 'curated';

interface ExerciseSourceBadgeProps {
  source: ExerciseSource;
  size?: 'small' | 'medium';
}

interface BadgeConfig {
  icon: string;
  label: string;
  color: string;
  backgroundColor: string;
}

const BADGE_CONFIGS: Record<ExerciseSource, BadgeConfig> = {
  manual: {
    icon: 'pencil',
    label: 'Manual',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
  },
  ai_generated: {
    icon: 'robot',
    label: 'AI',
    color: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  curated: {
    icon: 'star',
    label: 'Curated',
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
};

export default function ExerciseSourceBadge({ source, size = 'small' }: ExerciseSourceBadgeProps) {
  const config = BADGE_CONFIGS[source];
  const isSmall = size === 'small';

  const styles = StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isSmall ? 6 : 8,
      paddingVertical: isSmall ? 3 : 4,
      borderRadius: isSmall ? 10 : 12,
      backgroundColor: config.backgroundColor,
      gap: isSmall ? 3 : 4,
    },
    icon: {
      marginTop: isSmall ? -1 : 0,
    },
    label: {
      fontSize: isSmall ? 9 : 11,
      fontWeight: '600',
      color: config.color,
    },
  });

  return (
    <View style={styles.badge}>
      <MaterialCommunityIcons
        name={config.icon as any}
        size={isSmall ? 10 : 12}
        color={config.color}
        style={styles.icon}
      />
      <Text style={styles.label}>{config.label}</Text>
    </View>
  );
}
