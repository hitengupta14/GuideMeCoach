import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { validateFileBuffer, generateSecureFilename } from '@/lib/file-validation';
import { logger } from '@/lib/logger';
import { verifySession } from '@/lib/auth-helpers';

// This endpoint handles video upload
// Videos are stored in a cloud storage service (AWS S3, Cloudinary, or Firebase)

export async function POST(req: NextRequest) {
  try {
    const userId = await verifySession(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('video') as File;
    const exerciseId = formData.get('exerciseId') as string;

    if (!file || !exerciseId) {
      return NextResponse.json(
        { success: false, error: 'Video file and exerciseId required' },
        { status: 400 }
      );
    }

    // Enhanced file validation
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB (reduced from 500MB for cost control)
    
    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      logger.warn('Video upload rejected: file too large', { 
        userId, 
        size: file.size,
        maxSize: MAX_VIDEO_SIZE 
      });
      return NextResponse.json(
        { success: false, error: 'File too large (max 100MB)' },
        { status: 413 }
      );
    }

    // Validate MIME type
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      logger.warn('Video upload rejected: invalid type', { 
        userId, 
        type: file.type 
      });
      return NextResponse.json(
        { success: false, error: 'Invalid video format. Allowed: MP4, MOV, WebM' },
        { status: 400 }
      );
    }

    // Validate file content (magic number check)
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentValidation = await validateFileBuffer(buffer, 'video');
    
    if (!contentValidation.valid) {
      logger.warn('Video upload rejected: content validation failed', { 
        userId,
        error: contentValidation.error 
      });
      return NextResponse.json(
        { success: false, error: contentValidation.error },
        { status: 400 }
      );
    }

    // Generate secure filename
    const secureFilename = generateSecureFilename(file.name);

    const videoId = randomUUID();
    
    // In production, upload to S3/Cloudinary/Firebase
    // For now, we'll store metadata in database
    // The actual upload would happen via a separate service
    
    // Generate a presigned URL for upload (client sends video directly to S3)
    const s3PresignedUrl = generateS3PresignedUrl(videoId, userId, file.type, secureFilename);

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

function generateS3PresignedUrl(videoId: string, userId: string, fileType: string, secureFilename: string): string {
  // This would use AWS SDK to generate a presigned URL
  // For demo purposes, returning a placeholder
  const s3Endpoint = process.env.AWS_S3_ENDPOINT || 'https://your-bucket.s3.amazonaws.com';
  const key = `videos/${userId}/${videoId}-${secureFilename}`;
  
  // In production: use AWS SDK to generate proper presigned URL
  return `${s3Endpoint}/${key}?x-amz-algorithm=AWS4-HMAC-SHA256&...`;
}
