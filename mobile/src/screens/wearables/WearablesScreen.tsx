import React, { useMemo, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../services/api';
import { LoadingView, ErrorView, EmptyView } from '../../components/State';
import { useThemeStore } from '../../store/theme';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing } from '../../theme/spacing';

WebBrowser.maybeCompleteAuthSession();

export default function WearablesScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  const appUrl = useMemo(() => apiClient.baseURL.replace(/\/api\/?$/, ''), []);

  const {
    data: connectionsRaw,
    isLoading: isConnectionsLoading,
    error: connectionsError,
    refetch: refetchConnections,
  } = useQuery({
    queryKey: ['wearableConnections'],
    queryFn: async () => {
      const res: any = await apiClient.getWearableConnections();
      return res?.data ?? res;
    },
  });

  const connectedProviders = useMemo(() => {
    const list = Array.isArray(connectionsRaw) ? connectionsRaw : [];
    return new Set<string>(list.map((c: any) => c?.provider).filter(Boolean));
  }, [connectionsRaw]);

  const { data: wearableData, isLoading, error, refetch: refetchWearableData } = useQuery({
    queryKey: ['wearableData'],
    queryFn: () => apiClient.getWearableData(7),
  });

  // API returns { steps: [], heartRate: [], sleep: [] }
  const healthData = (wearableData as any) || {};

  const handleConnectDevice = async (provider: string) => {
    try {
      // Apple Health is handled locally on-device; we store a lightweight connection record.
      if (provider === 'apple-health') {
        const response: any = await apiClient.connectWearable(provider);
        if (response?.success) {
          await refetchConnections();
          Alert.alert('Success', 'Apple Health connected!')
        } else {
          throw new Error(response?.error || 'Failed to connect Apple Health')
        }
        return
      }

      // Start OAuth: backend returns authUrl (includes signed state).
      const start: any = await apiClient.connectWearable(provider);
      const authUrl = start?.data?.authUrl || start?.authUrl;
      const redirectUriFromServer = start?.data?.redirectUri || start?.redirectUri;
      if (!authUrl) {
        throw new Error(start?.error || 'Failed to start OAuth flow')
      }

      const redirectUri =
        typeof redirectUriFromServer === 'string' && redirectUriFromServer.length > 0
          ? redirectUriFromServer
          : provider === 'fitbit'
            ? `${appUrl}/wearables/fitbit`
            : provider === 'google-fit'
              ? `${appUrl}/wearables/google`
              : appUrl;

      const result: any = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      if (result?.type !== 'success' || typeof result?.url !== 'string') {
        return
      }

      const callbackUrl = new URL(result.url);
      const code = callbackUrl.searchParams.get?.('code') ?? null;
      const state = callbackUrl.searchParams.get?.('state') ?? null;
      const oauthError = callbackUrl.searchParams.get?.('error') ?? null;
      if (oauthError) {
        throw new Error(oauthError);
      }
      if (!code || !state) {
        throw new Error('OAuth did not return a code/state');
      }

      const complete: any = await apiClient.connectWearable(provider, code, undefined, state);
      if (!complete?.success) {
        throw new Error(complete?.error || 'Failed to complete OAuth flow');
      }

      // Sync immediately to populate metrics.
      await apiClient.syncWearables({ provider, days: 7 } as any).catch(() => null);

      await Promise.all([refetchConnections(), refetchWearableData()]);
      Alert.alert('Success', `${provider} connected!`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to connect device');
    }
  };

  const handleDisconnectDevice = async (provider: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Disconnect wearable',
        'Are you sure you want to disconnect this wearable? You can reconnect anytime.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Disconnect', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });
    if (!confirmed) return;

    try {
      setBusyProvider(provider);
      const res: any = await apiClient.disconnectWearable(provider);
      if (!res?.success) {
        throw new Error(res?.error || 'Failed to disconnect wearable');
      }

      await Promise.all([refetchConnections(), refetchWearableData()]);
      Alert.alert('Disconnected', 'Wearable disconnected successfully.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to disconnect wearable');
    } finally {
      setBusyProvider(null);
    }
  };

  const devices = [
    { name: 'Apple HealthKit', id: 'apple-health', icon: 'apple' },
    { name: 'Fitbit', id: 'fitbit', icon: 'heart-pulse' },
    { name: 'Google Fit', id: 'google-fit', icon: 'google' },
  ];

  if (isConnectionsLoading || isLoading) {
    return <LoadingView message="Loading health data" />;
  }

  if (connectionsError || error) {
    return <ErrorView message="Failed to load health data" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Wearables"
        subtitle="Connect and sync your wearable devices."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="heart-pulse" size={22} color={colors.error} />
          </View>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
      >

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Devices</Text>
          <TouchableOpacity
            onPress={async () => {
              try {
                await apiClient.syncWearables({ days: 7 } as any);
                await refetchWearableData();
                Alert.alert('Synced', 'Wearable data synced successfully.');
              } catch {
                Alert.alert('Sync failed', 'Could not sync wearable data. Try again later.');
              }
            }}
            style={[styles.syncButton, { borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="sync" size={16} color={colors.text} />
            <Text style={[styles.syncText, { color: colors.text }]}>Sync</Text>
          </TouchableOpacity>
        </View>
        {devices.map((device: any) => {
          const isConnected = connectedProviders.has(device.id);
          const isBusy = busyProvider === device.id;

          return (
          <View key={device.id} style={[styles.deviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons
              name={device.icon}
              size={24}
              color={colors.primary}
            />
            <View style={styles.deviceInfo}>
              <Text style={[styles.deviceName, { color: colors.text }]}>{device.name}</Text>
              <Text style={[styles.deviceStatus, { color: colors.textSecondary }]}>
                {isConnected
                  ? 'Connected'
                  : 'Not connected'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.connectButton,
                {
                  borderColor: isConnected ? colors.error : colors.primary,
                  backgroundColor: isConnected ? colors.error : 'transparent',
                  opacity: isBusy ? 0.7 : 1,
                },
              ]}
              onPress={() => {
                if (isBusy) return;
                if (isConnected) handleDisconnectDevice(device.id);
                else handleConnectDevice(device.id);
              }}
            >
              <Text
                style={[
                  styles.connectButtonText,
                  { color: isConnected ? colors.textInverse : colors.primary },
                ]}
              >
                {isBusy ? 'Please wait…' : isConnected ? 'Disconnect' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
          );
        })}
      </View>

      {healthData && (
          <>
            {healthData?.steps && Array.isArray(healthData.steps) && healthData.steps.length > 0 && (
              <View style={[styles.metricsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>Steps</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {typeof healthData.steps[0] === 'number' ? healthData.steps[0] : healthData.steps[0]?.steps || 0}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Goal: {typeof healthData.steps[0] === 'object' ? (healthData.steps[0]?.goal || '10,000') : '10,000'}
                </Text>
              </View>
            )}

            {healthData?.heartRate && Array.isArray(healthData.heartRate) && healthData.heartRate.length > 0 && (
                <View style={[styles.metricsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>Heart Rate</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {typeof healthData.heartRate[0] === 'number' ? healthData.heartRate[0] : healthData.heartRate[0]?.average || 0}
                    {' bpm'}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Resting: {typeof healthData.heartRate[0] === 'object' ? (healthData.heartRate[0]?.resting || 'N/A') : 'N/A'} bpm
                  </Text>
                </View>
              )}

            {healthData?.sleep && Array.isArray(healthData.sleep) && healthData.sleep.length > 0 && (
                <View style={[styles.metricsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>Sleep</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {typeof healthData.sleep[0] === 'number' ? healthData.sleep[0].toFixed(1) : (typeof healthData.sleep[0] === 'object' ? (healthData.sleep[0]?.duration / 60 || 0).toFixed(1) : '0')}
                    {' hours'}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Quality: {typeof healthData.sleep[0] === 'object' ? (healthData.sleep[0]?.quality || 'N/A') : 'N/A'}%
                  </Text>
                </View>
              )}
          </>
        )}

      {!healthData?.steps && !healthData?.heartRate && !healthData?.sleep && (
        <EmptyView title="No wearable data yet" subtitle="Connect a device to start syncing" />
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deviceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  deviceStatus: {
    fontSize: 12,
    color: '#999',
  },
  connectButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  connectButtonActive: {
    backgroundColor: '#007AFF',
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  connectButtonTextActive: {
    color: '#fff',
  },
  metricsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#999',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
