import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useThemeStore } from '../../store/theme';
import { lightColors, darkColors } from '../../theme/colors';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/auth';

// Conditionally import Razorpay - only available in development builds
let RazorpayCheckout: any = null;
try {
  RazorpayCheckout = require('react-native-razorpay').default;
} catch (e) {
  // Razorpay not available - running in Expo Go
  console.log('Running in Expo Go - Razorpay not available');
}

type CheckoutRouteParams = {
  Checkout: {
    planId: 'premium' | 'premium-yearly';
  };
};

interface PlanDetails {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  period: string;
  features: string[];
  savings?: string;
}

const PLAN_DETAILS: Record<string, PlanDetails> = {
  premium: {
    id: 'premium',
    name: 'Premium Monthly',
    price: '₹249',
    priceValue: 24900, // in paise
    period: '/month',
    features: [
      'AI Workout Planner (2/month)',
      'AI Chat Support (25 messages/month)',
      'AI Weekly Insights (1/week)',
      'AI Plan Edits (3/month)',
      'Priority support',
      'Ad-free experience',
    ],
  },
  'premium-yearly': {
    id: 'premium-yearly',
    name: 'Premium Yearly',
    price: '₹2,490',
    priceValue: 249000, // in paise
    period: '/year',
    features: [
      'All Premium features included',
      'Priority support',
      'Early access to new features',
      'Save ₹3,478/year vs monthly',
    ],
    savings: 'Save 17% vs monthly',
  },
};

