import { Platform } from 'react-native';

function normalizeApiBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return trimmed;

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : trimmed.includes('localhost') ||
        trimmed.startsWith('10.0.2.2') ||
        /^\d{1,3}(\.\d{1,3}){3}(?::\d+)?(?:\/.*)?$/.test(trimmed)
      ? `http://${trimmed}`
      : `https://${trimmed}`;

  if (withScheme.endsWith('/api')) return withScheme;
  if (withScheme.endsWith('/api/v1')) return withScheme.replace(/\/api\/v1$/, '/api');
  return `${withScheme}/api`;
}

// API configuration based on environment
const DEFAULT_DEV_API_URL =
  Platform.select({
    // Android Emulator uses special IP to reach host machine
    android: 'http://10.0.2.2:3000/api',
    // iOS Simulator + most dev setups
    default: 'http://localhost:3000/api',
  }) || 'http://localhost:3000/api';

const DEFAULT_PROD_API_URL = 'https://guidemecoach.com/api';

const ENV_PROD_API_URL = process.env.EXPO_PUBLIC_API_URL;
const ENV_DEV_API_URL = process.env.EXPO_PUBLIC_DEV_API_URL;

export const API_BASE_URL = __DEV__
  ? normalizeApiBaseUrl(ENV_DEV_API_URL || ENV_PROD_API_URL || DEFAULT_DEV_API_URL)
  : normalizeApiBaseUrl(ENV_PROD_API_URL || DEFAULT_PROD_API_URL);

const API_DEBUG = __DEV__ && process.env.EXPO_PUBLIC_API_DEBUG === 'true';

export const config = {
  apiUrl: API_BASE_URL,
  timeout: 60000, // 60 second timeout for mobile networks (increased from 30s)
  headers: {
    'Content-Type': 'application/json',
  },
  maxRetries: 3, // Retry failed requests up to 3 times
  retryDelay: 1000, // Initial retry delay in ms
  debug: API_DEBUG,
};

if (API_DEBUG) {
  console.log('📡 API Configuration:', {
    platform: Platform.OS,
    apiUrl: API_BASE_URL,
    isDev: __DEV__,
  });
}
