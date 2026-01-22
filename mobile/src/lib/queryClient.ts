import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  QueryClient,
  focusManager,
  onlineManager,
  defaultShouldDehydrateQuery,
} from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// Shared QueryClient instance with sensible defaults for mobile
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // keep cached data around for a day
    },
    mutations: {
      retry: 1,
    },
  },
});

// Persist queries to AsyncStorage so data survives app restarts/offline
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'gm-query-cache',
  throttleTime: 1000,
  serialize: (data) => JSON.stringify(data),
  deserialize: (cached) => JSON.parse(cached),
});

// Wire React Query to device connectivity
onlineManager.setEventListener((setOnline) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
  return () => unsubscribe();
});

// Wire React Query focus handling to AppState
focusManager.setEventListener((handleFocus) => {
  const onChange = (status: AppStateStatus) => {
    handleFocus(status === 'active');
  };
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
});
