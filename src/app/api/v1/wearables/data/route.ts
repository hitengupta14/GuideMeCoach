import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Placeholder data endpoint. Gate in production until real wearable storage exists.
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

    const days = req.nextUrl.searchParams.get('days') || '7';
    const provider = req.nextUrl.searchParams.get('provider');

    // In production: Fetch from database and wearable APIs
    // For now, returning mock data

    const mockData = {
      heartRate: generateMockHeartRateData(parseInt(days)),
      steps: generateMockStepsData(parseInt(days)),
      calories: generateMockCaloriesData(parseInt(days)),
      sleep: generateMockSleepData(parseInt(days)),
      distance: generateMockDistanceData(parseInt(days)),
      lastSyncedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: mockData,
    });
  } catch (error) {
    console.error('Error fetching wearable data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wearable data' },
      { status: 500 }
    );
  }
}

function generateMockHeartRateData(days: number) {
  const data = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      timestamp: date.toISOString(),
      resting: 65 + Math.random() * 10,
      average: 75 + Math.random() * 15,
      peak: 150 + Math.random() * 50,
    });
  }
  return data.reverse();
}

function generateMockStepsData(days: number) {
  const data = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      timestamp: date.toISOString(),
      steps: 5000 + Math.random() * 15000,
      goal: 10000,
      distance: (5000 + Math.random() * 15000) * 0.8, // in meters
    });
  }
  return data.reverse();
}

function generateMockCaloriesData(days: number) {
  const data = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      timestamp: date.toISOString(),
      burned: 1800 + Math.random() * 800,
      active: 400 + Math.random() * 300,
      bmr: 1400,
    });
  }
  return data.reverse();
}

function generateMockSleepData(days: number) {
  const data = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      timestamp: date.toISOString(),
      duration: 420 + Math.random() * 120, // in minutes
      quality: 70 + Math.random() * 25,
      deepSleep: 60 + Math.random() * 60,
      remSleep: 80 + Math.random() * 40,
      lightSleep: 200 + Math.random() * 100,
    });
  }
  return data.reverse();
}

function generateMockDistanceData(days: number) {
  const data = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      timestamp: date.toISOString(),
      distance: 5000 + Math.random() * 15000, // in meters
      elevation: 50 + Math.random() * 200, // in meters
    });
  }
  return data.reverse();
}
