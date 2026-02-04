import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifySession } from '@/lib/auth-helpers';
import { getPremiumStatus } from '@/lib/entitlements';
import { withApiTelemetry } from '@/lib/api-telemetry';

export const dynamic = 'force-dynamic';

async function me(req: NextRequest) {
  try {
    const userId = await verifySession(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result[0];
    const premium = await getPremiumStatus(userId);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        isPremium: premium.isPremium,
        isAdmin: user.isAdmin,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        goals: user.goals,
        experienceLevel: user.experienceLevel,
      },
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

export const GET = withApiTelemetry(me, { name: 'v1.auth.me' })
