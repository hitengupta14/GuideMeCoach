import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { videos } from '@/db/schema-mobile'
import { verifySession } from '@/lib/auth-helpers'
import { and, eq } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifySession(req)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const videoId = params.id

    const video = await db
      .select({
        id: videos.id,
        status: videos.status,
        s3Key: videos.s3Key,
        aiAnalysis: videos.aiAnalysis,
        formScore: videos.formScore,
        improvements: videos.improvements,
        analyzedAt: videos.analyzedAt,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
      })
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
      .limit(1)
      .then((rows) => rows[0])

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    const analysis = video.aiAnalysis || {}
    const formScore =
      typeof video.formScore === 'string'
        ? Number(video.formScore)
        : typeof (video.formScore as any) === 'number'
          ? (video.formScore as any)
          : typeof (analysis as any)?.formScore === 'number'
            ? (analysis as any).formScore
            : undefined

    const improvements =
      Array.isArray(video.improvements) && video.improvements.length > 0
        ? video.improvements
        : Array.isArray((analysis as any)?.improvements)
          ? (analysis as any).improvements
          : undefined

    return NextResponse.json({
      success: true,
      data: {
        status: video.status,
        formScore: Number.isFinite(formScore as number) ? formScore : undefined,
        keyPoints: Array.isArray((analysis as any)?.keyPoints) ? (analysis as any).keyPoints : undefined,
        improvements,
        videoUrl: buildPublicVideoUrl(video.s3Key),
        analyzedAt: video.analyzedAt ? new Date(video.analyzedAt).toISOString() : undefined,
        createdAt: video.createdAt ? new Date(video.createdAt).toISOString() : undefined,
        updatedAt: video.updatedAt ? new Date(video.updatedAt).toISOString() : undefined,
      },
    })
  } catch (error) {
    console.error('Error fetching video analysis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analysis' },
      { status: 500 }
    )
  }
}

function buildPublicVideoUrl(key: string): string | null {
  const endpoint = process.env.AWS_S3_ENDPOINT
  if (!endpoint) return null

  try {
    const endpointUrl = new URL(endpoint)
    const bucketName = process.env.AWS_BUCKET_NAME || undefined
    const objectPath = buildObjectPath(endpointUrl, key, bucketName)
    return `${endpointUrl.origin}${objectPath}`
  } catch {
    return null
  }
}

function buildObjectPath(endpointUrl: URL, key: string, bucketName?: string): string {
  const basePath = endpointUrl.pathname === '/' ? '' : endpointUrl.pathname.replace(/\/$/, '')

  let bucketSegment = ''
  if (bucketName) {
    const hostHasBucket = endpointUrl.hostname.startsWith(`${bucketName}.`)
    const pathHasBucket =
      endpointUrl.pathname === `/${bucketName}` ||
      endpointUrl.pathname.startsWith(`/${bucketName}/`)
    if (!hostHasBucket && !pathHasBucket) {
      bucketSegment = `/${bucketName}`
    }
  }

  return `${basePath}${bucketSegment}/${key}`.replace(/\/{2,}/g, '/')
}
