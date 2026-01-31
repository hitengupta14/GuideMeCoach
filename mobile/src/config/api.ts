import { Platform } from 'react-native';

// Your computer's local IP address
const LOCAL_IP = '192.168.29.154';

// API configuration based on environment
export const API_BASE_URL = __DEV__
  ? Platform.select({
      // iOS Simulator needs your computer's local IP
      ios: `http://${LOCAL_IP}:3000/api`,
      // Android Emulator uses special IP to reach host machine
      android: 'http://10.0.2.2:3000/api',
      // Fallback for other platforms
      default: 'http://localhost:3000/api',
    })
  : 'https://your-production-api.com/api'; // TODO: Replace with production URL

export const config = {
  apiUrl: API_BASE_URL,
  timeout: 60000, // 60 second timeout for mobile networks (increased from 30s)
  headers: {
    'Content-Type': 'application/json',
  },
  maxRetries: 3, // Retry failed requests up to 3 times
  retryDelay: 1000, // Initial retry delay in ms
};

console.log('📡 API Configuration:', {
  platform: Platform.OS,
  apiUrl: API_BASE_URL,
  isDev: __DEV__,
});