export default function CheckoutScreen() {
  const { theme } = useThemeStore();
  const colors = theme === 'dark' ? darkColors : lightColors;
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CheckoutRouteParams, 'Checkout'>>();
  const { user } = useAuthStore();

  const planId = route.params?.planId || 'premium';
  const plan = PLAN_DETAILS[planId];

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<'india' | 'international'>('india');

  useEffect(() => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to continue', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [user, navigation]);

  const handlePayment = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // Step 1: Create Razorpay order on backend
      const orderResponse: any = await apiClient.request('/api/v1/subscription/create', {
        method: 'POST',
        body: JSON.stringify({
          planType: planId,
          displayRegion: selectedRegion,
        }),
      });

      if (!orderResponse?.data) {
        throw new Error('Failed to create order');
      }

      const { orderId, amount, currency, keyId } = orderResponse.data;

      // Step 2: Check if Razorpay is available
      if (!RazorpayCheckout) {
        // DEMO MODE - Running in Expo Go
        Alert.alert(
          'Demo Mode',
          'Payment system is in demo mode (Expo Go). Install development build to test real payments.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setIsProcessing(false) },
            { 
              text: 'Simulate Success', 
              onPress: async () => {
                await handlePaymentSuccess({ razorpay_payment_id: 'demo_payment_' + Date.now() });
              }
            }
          ]
        );
        return;
      }

      // PRODUCTION CODE - Razorpay available
      // Step 2: Open Razorpay checkout
      const options = {
        description: plan.name,
        image: 'https://your-logo-url.com/logo.png', // TODO: Replace with your logo
        currency: currency,
        key: keyId,
        amount: amount.toString(),
        name: 'GuideMeCoach',
        order_id: orderId,
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
          name: user?.name || '',
        },
        theme: { color: '#667eea' },
      };

      const data = await RazorpayCheckout.open(options);

      // Step 3: Verify payment on backend
      await handlePaymentSuccess(data);
    } catch (error: any) {
      setIsProcessing(false);

      // Check if user cancelled  
      /* PRODUCTION CODE:
      if (error.code === RazorpayCheckout.PAYMENT_CANCELLED) {
        Alert.alert('Payment Cancelled', 'You cancelled the payment process');
        return;
      }
      */

      // Handle other errors
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Failed',
        error.description || error.message || 'Something went wrong. Please try again.'
      );
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // Verify payment signature on backend
      const verifyResponse: any = await apiClient.request(
        '/api/v1/subscription/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            razorpay_order_id: paymentData.razorpay_order_id,
            razorpay_payment_id: paymentData.razorpay_payment_id,
            razorpay_signature: paymentData.razorpay_signature,
          }),
        }
      );

      setIsProcessing(false);

      if (verifyResponse?.success) {
        // Show success message
        Alert.alert(
          '🎉 Success!',
          'Payment successful! You now have access to all premium features.',
          [
            {
              text: 'Start Using Premium',
              onPress: () => {
                // Navigate to dashboard or AI features
                navigation.reset({
                  index: 0,
                  // @ts-ignore
                  routes: [{ name: 'AppTabs' }],
                });
              },
            },
          ]
        );
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error: any) {
      setIsProcessing(false);
      console.error('Verification error:', error);
      Alert.alert(
        'Verification Failed',
        'Payment was successful but verification failed. Please contact support.'
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    planCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 2,
      borderColor: '#667eea',
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    planName: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    savingsBadge: {
      backgroundColor: '#10b981',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    savingsText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 16,
    },
    price: {
      fontSize: 36,
      fontWeight: '700',
      color: colors.text,
    },
    period: {
      fontSize: 16,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    featuresList: {
      marginTop: 12,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 12,
      flex: 1,
    },
    regionSelector: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 4,
      flexDirection: 'row',
    },
    regionButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    regionButtonActive: {
      backgroundColor: '#667eea',
    },
    regionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    regionButtonTextActive: {
      color: '#fff',
    },
    disclaimer: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 8,
    },
    trustBadges: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
    },
    trustBadge: {
      alignItems: 'center',
      flex: 1,
    },
    trustBadgeText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    paymentButton: {
      backgroundColor: '#667eea',
      borderRadius: 12,
      paddingVertical: 18,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    paymentButtonDisabled: {
      opacity: 0.6,
    },
    paymentButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
      marginLeft: 8,
    },
    secureText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    faqSection: {
      marginTop: 24,
    },
    faqItem: {
      marginBottom: 16,
    },
    faqQuestion: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    faqAnswer: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });

  if (!plan) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.text }}>Invalid plan selected</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Plan Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Selection</Text>
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              {plan.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{plan.savings}</Text>
                </View>
              )}
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.period}>{plan.period}</Text>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color="#10b981"
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Region Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Region</Text>
          <View style={styles.regionSelector}>
            <TouchableOpacity
              style={[
                styles.regionButton,
                selectedRegion === 'india' && styles.regionButtonActive,
              ]}
              onPress={() => setSelectedRegion('india')}
            >
              <Text
                style={[
                  styles.regionButtonText,
                  selectedRegion === 'india' && styles.regionButtonTextActive,
                ]}
              >
                🇮🇳 India
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.regionButton,
                selectedRegion === 'international' && styles.regionButtonActive,
              ]}
              onPress={() => setSelectedRegion('international')}
            >
              <Text
                style={[
                  styles.regionButtonText,
                  selectedRegion === 'international' && styles.regionButtonTextActive,
                ]}
              >
                🌍 International
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimer}>
            * Final pricing is determined by your payment method
          </Text>
        </View>

        {/* Trust Badges */}
        <View style={styles.section}>
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <MaterialCommunityIcons
                name="shield-check"
                size={32}
                color="#10b981"
              />
              <Text style={styles.trustBadgeText}>Secure Payment</Text>
            </View>
            <View style={styles.trustBadge}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={32}
                color="#10b981"
              />
              <Text style={styles.trustBadgeText}>7-Day Free Trial</Text>
            </View>
            <View style={styles.trustBadge}>
              <MaterialCommunityIcons name="close-circle" size={32} color="#10b981" />
              <Text style={styles.trustBadgeText}>Cancel Anytime</Text>
            </View>
          </View>
        </View>

        {/* Payment Button */}
        <TouchableOpacity
          style={[
            styles.paymentButton,
            isProcessing && styles.paymentButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="lock" size={24} color="#fff" />
              <Text style={styles.paymentButtonText}>Complete Payment</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.secureText}>
          🔒 Secured by Razorpay • 256-bit SSL Encryption
        </Text>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>When will I be charged?</Text>
            <Text style={styles.faqAnswer}>
              You get a 7-day free trial. Your first payment will be charged after the
              trial ends. You can cancel anytime during the trial.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What payment methods are accepted?</Text>
            <Text style={styles.faqAnswer}>
              We accept all major credit/debit cards, UPI, Net Banking, and popular
              wallets through Razorpay.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I cancel my subscription?</Text>
            <Text style={styles.faqAnswer}>
              Yes, you can cancel anytime from your profile settings. You'll retain
              access until the end of your billing period.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is my payment information secure?</Text>
            <Text style={styles.faqAnswer}>
              Absolutely. We use Razorpay's secure payment gateway with bank-level
              encryption. We never store your card details.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
