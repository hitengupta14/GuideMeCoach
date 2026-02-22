import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth';
import { useGoogleAuth } from '../../services/google-auth';
import { useThemeStore } from '../../store/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { BrandMark } from '../../components/BrandMark';
import { spacing, typography } from '../../theme/spacing';

export default function SignupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const store = useAuthStore();
  const { signup, loginWithGoogle, isLoading, error } = store;
  const { promptAsync } = useGoogleAuth();
  const { theme, colors } = useThemeStore();
  const isDark = theme === 'dark';

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      const result = await signup(email, password, name);
      if (result?.requiresEmailVerification) {
        Alert.alert(
          'Verify your email',
          'We sent a verification link to your email. Please verify your email, then log in.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }
      // If signup logged you in, navigation will happen automatically via auth state change.
    } catch (err: any) {
      // Show the actual error message from the API
      const errorMessage = error || err.message || 'Failed to create account';
      Alert.alert('Signup Error', errorMessage);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        const id_token = (result as any)?.params?.id_token || (result as any)?.authentication?.idToken;
        if (id_token) {
          await loginWithGoogle(id_token);
        }
      } else if (result?.type === 'cancel') {
        console.log('Google sign-up cancelled');
      }
    } catch (error: any) {
      Alert.alert('Google Sign-Up Error', error.message || 'Failed to sign up with Google');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <BrandMark size={64} />
            <Text style={[styles.brandText, { color: colors.text }]}>GuideMeCoach</Text>
          </View>
          <View style={styles.hero}>
            <Text style={[typography.display2, { color: colors.text }]}>Create Account</Text>
            <Text style={[typography.body2, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              Join GuideMeCoach today
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Full Name"
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              isDark={isDark}
              disabled={isLoading}
            />
            <TextInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              isDark={isDark}
              disabled={isLoading}
            />
            <TextInput
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              isDark={isDark}
              disabled={isLoading}
            />
            <TextInput
              label="Confirm Password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              isDark={isDark}
              disabled={isLoading}
            />

            {error ? (
              <Text style={[typography.caption1, { color: colors.error, marginTop: spacing.sm }]}>
                {error}
              </Text>
            ) : null}

            <View style={{ marginTop: spacing.lg }}>
              <Button
                label={isLoading ? 'Creating Account…' : 'Sign Up'}
                onPress={handleSignup}
                loading={isLoading}
                disabled={isLoading}
                fullWidth
                isDark={isDark}
              />
            </View>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[typography.caption1, { color: colors.textTertiary }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Button
              label="Continue with Google"
              onPress={handleGoogleSignup}
              disabled={isLoading}
              variant="outline"
              fullWidth
              isDark={isDark}
              icon={<MaterialCommunityIcons name="google" size={18} color={colors.text} />}
            />

            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
              <Text style={[styles.link, { color: colors.textSecondary }]}>
                Already have an account?{' '}
                <Text style={[styles.linkBold, { color: colors.primary }]}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  brandText: { marginTop: spacing.sm, fontSize: 18, fontWeight: '700' },
  hero: { marginBottom: spacing['2xl'] },
  form: { gap: spacing.lg },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  link: { marginTop: spacing.lg, textAlign: 'center' },
  linkBold: { fontWeight: '700' },
});
