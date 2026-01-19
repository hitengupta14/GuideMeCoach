/**
 * Wearables Sync Service
 * Handles syncing health data from various wearable devices
 */

export interface WearableProvider {
  name: string;
  id: 'apple-health' | 'fitbit' | 'google-fit';
}

export interface HealthMetric {
  timestamp: Date;
  value: number;
  unit: string;
  source: string;
}

export interface SyncResult {
  provider: string;
  success: boolean;
  itemsSynced: number;
  lastSync: Date;
  nextSync?: Date;
  error?: string;
}

class WearablesSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Initialize sync service
   */
  public startAutoSync(userId: string, token: string) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Initial sync
    this.syncAllProviders(userId, token);

    // Schedule periodic syncs
    this.syncInterval = setInterval(() => {
      this.syncAllProviders(userId, token);
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * Stop auto sync
   */
  public stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all connected wearables
   */
  private async syncAllProviders(userId: string, token: string): Promise<void> {
    try {
      const providers: WearableProvider[] = [
        { name: 'Apple HealthKit', id: 'apple-health' },
        { name: 'Fitbit', id: 'fitbit' },
        { name: 'Google Fit', id: 'google-fit' },
      ];

      for (const provider of providers) {
        try {
          await this.syncProvider(userId, token, provider.id);
        } catch (error) {
          console.error(`Failed to sync ${provider.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error syncing wearables:', error);
    }
  }

  /**
   * Sync specific provider
   */
  private async syncProvider(
    userId: string,
    token: string,
    provider: 'apple-health' | 'fitbit' | 'google-fit'
  ): Promise<SyncResult> {
    const now = new Date();

    switch (provider) {
      case 'apple-health':
        return this.syncAppleHealth(userId, token);
      case 'fitbit':
        return this.syncFitbit(userId, token);
      case 'google-fit':
        return this.syncGoogleFit(userId, token);
      default:
        return {
          provider,
          success: false,
          itemsSynced: 0,
          lastSync: now,
          error: 'Unknown provider',
        };
    }
  }

  /**
   * Sync Apple HealthKit data
   */
  private async syncAppleHealth(userId: string, token: string): Promise<SyncResult> {
    const now = new Date();

    try {
      // This would be called from iOS native code via a bridge
      // For now, returning mock sync result
      return {
        provider: 'apple-health',
        success: true,
        itemsSynced: 0,
        lastSync: now,
        nextSync: new Date(now.getTime() + this.SYNC_INTERVAL_MS),
      };
    } catch (error) {
      return {
        provider: 'apple-health',
        success: false,
        itemsSynced: 0,
        lastSync: now,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync Fitbit data
   */
  private async syncFitbit(userId: string, token: string): Promise<SyncResult> {
    const now = new Date();

    try {
      const response = await fetch(
        `https://api.fitbit.com/1/user/-/activities/date/${this.formatDate(
          new Date(now.getTime() - 24 * 60 * 60 * 1000)
        )}.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Fitbit API error: ${response.status}`);
      }

      const data = await response.json();

      // Process and store data
      // In production: Send to backend to store in database
      const itemsCount = this.extractFitbitMetrics(data).length;

      return {
        provider: 'fitbit',
        success: true,
        itemsSynced: itemsCount,
        lastSync: now,
        nextSync: new Date(now.getTime() + this.SYNC_INTERVAL_MS),
      };
    } catch (error) {
      return {
        provider: 'fitbit',
        success: false,
        itemsSynced: 0,
        lastSync: now,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync Google Fit data
   */
  private async syncGoogleFit(userId: string, token: string): Promise<SyncResult> {
    const now = new Date();

    try {
      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: 'com.google.step_count.delta',
              dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
            },
            {
              dataTypeName: 'com.google.heart_rate.bpm',
            },
            {
              dataTypeName: 'com.google.calories.expended',
            },
          ],
          bucketByTime: { durationMillis: 3600000 }, // 1 hour buckets
          startTimeMillis: now.getTime() - 24 * 60 * 60 * 1000,
          endTimeMillis: now.getTime(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Fit API error: ${response.status}`);
      }

      const data = await response.json();
      const itemsCount = this.extractGoogleFitMetrics(data).length;

      return {
        provider: 'google-fit',
        success: true,
        itemsSynced: itemsCount,
        lastSync: now,
        nextSync: new Date(now.getTime() + this.SYNC_INTERVAL_MS),
      };
    } catch (error) {
      return {
        provider: 'google-fit',
        success: false,
        itemsSynced: 0,
        lastSync: now,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Extract metrics from Fitbit data
   */
  private extractFitbitMetrics(data: any): HealthMetric[] {
    const metrics: HealthMetric[] = [];

    // Extract steps
    if (data.activities) {
      for (const activity of data.activities) {
        if (activity.steps) {
          metrics.push({
            timestamp: new Date(activity.dateTime),
            value: activity.steps,
            unit: 'steps',
            source: 'fitbit',
          });
        }
      }
    }

    // Extract heart rate
    if (data.activities_heart) {
      for (const hr of data.activities_heart) {
        if (hr.value?.restingHeartRate) {
          metrics.push({
            timestamp: new Date(hr.dateTime),
            value: hr.value.restingHeartRate,
            unit: 'bpm',
            source: 'fitbit',
          });
        }
      }
    }

    return metrics;
  }

  /**
   * Extract metrics from Google Fit data
   */
  private extractGoogleFitMetrics(data: any): HealthMetric[] {
    const metrics: HealthMetric[] = [];

    if (data.bucket) {
      for (const bucket of data.bucket) {
        const timestamp = new Date(parseInt(bucket.startTimeMillis));

        for (const dataset of bucket.dataset) {
          for (const point of dataset.point) {
            if (point.value && point.value.length > 0) {
              const value = point.value[0].intVal || point.value[0].fpVal || 0;

              metrics.push({
                timestamp,
                value,
                unit: 'unknown',
                source: 'google-fit',
              });
            }
          }
        }
      }
    }

    return metrics;
  }

  /**
   * Format date for API calls
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

export const wearablesSyncService = new WearablesSyncService();

export default wearablesSyncService;
