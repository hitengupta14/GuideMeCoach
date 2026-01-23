import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function LoadingView({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.centered}> 
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export function ErrorView({ message = 'Something went wrong' }: { message?: string }) {
  return (
    <View style={styles.centered}> 
      <MaterialCommunityIcons name="alert-circle" size={40} color="#c93434" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export function EmptyView({ title = 'No data', subtitle }: { title?: string; subtitle?: string }) {
  return (
    <View style={styles.centered}> 
      <MaterialCommunityIcons name="inbox" size={40} color="#999" />
      <Text style={styles.text}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    marginTop: 8,
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
  },
});
