import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useAuthStore } from '@/store/auth';
import AuthStack from '@/navigation/AuthStack';
import AppStack from '@/navigation/AppStack';
import { queryClient, queryPersister } from '@/lib/queryClient';
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner';
import { navigationRef } from '@/navigation/navigationRef';
import { addNotificationResponseListener, registerForPushNotificationsAsync } from '@/services/push-notifications';
import { useThemeStore } from '@/store/theme';
import { StatusBar } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
        if (screen) {
          navigationRef.isReady() && navigationRef.navigate(screen as never, data.params as never);
        }
      });
    };
    init();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [token]);

  const linking = {
    prefixes: ['guidemecoach://'],
    config: {
      screens: {
        Home: 'home',
        Exercises: 'exercises',
        Workouts: 'workouts',
        Planner: 'planner',
        Progress: 'progress',
        Nutrition: 'nutrition',
        Video: 'video',
        Wearables: 'wearables',
        Chat: 'chat',
        More: 'more',
      },
    },
  } as const;

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
          {token ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}
