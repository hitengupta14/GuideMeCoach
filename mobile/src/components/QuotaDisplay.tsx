import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../store/theme';
import { lightColors, darkColors } from '../theme/colors';
import { useAIQuota } from '../hooks/useAIQuota';

interface QuotaDisplayProps {
  compact?: boolean;
}

export default function QuotaDisplay({ compact = false }: QuotaDisplayProps) {
  const { theme } = useThemeStore();
  const colors = theme === 'dark' ? darkColors : lightColors;
  const { quotas, loading } = useAIQuota();
  const navigation = useNavigation();

  if (loading || !quotas) {
    return null;
  }

  const isPremium = Object.values(quotas).some(v => v > 0);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: compact ? 12 : 16,
      marginVertical: compact ? 4 : 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: compact ? 8 : 12,
    },
    title: {
      fontSize: compact ? 13 : 14,
      fontWeight: '600',
      color: colors.text,
    },
    quotasGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: compact ? 8 : 12,
    },
    quotaItem: {
      alignItems: 'center',
      flex: 1,
    },
    quotaIcon: {
      marginBottom: 4,
    },
    quotaCount: {
      fontSize: compact ? 16 : 18,
      fontWeight: 'bold',
    },
    quotaLabel: {
      fontSize: compact ? 9 : 10,
      color: colors.textSecondary,
      marginTop: 2,
    },
    resetText: {
      fontSize: compact ? 9 : 10,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    upgradeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
    },
    upgradeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    freeTierContainer: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    freeTierText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
  });

  const getQuotaColor = (count: number): string => {
    if (count === 0) return '#EF4444';
    if (count <= 2) return '#F59E0B';
    return '#10B981';
  };

  const formatResetDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Resets today';
    if (diffDays === 1) return 'Resets tomorrow';
    return `Resets in ${diffDays} days`;
  };

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.freeTierContainer}>
          <Text style={styles.freeTierText}>
            Upgrade to unlock AI features
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Pricing' as never)}
          >
            <MaterialCommunityIcons name="star" size={18} color="#FFFFFF" />
            <Text style={styles.upgradeButtonText}>View Plans</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Features Remaining</Text>
      </View>

      <View style={styles.quotasGrid}>
        <View style={styles.quotaItem}>
          <MaterialCommunityIcons
            name="brain"
            size={compact ? 18 : 20}
            color={getQuotaColor(quotas.planner)}
            style={styles.quotaIcon}
          />
          <Text style={[styles.quotaCount, { color: getQuotaColor(quotas.planner) }]}>
            {quotas.planner}
          </Text>
          <Text style={styles.quotaLabel}>Planner</Text>
        </View>

        <View style={styles.quotaItem}>
          <MaterialCommunityIcons
            name="message-text"
            size={compact ? 18 : 20}
            color={getQuotaColor(quotas.chat)}
            style={styles.quotaIcon}
          />
          <Text style={[styles.quotaCount, { color: getQuotaColor(quotas.chat) }]}>
            {quotas.chat}
          </Text>
          <Text style={styles.quotaLabel}>Chat</Text>
        </View>

        <View style={styles.quotaItem}>
          <MaterialCommunityIcons
            name="chart-line"
            size={compact ? 18 : 20}
            color={getQuotaColor(quotas.insights)}
            style={styles.quotaIcon}
          />
          <Text style={[styles.quotaCount, { color: getQuotaColor(quotas.insights) }]}>
            {quotas.insights}
          </Text>
          <Text style={styles.quotaLabel}>Insights</Text>
        </View>

        <View style={styles.quotaItem}>
          <MaterialCommunityIcons
            name="pencil"
            size={compact ? 18 : 20}
            color={getQuotaColor(quotas.edits)}
            style={styles.quotaIcon}
          />
          <Text style={[styles.quotaCount, { color: getQuotaColor(quotas.edits) }]}>
            {quotas.edits}
          </Text>
          <Text style={styles.quotaLabel}>Edits</Text>
        </View>
      </View>

      <Text style={styles.resetText}>
        {formatResetDate(quotas.resetDate)}
      </Text>
    </View>
  );
}
