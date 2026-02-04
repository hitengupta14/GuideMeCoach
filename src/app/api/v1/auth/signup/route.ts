import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withApiTelemetry } from '@/lib/api-telemetry';
import { signupSchema } from '@/lib/validations';
import { authRateLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { hashPassword } from '@/lib/auth';
import { sendEmail, getVerificationEmailHtml } from '@/lib/email';
import { z } from 'zod';
import crypto from 'crypto';

async function signup(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await authRateLimiter(req);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many signup attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      );
    }

    const body = await req.json();
    const validated = signupSchema.parse(body);
    const { email, password, name } = validated;

    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const newUser = await db.insert(users).values({
      email: email.toLowerCase(),
      name: name.trim(),
      passwordHash,
      emailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: tokenExpiry,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    const createdUser = newUser[0];

    // Send verification email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { html, text } = getVerificationEmailHtml(verificationToken, appUrl);

    await sendEmail({
      to: createdUser.email,
      subject: 'Verify Your Email - GuideMeCoach',
      html,
      text,
    });

    logger.info('v1 signup successful', { userId: createdUser.id });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
          emailVerified: false,
        },
      },
    });
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

    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Signup failed' },
      { status: 500 }
    );
  }
}

export const POST = withApiTelemetry(signup, { name: 'v1.auth.signup', includeUserId: false })
