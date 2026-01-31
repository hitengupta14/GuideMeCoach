import { API_BASE_URL } from '../config/api';

/**
 * Network Diagnostics Utility
 * Helps identify connectivity and server issues
 */
export const networkDiagnostics = {
  async testConnection(): Promise<{
    isConnected: boolean;
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      console.log(`✅ Server is reachable. Latency: ${latency}ms`);
      return {
        isConnected: response.ok,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Cannot reach server after ${latency}ms:`, errorMsg);
      return {
        isConnected: false,
        latency,
        error: errorMsg,
      };
    }
  },

  async testAuthEndpoint(token: string): Promise<{
    isAuthorized: boolean;
    statusCode?: number;
    error?: string;
  }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Auth token is valid');
        return { isAuthorized: true, statusCode: response.status };
      } else {
        console.warn(`⚠️ Auth token rejected with status ${response.status}`);
        return {
          isAuthorized: false,
          statusCode: response.status,
          error: `Status ${response.status}`,
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Cannot test auth endpoint:', errorMsg);
      return {
        isAuthorized: false,
        error: errorMsg,
      };
    }
  },

  async testEndpoint(
    endpoint: string,
    token?: string
  ): Promise<{
    isReachable: boolean;
    statusCode?: number;
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;
      console.log(`✅ Endpoint ${endpoint} responded in ${latency}ms with status ${response.status}`);

      return {
        isReachable: response.ok,
        statusCode: response.status,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Endpoint ${endpoint} failed after ${latency}ms:`, errorMsg);
      return {
        isReachable: false,
        latency,
        error: errorMsg,
      };
    }
  },

  async runFullDiagnostics(token?: string): Promise<{
    server: Awaited<ReturnType<typeof this.testConnection>>;
    auth?: Awaited<ReturnType<typeof this.testAuthEndpoint>>;
    progressEndpoint?: Awaited<ReturnType<typeof this.testEndpoint>>;
    badgesEndpoint?: Awaited<ReturnType<typeof this.testEndpoint>>;
  }> {
    console.log('🔍 Starting network diagnostics...');

    const server = await this.testConnection();

    if (!server.isConnected) {
      console.error('Cannot proceed with diagnostics - server is unreachable');
      return { server };
    }

    let auth;
    if (token) {
      auth = await this.testAuthEndpoint(token);
    }

    const progressEndpoint = await this.testEndpoint('/analytics/progress?range=month', token);
    const badgesEndpoint = await this.testEndpoint('/badges/check', token);

    console.log('📊 Diagnostics complete:', {
      server,
      auth,
      progressEndpoint,
      badgesEndpoint,
    });

    return {
      server,
      auth,
      progressEndpoint,
      badgesEndpoint,
    };
  },
};
