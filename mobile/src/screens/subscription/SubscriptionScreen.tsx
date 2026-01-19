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
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';

export default function SubscriptionScreen() {
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => apiClient.getSubscriptionStatus(),
  });

  const plans = [
    {
      name: 'Basic',
      price: '$9.99',
      features: ['Core exercises', 'Basic progress tracking'],
    },
    {
      name: 'Pro',
      price: '$19.99',
      features: [
        'All core features',
        'Video form analysis',
        'AI coaching',
        'Wearable integration',
      ],
    },
    {
      name: 'Elite',
      price: '$49.99',
      features: [
        'Everything in Pro',
        '1-on-1 coaching',
        'Custom meal plans',
        'Priority support',
      ],
    },
  ];

  const handleUpgrade = (plan: string) => {
    Alert.alert('Upgrade', `Upgrading to ${plan} plan...`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="crown" size={40} color="#FFB800" />
        <Text style={styles.title}>Premium Plans</Text>
        <Text style={styles.subtitle}>Unlock advanced features</Text>
      </View>

      {subscription?.data?.status === 'active' && (
        <View style={styles.currentPlan}>
          <Text style={styles.currentPlanLabel}>Current Plan</Text>
          <Text style={styles.currentPlanName}>
            {subscription.data.planName}
          </Text>
          <Text style={styles.currentPlanExpiry}>
            Renews on{' '}
            {new Date(subscription.data.currentPeriodEnd).toLocaleDateString()}
          </Text>
        </View>
      )}

      <View style={styles.plansContainer}>
        {plans.map((plan: any, idx: number) => (
          <View key={idx} style={styles.planCard}>
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.period}>/month</Text>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature: string, featureIdx: number) => (
                <View key={featureIdx} style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color="#34C759"
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.selectButton,
                subscription?.data?.plan === plan.name.toLowerCase() &&
                  styles.selectButtonActive,
              ]}
              onPress={() => handleUpgrade(plan.name)}
            >
              <Text
                style={[
                  styles.selectButtonText,
                  subscription?.data?.plan === plan.name.toLowerCase() &&
                    styles.selectButtonTextActive,
                ]}
              >
                {subscription?.data?.plan === plan.name.toLowerCase()
                  ? 'Current Plan'
                  : 'Select'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.info}>
        <MaterialCommunityIcons
          name="information"
          size={16}
          color="#007AFF"
        />
        <Text style={styles.infoText}>
          Cancel anytime. No commitment required.
        </Text>
      </View>
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
  currentPlan: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  currentPlanLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  currentPlanExpiry: {
    fontSize: 12,
    color: '#666',
  },
  plansContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  period: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  selectButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectButtonActive: {
    backgroundColor: '#007AFF',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  selectButtonTextActive: {
    color: '#fff',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
});
