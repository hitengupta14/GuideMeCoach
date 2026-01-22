import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function NetworkStatusBanner() {
  const netInfo = useNetInfo();
  const offline = !netInfo.isConnected || netInfo.isInternetReachable === false;

  if (!offline) return null;

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="wifi-off" size={16} color="#fff" />
      <Text style={styles.text}>Offline mode. Changes will sync when back online.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#c93434',
  },
  text: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 13,
  },
});
