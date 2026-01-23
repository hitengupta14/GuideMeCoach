import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, typography, shadows } from '../theme/spacing';
import { lightColors, darkColors } from '../theme/colors';

interface TabBarProps {
  tabs: Array<{
    name: string;
    icon: string;
    label: string;
  }>;
  activeTab: string;
  onTabChange: (tabName: string) => void;
  isDark?: boolean;
}

export function TabBar({ tabs, activeTab, onTabChange, isDark = false }: TabBarProps) {
  const colors = isDark ? darkColors : lightColors;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => onTabChange(tab.name)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                isActive && {
                  backgroundColor: `${colors.primary}15`,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={24}
                color={isActive ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text
              style={[
                typography.caption2,
                {
                  color: isActive ? colors.primary : colors.textSecondary,
                  marginTop: spacing.xs,
                  fontWeight: isActive ? '600' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && (
              <View
                style={[
                  styles.indicator,
                  { backgroundColor: colors.primary },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: spacing.sm,
    ...shadows.lg,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: 24,
    borderRadius: 1.5,
  },
});
