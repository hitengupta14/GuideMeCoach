import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { getJwtSecretKey } from '@/lib/jwt';
import { getPremiumStatus } from '@/lib/entitlements';
import { withApiTelemetry } from '@/lib/api-telemetry';
import { verifyPassword } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { authRateLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createRefreshToken } from '@/lib/refresh-token';
import { z } from 'zod';

async function login(req: NextRequest) {
  const JWT_SECRET = getJwtSecretKey();
  try {
    // Rate limiting
    const rateLimitResult = await authRateLimiter(req);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      );
    }

    const body = await req.json();
    const validated = loginSchema.parse(body);
    const { email, password } = validated;

    // Get user from database
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        passwordHash: users.passwordHash,
        emailVerified: users.emailVerified,
        isAdmin: users.isAdmin,
        adminRole: users.adminRole,
        status: users.status,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    const user = result[0];

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.status && user.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error:
            user.status === 'blocked'
              ? 'Your account is blocked. Please contact support.'
              : 'Your account is not active.',
          code:
            user.status === 'blocked'
              ? 'ACCOUNT_BLOCKED'
              : user.status === 'deleted'
                ? 'ACCOUNT_DELETED'
                : 'ACCOUNT_INACTIVE',
        },
        { status: 403 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please verify your email before logging in',
          code: 'EMAIL_NOT_VERIFIED',
          email: user.email,
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await new SignJWT({ 
      userId: user.id, 
      email: user.email,
      isAdmin: user.isAdmin,
      adminRole: user.adminRole,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET);

    // Update last login
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const userAgent = req.headers.get('user-agent') || undefined;
    const platform = req.headers.get('x-platform') || undefined;
    const deviceName = req.headers.get('x-device-name') || undefined;
    const appVersion = req.headers.get('x-app-version') || undefined;
    const ipAddress = req.ip || req.headers.get('x-forwarded-for') || undefined;

    const refreshToken = await createRefreshToken(
      user.id,
      { userAgent, platform, deviceName, appVersion },
      ipAddress
    );

    const premium = await getPremiumStatus(user.id);

    const response = NextResponse.json({
      success: true,
      data: {
        token,
        refreshToken: refreshToken.token,
        refreshTokenExpiresAt: refreshToken.expiresAt.toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isPremium: premium.isPremium,
          isAdmin: user.isAdmin,
          adminRole: user.adminRole,
        },
      },
    });
    
    // Also set cookie-based session for browser clients.
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
    response.cookies.set('refresh_token', refreshToken.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    logger.info('v1 login successful', { userId: user.id });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}

export const POST = withApiTelemetry(login, { name: 'v1.auth.login', includeUserId: false })
