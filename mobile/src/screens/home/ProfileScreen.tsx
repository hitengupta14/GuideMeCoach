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
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import { Avatar } from '../../components/Avatar';
import { Card, CardBody } from '../../components/Card';
import { Button } from '../../components/Button';
import { spacing, typography, shadows } from '../../theme/spacing';
import { lightColors, darkColors } from '../../theme/colors';

export default function ProfileScreen() {
  const store = useAuthStore();
  const { theme } = useThemeStore();
  const user = store?.user || { name: 'User' };
  const logout = store?.logout || (() => {});
  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const menuItems = [
    { icon: 'heart', label: 'Favorites', subtitle: 'Your saved workouts', color: colors.error },
    { icon: 'history', label: 'History', subtitle: 'Workout history', color: colors.primary },
    { icon: 'cog', label: 'Settings', subtitle: 'App preferences', color: colors.warning },
    { icon: 'shield-check', label: 'Privacy', subtitle: 'Privacy & security', color: colors.success },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Gradient */}
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
                42
              </Text>
              <Text style={[typography.caption1, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>
                Workouts
              </Text>
            </CardBody>
          </Card>
          <Card variant="flat" isDark={isDark} style={styles.statCard}>
            <CardBody>
              <Text style={[typography.heading2, { color: colors.success, textAlign: 'center' }]}>
                156
              </Text>
              <Text style={[typography.caption1, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>
                Hours
              </Text>
            </CardBody>
          </Card>
          <Card variant="flat" isDark={isDark} style={styles.statCard}>
            <CardBody>
              <Text style={[typography.heading2, { color: colors.secondary, textAlign: 'center' }]}>
                24
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
            <TouchableOpacity activeOpacity={0.7}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
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
