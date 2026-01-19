import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import AuthStack from '@/navigation/AuthStack';
import AppStack from '@/navigation/AppStack';

const queryClient = new QueryClient();

export default function App() {
  const { token } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {token ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </QueryClientProvider>
  );
}
