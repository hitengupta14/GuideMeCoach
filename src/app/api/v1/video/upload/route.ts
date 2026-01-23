import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

// This endpoint handles video upload
// Videos are stored in a cloud storage service (AWS S3, Cloudinary, or Firebase)

export async function POST(req: NextRequest) {
  try {
    // Verify JWT token
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

    const formData = await req.formData();
    const file = formData.get('video') as File;
    const exerciseId = formData.get('exerciseId') as string;

    if (!file || !exerciseId) {
      return NextResponse.json(
        { success: false, error: 'Video file and exerciseId required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { success: false, error: 'File must be a video' },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB)
    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 500MB)' },
        { status: 413 }
      );
    }

    const videoId = randomUUID();
    
    // In production, upload to S3/Cloudinary/Firebase
    // For now, we'll store metadata in database
    // The actual upload would happen via a separate service
    
    // Generate a presigned URL for upload (client sends video directly to S3)
    const s3PresignedUrl = generateS3PresignedUrl(videoId, userId, file.type);

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        uploadUrl: s3PresignedUrl,
        message: 'Upload URL generated. Send video directly to this URL.',
      },
    });
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Video upload failed' },
      { status: 500 }
    );
  }
}

function generateS3PresignedUrl(videoId: string, userId: string, fileType: string): string {
  // This would use AWS SDK to generate a presigned URL
  // For demo purposes, returning a placeholder
  const s3Endpoint = process.env.AWS_S3_ENDPOINT || 'https://your-bucket.s3.amazonaws.com';
  const key = `videos/${userId}/${videoId}`;
  
  // In production: use AWS SDK to generate proper presigned URL
  return `${s3Endpoint}/${key}?x-amz-algorithm=AWS4-HMAC-SHA256&...`;
}
