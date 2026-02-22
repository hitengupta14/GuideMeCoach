import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import ScreenHeader from '../../components/ScreenHeader';
import { Avatar } from '../../components/Avatar';
import { Card, CardBody } from '../../components/Card';
import { Button } from '../../components/Button';
import { spacing, typography, shadows } from '../../theme/spacing';
import { lightColors, darkColors } from '../../theme/colors';
import { apiClient } from '../../services/api';

function formatHours(input: unknown): string {
  const minutes = typeof input === 'number' ? input : Number(input);
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  const hours = minutes / 60;
  if (hours < 1) return `${Math.round(minutes)}m`;
  return `${Math.round(hours)}h`;
}

export default function ProfileScreen() {
  const store = useAuthStore();
  const { theme } = useThemeStore();
  const navigation = useNavigation<any>();
  const user = store?.user || { name: 'User' };
  const logout = store?.logout || (() => {});
  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const token = useAuthStore((s) => s.token);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['profile-progress', token],
    enabled: !!token,
    queryFn: async () => apiClient.getProgress('month'),
  });

  const progress: any = data || {};
  const workouts = Number(progress.totalWorkouts || 0) || 0;
  const streakDays = Number(progress.streakDays || 0) || 0;
  const totalTimeMinutes = progress?.stats?.totalTimeTrainedMinutes;
  const loading = isLoading || isFetching;

  const menuItems: Array<{
    icon: string;
    label: string;
    subtitle: string;
    color: string;
    onPress: () => void;
  }> = [
    {
      icon: 'heart',
      label: 'Favorites',
      subtitle: 'Your saved exercises',
      color: colors.error,
      onPress: () => navigation.navigate('More', { screen: 'Favorites' }),
    },
    {
      icon: 'trophy',
      label: 'Achievements',
      subtitle: 'Badges & milestones',
      color: colors.warning,
      onPress: () => navigation.navigate('More', { screen: 'Achievements' }),
    },
    {
      icon: 'clipboard-text',
      label: 'My Plans',
      subtitle: 'Saved workout plans',
      color: colors.primary,
      onPress: () => navigation.navigate('More', { screen: 'Plans' }),
    },
    {
      icon: 'cog',
      label: 'Settings',
      subtitle: 'Theme, security & more',
      color: colors.success,
      onPress: () => navigation.navigate('More', { screen: 'Settings' }),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Profile"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('More', { screen: 'Settings' })}
            activeOpacity={0.8}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <MaterialCommunityIcons name="cog" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Avatar
              initials={user?.name?.charAt(0).toUpperCase()}
              size="xl"
              backgroundColor={colors.secondary}
              isDark={isDark}
            />
            <Text style={[typography.heading1, { color: colors.textInverse, marginTop: spacing.lg }]}>
              {user?.name || 'User'}
            </Text>
            <Text style={[typography.body3, { color: `${colors.textInverse}99`, marginTop: spacing.xs }]}>
              {user?.email}
            </Text>
          </View>
        </LinearGradient>

      {/* Stats Section */}
      <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
        <View style={styles.statsRow}>
          <Card variant="flat" isDark={isDark} style={styles.statCard}>
            <CardBody>
              <Text style={[typography.heading2, { color: colors.primary, textAlign: 'center' }]}>
                {loading ? '—' : workouts}
              </Text>
              <Text style={[typography.caption1, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>
                Workouts (30d)
              </Text>
            </CardBody>
          </Card>
          <Card variant="flat" isDark={isDark} style={styles.statCard}>
            <CardBody>
              <Text style={[typography.heading2, { color: colors.success, textAlign: 'center' }]}>
                {loading ? '—' : formatHours(totalTimeMinutes)}
              </Text>
              <Text style={[typography.caption1, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>
                Time (30d)
              </Text>
            </CardBody>
          </Card>
          <Card variant="flat" isDark={isDark} style={styles.statCard}>
            <CardBody>
              <Text style={[typography.heading2, { color: colors.secondary, textAlign: 'center' }]}>
                {loading ? '—' : streakDays}
              </Text>
              <Text style={[typography.caption1, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>
                Streak Days
              </Text>
            </CardBody>
          </Card>
        </View>
      </View>

      {/* Menu Items */}
      <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
        <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.lg }]}>
          Account & Settings
        </Text>
        {menuItems.map((item, idx) => (
          <Card key={idx} variant="elevated" isDark={isDark} style={styles.menuCard}>
            <TouchableOpacity activeOpacity={0.7} onPress={item.onPress}>
              <CardBody>
                <View style={styles.menuContent}>
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={24}
                      color={item.color}
                    />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={[typography.label1, { color: colors.text }]}>
                      {item.label}
                    </Text>
                    <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </CardBody>
            </TouchableOpacity>
          </Card>
        ))}
      </View>

      {/* Sign Out Button */}
      <View style={[styles.section, { paddingHorizontal: spacing.lg, marginBottom: spacing['3xl'] }]}>
        <Button
          label="Sign Out"
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', onPress: () => {} },
              {
                text: 'Sign Out',
                onPress: logout,
                style: 'destructive',
              },
            ]);
          }}
          variant="danger"
          fullWidth
          isDark={isDark}
        />
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGradient: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  headerContent: {
    alignItems: 'center',
  },
  section: {
    paddingVertical: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    paddingVertical: spacing.lg,
  },
  menuCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
  },
});
