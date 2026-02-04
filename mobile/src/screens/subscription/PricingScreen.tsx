import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/theme';
import { lightColors, darkColors } from '../../theme/colors';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  savings?: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      'Browse 500+ exercises',
      'Log workouts',
      'Track progress',
      'View statistics',
      'No AI features',
    ],
    highlighted: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹299',
    period: '/month',
    description: 'AI-powered personalization',
    features: [
      'All Free features',
      'AI Workout Planner (2/month)',
      'AI Chat Support (25 messages/month)',
      'AI Weekly Insights (1/week)',
      'AI Plan Edits (3/month)',
      'Priority support',
      'Ad-free experience',
    ],
    highlighted: true,
  },
  {
    id: 'premium-yearly',
    name: 'Premium Yearly',
    price: '₹2,499',
    period: '/year',
    description: 'Best value - save up to 30%',
    features: [
      'All Premium features',
      'All AI features included',
      'Priority support',
      'Early access to new features',
      'Save ₹1,089/year vs monthly',
    ],
    highlighted: false,
    savings: 'Save 30%',
  },
];

export default function PricingScreen() {
  const { theme } = useThemeStore();
  const colors = theme === 'dark' ? darkColors : lightColors;
  const navigation = useNavigation();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.id === 'free') {
      Alert.alert('Current Plan', 'You are already on the Free plan');
      return;
    }

    // Navigate to checkout
    // @ts-ignore - navigation type mismatch with dynamic routes
    navigation.navigate('Checkout', { planId: plan.id });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
    },
    header: {
      marginBottom: 32,
      alignItems: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    billingToggle: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 4,
      alignSelf: 'center',
      marginBottom: 12,
    },
    toggleButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      minWidth: 100,
      alignItems: 'center',
    },
    toggleButtonActive: {
      backgroundColor: colors.primary,
    },
    toggleButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    toggleButtonTextActive: {
      color: '#FFFFFF',
    },
    savingsBadge: {
      backgroundColor: '#D1FAE5',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignSelf: 'center',
      marginBottom: 24,
    },
    savingsBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#065F46',
    },
    planCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    planCardHighlighted: {
      borderColor: colors.primary,
      transform: [{ scale: 1.02 }],
    },
    popularBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    popularBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    planName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    planDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      minHeight: 40,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 16,
    },
    price: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.text,
    },
    period: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    ctaButton: {
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 20,
    },
    ctaButtonHighlighted: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    ctaButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    ctaButtonTextHighlighted: {
      color: '#FFFFFF',
    },
    featuresList: {
      gap: 12,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    featureIcon: {
      marginTop: 2,
    },
    featureText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    faqSection: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
    },
    faqTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    faqItem: {
      marginBottom: 20,
    },
    faqQuestion: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    faqAnswer: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    contactLink: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  });

  const displayedPlans = billingPeriod === 'monthly'
    ? PRICING_PLANS.filter(p => p.id !== 'premium-yearly')
    : PRICING_PLANS.filter(p => p.id === 'free' || p.id === 'premium-yearly');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Simple, Transparent Pricing</Text>
          <Text style={styles.subtitle}>
            Unlock AI-powered workout planning and personalized guidance
          </Text>

          {/* Billing Toggle */}
          <View style={styles.billingToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                billingPeriod === 'monthly' && styles.toggleButtonActive,
              ]}
              onPress={() => setBillingPeriod('monthly')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  billingPeriod === 'monthly' && styles.toggleButtonTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                billingPeriod === 'yearly' && styles.toggleButtonActive,
              ]}
              onPress={() => setBillingPeriod('yearly')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  billingPeriod === 'yearly' && styles.toggleButtonTextActive,
                ]}
              >
                Yearly
              </Text>
            </TouchableOpacity>
          </View>

          {billingPeriod === 'yearly' && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>Save 17%</Text>
            </View>
          )}
        </View>

        {/* Pricing Cards */}
        {displayedPlans.map((plan) => (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              plan.highlighted && styles.planCardHighlighted,
            ]}
          >
            {plan.highlighted && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Most Popular</Text>
              </View>
            )}

            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planDescription}>{plan.description}</Text>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.period}>{plan.period}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.ctaButton,
                plan.highlighted && styles.ctaButtonHighlighted,
              ]}
              onPress={() => handleSelectPlan(plan)}
            >
              <Text
                style={[
                  styles.ctaButtonText,
                  plan.highlighted && styles.ctaButtonTextHighlighted,
                ]}
              >
                {plan.id === 'free' ? 'Current Plan' : 'Start Free Trial'}
              </Text>
            </TouchableOpacity>

            <View style={styles.featuresList}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color="#10B981"
                    style={styles.featureIcon}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I cancel anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes! Cancel your subscription anytime without penalties. No long-term contracts.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Do you offer refunds?</Text>
            <Text style={styles.faqAnswer}>
              We offer a 7-day money-back guarantee if you're not satisfied.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I upgrade/downgrade?</Text>
            <Text style={styles.faqAnswer}>
              Yes, change your plan anytime. We'll prorate charges fairly.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is there a free trial?</Text>
            <Text style={styles.faqAnswer}>
              Get 7 days free when you upgrade to Premium. No credit card required to start.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Questions? We're here to help.</Text>
          <TouchableOpacity>
            <Text style={styles.contactLink}>
              Contact our support team →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
