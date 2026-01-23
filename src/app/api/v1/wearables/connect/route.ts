import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

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

    // In production: Store encrypted tokens in database
    // await db.insert(wearableConnections).values({...})

    return NextResponse.json({
      success: true,
      data: {
        provider,
        message: `${provider} connected successfully`,
        connectedAt: new Date().toISOString(),
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
