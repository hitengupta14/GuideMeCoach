import { createNavigationContainerRef } from '@react-navigation/native';

export type RootStackParamList = Record<string, object | undefined>;

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    // @ts-ignore - navigation type mismatch with dynamic routes
    navigationRef.navigate(name, params);
  }
}
