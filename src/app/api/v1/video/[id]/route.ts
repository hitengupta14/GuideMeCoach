import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecretKey } from '@/lib/jwt';

const JWT_SECRET = getJwtSecretKey();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const videoId = params.id;

    // In production, fetch from database
    // For now, returning mock data
    const mockAnalysis = {
      status: 'completed',
      formScore: 8.5,
      keyPoints: [
        {
          timestamp: 2.5,
          feedback: 'Good form on initial position',
          severity: 'positive',
        },
        {
          timestamp: 5.2,
          feedback: 'Slight knee cave on descent - watch your knees',
          severity: 'warning',
        },
        {
          timestamp: 8.1,
          feedback: 'Excellent lockout position',
          severity: 'positive',
        },
      ],
      improvements: [
        'Work on knee alignment during descent',
        'Increase depth slightly on each rep',
      ],
      videoUrl: `https://your-bucket.s3.amazonaws.com/videos/${userId}/${videoId}`,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: mockAnalysis,
    });
  } catch (error) {
    console.error('Error fetching video analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
