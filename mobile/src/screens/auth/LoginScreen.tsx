import React, { useEffect, useState } from 'react';
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
import { spacing, typography } from '../../theme/spacing';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const store = useAuthStore();
  const { login, loginWithGoogle, isLoading, error } = store;
  const { promptAsync } = useGoogleAuth();
  const { theme, colors } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    // Handle async Google auth response (if coming from another flow)
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
    } catch (err: any) {
      const errorMessage = error || err.message || 'Failed to login';
      Alert.alert('Login Error', errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        const id_token = (result as any)?.params?.id_token || (result as any)?.authentication?.idToken;
        if (id_token) {
          await loginWithGoogle(id_token);
        }
      } else if (result?.type === 'cancel') {
        console.log('Google sign-in cancelled');
      }
    } catch (error: any) {
      Alert.alert('Google Sign-In Error', error.message || 'Failed to sign in with Google');
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
          <View style={styles.hero}>
            <Text style={[typography.display2, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[typography.body2, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              Sign in to continue
            </Text>
          </View>

          <View style={styles.form}>
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
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
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
                label={isLoading ? 'Signing In…' : 'Sign In'}
                onPress={handleLogin}
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
              onPress={handleGoogleLogin}
              disabled={isLoading}
              variant="outline"
              fullWidth
              isDark={isDark}
              icon={<MaterialCommunityIcons name="google" size={18} color={colors.text} />}
            />

            <TouchableOpacity onPress={() => navigation.navigate('Signup')} disabled={isLoading}>
              <Text style={[styles.link, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
                <Text style={[styles.linkBold, { color: colors.primary }]}>Sign Up</Text>
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
