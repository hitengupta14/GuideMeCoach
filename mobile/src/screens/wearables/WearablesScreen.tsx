import React, { useEffect, useState } from 'react';
import { useThemeStore } from '../../store/theme';
import { lightColors, darkColors } from '../../theme/colors';
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
import { apiClient } from '../../services/api';
import { LoadingView, ErrorView, EmptyView } from '../../components/State';

export default function WearablesScreen() {
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);

  const { data: wearableData, isLoading, error } = useQuery({
    queryKey: ['wearableData'],
    queryFn: () => apiClient.getWearableData(7),
  });

  // API returns { steps: [], heartRate: [], sleep: [] }
  const healthData = (wearableData as any) || {};

  const handleConnectDevice = async (provider: string) => {
    try {
      const response = await apiClient.connectWearable(provider);
      if (response.success) {
        setConnectedDevices([...connectedDevices, provider]);
        Alert.alert('Success', `${provider} connected!`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect device');
    }
  };

  const devices = [
    { name: 'Apple HealthKit', id: 'apple-health', icon: 'apple' },
    { name: 'Fitbit', id: 'fitbit', icon: 'heart-pulse' },
    { name: 'Google Fit', id: 'google-fit', icon: 'google' },
  ];

  if (isLoading) {
    return <LoadingView message="Loading health data" />;
  }

  if (error) {
    return <ErrorView message="Failed to load health data" />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="heart-pulse" size={40} color="#FF3B30" />
        <Text style={styles.title}>Health Data</Text>
        <Text style={styles.subtitle}>Connect your wearable devices</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Devices</Text>
        {devices.map((device: any) => (
          <View key={device.id} style={styles.deviceCard}>
            <MaterialCommunityIcons
              name={device.icon}
              size={24}
              color="#007AFF"
            />
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceStatus}>
                {connectedDevices.includes(device.id)
                  ? 'Connected'
                  : 'Not connected'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.connectButton,
                connectedDevices.includes(device.id) &&
                  styles.connectButtonActive,
              ]}
              onPress={() => handleConnectDevice(device.id)}
            >
              <Text
                style={[
                  styles.connectButtonText,
                  connectedDevices.includes(device.id) &&
                    styles.connectButtonTextActive,
                ]}
              >
                {connectedDevices.includes(device.id) ? 'Connected' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {healthData && (
          <>
            {healthData?.steps && Array.isArray(healthData.steps) && healthData.steps.length > 0 && (
              <View style={styles.metricsCard}>
                <Text style={styles.metricTitle}>Steps</Text>
                <Text style={styles.metricValue}>
                  {typeof healthData.steps[0] === 'number' ? healthData.steps[0] : healthData.steps[0]?.steps || 0}
                </Text>
                <Text style={styles.metricLabel}>
                  Goal: {typeof healthData.steps[0] === 'object' ? (healthData.steps[0]?.goal || '10,000') : '10,000'}
                </Text>
              </View>
            )}

            {healthData?.heartRate && Array.isArray(healthData.heartRate) && healthData.heartRate.length > 0 && (
                <View style={styles.metricsCard}>
                  <Text style={styles.metricTitle}>Heart Rate</Text>
                  <Text style={styles.metricValue}>
                    {typeof healthData.heartRate[0] === 'number' ? healthData.heartRate[0] : healthData.heartRate[0]?.average || 0}
                    {' bpm'}
                  </Text>
                  <Text style={styles.metricLabel}>
                    Resting: {typeof healthData.heartRate[0] === 'object' ? (healthData.heartRate[0]?.resting || 'N/A') : 'N/A'} bpm
                  </Text>
                </View>
              )}

            {healthData?.sleep && Array.isArray(healthData.sleep) && healthData.sleep.length > 0 && (
                <View style={styles.metricsCard}>
                  <Text style={styles.metricTitle}>Sleep</Text>
                  <Text style={styles.metricValue}>
                    {typeof healthData.sleep[0] === 'number' ? healthData.sleep[0].toFixed(1) : (typeof healthData.sleep[0] === 'object' ? (healthData.sleep[0]?.duration / 60 || 0).toFixed(1) : '0')}
                    {' hours'}
                  </Text>
                  <Text style={styles.metricLabel}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  deviceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
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
