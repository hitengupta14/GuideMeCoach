import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(req: NextRequest) {
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
