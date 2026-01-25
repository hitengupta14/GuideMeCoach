import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email));
    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.insert(users).values({
      email,
      name: name || email.split('@')[0],
      passwordHash,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    const createdUser = newUser[0];

    // Generate JWT token
    const token = await new SignJWT({
      userId: createdUser.id,
      email: createdUser.email,
      isAdmin: createdUser.isAdmin,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
          isPremium: createdUser.isPremium,
          isAdmin: createdUser.isAdmin,
        },
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Signup failed' },
      { status: 500 }
    );
  }
}
