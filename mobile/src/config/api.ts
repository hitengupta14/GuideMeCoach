import { Platform } from 'react-native';

// Your computer's local IP address
const LOCAL_IP = '192.168.29.189';

// API configuration based on environment
export const API_BASE_URL = __DEV__
  ? Platform.select({
      // iOS Simulator needs your computer's local IP
      ios: `http://${LOCAL_IP}:3000/api/v1`,
      // Android Emulator uses special IP to reach host machine
      android: 'http://10.0.2.2:3000/api/v1',
      // Fallback for other platforms
      default: 'http://localhost:3000/api/v1',
    })
  : 'https://your-production-api.com/api/v1'; // TODO: Replace with production URL

export const config = {
  apiUrl: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
};

console.log('📡 API Configuration:', {
  platform: Platform.OS,
  apiUrl: API_BASE_URL,
  isDev: __DEV__,
});
