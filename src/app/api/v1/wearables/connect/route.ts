import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth-helpers';
import { db } from '@/db'
import { wearableConnections } from '@/db/schema-mobile'
import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    // This endpoint is currently a placeholder (does not persist tokens).
    // Gate it in production until the storage + sync pipeline is implemented.
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_WEARABLES !== 'true') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const userId = await verifySession(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { provider, authCode, refreshToken } = await req.json();

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider required' },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ['apple-health', 'fitbit', 'google-fit'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { success: false, error: 'Invalid provider' },
        { status: 400 }
      );
    }

    let processedTokens: any = {};

    switch (provider) {
      case 'apple-health':
        // Apple HealthKit - handled on mobile app
        // App sends user authorization directly
        processedTokens = {
          status: 'authorized',
          provider: 'apple-health',
        };
        break;

      case 'fitbit':
        if (!authCode) {
          // Generate Fitbit OAuth URL for mobile
          const fitbitOAuthUrl = generateFitbitOAuthUrl();
          return NextResponse.json({
            success: true,
            data: {
              authUrl: fitbitOAuthUrl,
              message: 'Open this URL in your browser',
            },
          });
        }

        // Exchange auth code for access token
        const fitbitResponse = await fetch('https://api.fitbit.com/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: process.env.FITBIT_REDIRECT_URI || 'http://localhost:3000/wearables/fitbit',
            client_id: process.env.FITBIT_CLIENT_ID || '',
            client_secret: process.env.FITBIT_CLIENT_SECRET || '',
          }),
        });

        if (!fitbitResponse.ok) {
          throw new Error('Fitbit OAuth failed');
        }

        processedTokens = await fitbitResponse.json();
        break;

      case 'google-fit':
        if (!authCode) {
          // Generate Google OAuth URL for mobile
          const googleOAuthUrl = generateGoogleOAuthUrl();
          return NextResponse.json({
            success: true,
            data: {
              authUrl: googleOAuthUrl,
              message: 'Open this URL in your browser',
            },
          });
        }

        // Exchange auth code for access token
        const googleResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/wearables/google',
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          }),
        });

        if (!googleResponse.ok) {
          throw new Error('Google OAuth failed');
        }

        processedTokens = await googleResponse.json();
        break;
    }

    const now = new Date()

    const accessToken =
      provider === 'apple-health'
        ? (typeof refreshToken === 'string' && refreshToken.length > 0 ? refreshToken : randomUUID())
        : typeof processedTokens?.access_token === 'string'
          ? processedTokens.access_token
          : typeof processedTokens?.accessToken === 'string'
            ? processedTokens.accessToken
            : null

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Provider did not return an access token' },
        { status: 502 }
      )
    }

    const providerRefreshToken =
      typeof processedTokens?.refresh_token === 'string'
        ? processedTokens.refresh_token
        : typeof processedTokens?.refreshToken === 'string'
          ? processedTokens.refreshToken
          : typeof refreshToken === 'string'
            ? refreshToken
            : undefined

    const expiresIn =
      typeof processedTokens?.expires_in === 'number'
        ? processedTokens.expires_in
        : typeof processedTokens?.expires_in === 'string'
          ? Number(processedTokens.expires_in)
          : undefined

    const expiresAt =
      typeof expiresIn === 'number' && Number.isFinite(expiresIn)
        ? new Date(Date.now() + expiresIn * 1000)
        : null

    // Keep only one active connection per user/provider.
    await db
      .update(wearableConnections)
      .set({ isActive: 'false', updatedAt: now })
      .where(
        and(
          eq(wearableConnections.userId, userId),
          eq(wearableConnections.provider, provider),
          eq(wearableConnections.isActive, 'true')
        )
      )

    const [connection] = await db
      .insert(wearableConnections)
      .values({
        userId,
        provider,
        accessToken,
        refreshToken: providerRefreshToken,
        expiresAt,
        connectedAt: now,
        lastSyncedAt: null,
        isActive: 'true',
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: wearableConnections.id,
        provider: wearableConnections.provider,
        connectedAt: wearableConnections.connectedAt,
        expiresAt: wearableConnections.expiresAt,
      })

    return NextResponse.json({
      success: true,
      data: {
        provider,
        message: `${provider} connected successfully`,
        connectedAt: (connection?.connectedAt ? new Date(connection.connectedAt) : now).toISOString(),
        connectionId: connection?.id,
        expiresAt: connection?.expiresAt ? new Date(connection.expiresAt).toISOString() : null,
      },
    });
  } catch (error) {
    console.error('Wearable connection error:', error);
    return NextResponse.json(
      { success: false, error: 'Connection failed' },
      { status: 500 }
    );
  }
}

function generateFitbitOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.FITBIT_CLIENT_ID || '',
    response_type: 'code',
    redirect_uri: process.env.FITBIT_REDIRECT_URI || 'http://localhost:3000/wearables/fitbit',
    scope: 'activity heartrate sleep nutrition',
  });
  return `https://www.fitbit.com/oauth2/authorize?${params}`;
}

function generateGoogleOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/wearables/google',
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read',
    access_type: 'offline',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
