import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import AuthStack from '@/navigation/AuthStack';
import AppStack from '@/navigation/AppStack';
import OnboardingStack from '@/navigation/OnboardingStack';
import { queryClient, queryPersister } from '@/lib/queryClient';
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner';
import { navigationRef } from '@/navigation/navigationRef';
import { addNotificationResponseListener, registerForPushNotificationsAsync } from '@/services/push-notifications';
import { useThemeStore } from '@/store/theme';
import { StatusBar, AppState, View } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { apiClient } from '@/services/api';
import { LoadingView, ErrorView } from '@/components/State';
import { Button } from '@/components/Button';

export default function App() {
  const { token, user, bootstrap } = useAuthStore();
  const { theme, colors } = useThemeStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const init = async () => {
      if (token) {
        await registerForPushNotificationsAsync(user?.id);
      }
      unsubscribe = addNotificationResponseListener((response) => {
        const data: any = response.notification.request.content.data || {};
        const screen = data?.screen;
        const params = data?.params;
        if (!screen || !navigationRef.isReady()) return;

        // Route legacy screen names into the new 5-tab + MoreStack structure.
        const moreScreens = new Set([
          'Planner',
          'AIPlanner',
          'Plans',
          'PlanDetail',
          'Nutrition',
          'FormAnalysis',
          'Wearables',
          'ChatConversations',
          'Chat',
          'BodyMap',
          'MuscleExercises',
          'Favorites',
          'Achievements',
          'AiInsights',
          'Recovery',
          'FormFeedback',
          'Settings',
          'Tools',
          'Plans',
          'AIHub',
          'ProgressV2',
          'Pricing',
          'Checkout',
          'SubscriptionManagement',
          'Privacy',
          'Terms',
          'MedicalDisclaimer',
          'AdminHome',
          'AdminSystemHealth',
          'AdminExerciseApproval',
          'AdminExerciseEditor',
          'AdminActivityLogs',
          'AdminAiLogs',
          'AdminAnalytics',
          'AdminSettings',
        ]);

        const homeScreens = new Set(['Dashboard', 'Profile', 'Today']);
        const workoutScreens = new Set(['WorkoutLogger', 'WorkoutHistory', 'WorkoutSummary']);
        const exerciseScreens = new Set(['ExercisesList', 'ExerciseDetail']);
        const progressScreens = new Set(['ProgressMain']);

        if (moreScreens.has(screen)) {
          (navigationRef as any).navigate('More', { screen, params });
          return;
        }
        if (homeScreens.has(screen)) {
          (navigationRef as any).navigate('Home', { screen, params });
          return;
        }
        if (workoutScreens.has(screen)) {
          (navigationRef as any).navigate('Workouts', { screen, params });
          return;
        }
        if (exerciseScreens.has(screen)) {
          (navigationRef as any).navigate('Exercises', { screen, params });
          return;
        }
        if (progressScreens.has(screen)) {
          (navigationRef as any).navigate('Progress', { screen: 'ProgressMain', params });
          return;
        }

        // Fall back to direct navigation for top-level tabs.
        (navigationRef as any).navigate(screen, params);
      });
    };
    init();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [token, user?.id]);

  // App state listeners: pause/resume queries and lightweight refresh on foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        // Persist pending mutations (already handled by PersistQueryClientProvider)
      } else if (state === 'active') {
        // On resume, refetch key lists for freshness
        queryClient.invalidateQueries({ queryKey: ['exercises'] });
        queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
        queryClient.invalidateQueries({ queryKey: ['today'] });
        queryClient.invalidateQueries({ queryKey: ['plans'] });
        queryClient.invalidateQueries({ queryKey: ['achievements'] });
      }
    });
    return () => sub.remove();
  }, []);

  const linking: any = {
    prefixes: ['guidemecoach://'],
    config: {
      screens: {
        Home: {
          screens: {
            Dashboard: 'home',
            Today: 'today',
            Profile: 'profile',
          },
        },
        Workouts: {
          screens: {
            WorkoutLogger: 'workouts',
            WorkoutHistory: 'workouts/history',
            WorkoutSummary: 'workouts/summary/:sessionId',
          },
        },
        Exercises: {
          screens: {
            ExercisesList: 'exercises',
            ExerciseDetail: 'exercises/:id',
          },
        },
        Progress: {
          screens: {
            ProgressMain: 'progress',
          },
        },
        More: {
          screens: {
            MoreMenu: 'more',
            Planner: 'planner',
            AIPlanner: 'planner/ai',
            Plans: 'planner/history',
            PlanDetail: 'planner/view/:planId',
            Nutrition: 'nutrition',
            FormAnalysis: 'form-analysis',
            Wearables: 'wearables',
            ChatConversations: 'chat',
            Chat: 'chat/thread',
            BodyMap: 'body-map',
            MuscleExercises: 'body-map/muscle',
            Favorites: 'favorites',
            Achievements: 'achievements',
            AiInsights: 'ai-insights',
            Recovery: 'recovery',
            FormFeedback: 'form-feedback',
            Settings: 'settings',
            Tools: 'tools',
            AIHub: 'ai-hub',
            ProgressV2: 'progress-v2',
            Pricing: 'pricing',
            Checkout: 'checkout',
            SubscriptionManagement: 'subscription',
            Privacy: 'privacy',
            Terms: 'terms',
            MedicalDisclaimer: 'medical-disclaimer',
            AdminHome: 'admin',
            AdminSystemHealth: 'admin/health',
            AdminExerciseApproval: 'admin/exercises',
            AdminExerciseEditor: 'admin/exercises/:exerciseId',
            AdminActivityLogs: 'admin/activity',
            AdminAiLogs: 'admin/ai-logs',
            AdminAnalytics: 'admin/analytics',
            AdminSettings: 'admin/settings',
          },
        },
      },
    },
  };

  const navTheme = {
    dark: theme === 'dark',
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  } as const;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: queryPersister,
            maxAge: 1000 * 60 * 60 * 24, // 24h
          }}
        >
          <NetworkStatusBanner />
          <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
          <NavigationContainer linking={linking} ref={navigationRef} theme={navTheme as any}>
            {token ? <ProfileGate /> : <AuthStack />}
          </NavigationContainer>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function ProfileGate() {
  const token = useAuthStore((s) => s.token);
  const { colors, theme } = useThemeStore();
  const isDark = theme === 'dark';
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile-completion', token],
    enabled: Boolean(token),
    queryFn: () => apiClient.getProfileCompletion(),
    staleTime: 60 * 1000,
  });

  if (isLoading || isFetching) {
    return <LoadingView message="Preparing your profile…" />;
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ErrorView message="Couldn't load your profile status." />
        <View style={{ paddingHorizontal: 24 }}>
          <Button label="Retry" onPress={() => refetch()} fullWidth isDark={isDark} />
        </View>
      </View>
    );
  }

  const completion = data?.completion;
  const isComplete = completion ? completion.completed === completion.total : false;

  return isComplete ? <AppStack /> : <OnboardingStack />;
}
