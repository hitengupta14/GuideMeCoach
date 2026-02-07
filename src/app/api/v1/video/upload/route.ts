import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac, randomUUID } from 'crypto'
import { validateFileBuffer, generateSecureFilename } from '@/lib/file-validation'
import { logger } from '@/lib/logger'
import { verifySession } from '@/lib/auth-helpers'
import { getGlobalAppSettings } from '@/lib/app-settings'
import { db } from '@/db'
import { videos } from '@/db/schema-mobile'
import { createRateLimiter } from '@/lib/rate-limit'

const videoUploadRateLimiter = createRateLimiter(60 * 60 * 1000, 20, async (request) => {
  const userId = await verifySession(request as any).catch(() => null)
  return `${userId || request.headers.get('x-forwarded-for') || 'unknown'}:v1.video.upload`
})

// This endpoint handles video upload
// Videos are stored in a cloud storage service (AWS S3, Cloudinary, or Firebase)

export async function POST(req: NextRequest) {
  try {
    const rate = await videoUploadRateLimiter(req)
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many uploads. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const userId = await verifySession(req)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const s3Config = getS3Config()
    if (!s3Config) {
      return NextResponse.json(
        {
          success: false,
          error: 'Video uploads are not configured on the server',
          code: 'S3_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }

    const formData = await req.formData()
    const file = (formData.get('video') as File | null) ?? null
    const exerciseId = (formData.get('exerciseId') as string | null) ?? null

    const fileName =
      (typeof formData.get('fileName') === 'string' ? (formData.get('fileName') as string) : null) ||
      file?.name ||
      'video'
    const fileType =
      (typeof formData.get('fileType') === 'string' ? (formData.get('fileType') as string) : null) ||
      file?.type ||
      ''
    const fileSizeRaw =
      (typeof formData.get('fileSize') === 'string' ? (formData.get('fileSize') as string) : null) ||
      (typeof (file as any)?.size === 'number' ? String((file as any).size) : null) ||
      null
    const fileSize = fileSizeRaw ? Number(fileSizeRaw) : (typeof file?.size === 'number' ? file.size : NaN)

    // Enhanced file validation
    const appSettings = await getGlobalAppSettings()
    const maxUploadSizeMb = Number.isFinite(appSettings.maxUploadSize)
      ? Math.max(1, Math.floor(appSettings.maxUploadSize))
      : 100
    const MAX_VIDEO_SIZE = maxUploadSizeMb * 1024 * 1024
    
    // Validate file size
    if (Number.isFinite(fileSize) && fileSize > MAX_VIDEO_SIZE) {
      logger.warn('Video upload rejected: file too large', { 
        userId, 
        size: fileSize,
        maxSize: MAX_VIDEO_SIZE 
      })
      return NextResponse.json(
        { success: false, error: `File too large (max ${maxUploadSizeMb}MB)` },
        { status: 413 }
      )
    }

    // Validate MIME type
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
    if (!ALLOWED_VIDEO_TYPES.includes(fileType)) {
      logger.warn('Video upload rejected: invalid type', { 
        userId, 
        type: fileType 
      })
      return NextResponse.json(
        { success: false, error: 'Invalid video format. Allowed: MP4, MOV, WebM' },
        { status: 400 }
      )
    }

    // Validate file content (magic number check) when a file is provided.
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const contentValidation = await validateFileBuffer(buffer, 'video')

      if (!contentValidation.valid) {
        logger.warn('Video upload rejected: content validation failed', { 
          userId,
          error: contentValidation.error 
        })
        return NextResponse.json(
          { success: false, error: contentValidation.error },
          { status: 400 }
        )
      }
    }

    // Generate secure filename
    const secureFilename = generateSecureFilename(fileName)
    const videoId = randomUUID()
    
    const key = `videos/${userId}/${videoId}-${secureFilename}`
    const expiresInSeconds = 15 * 60

    // Persist video metadata so analysis/status can be fetched later.
    await db.insert(videos).values({
      id: videoId,
      userId,
      exerciseId,
      s3Key: key,
      status: 'uploading',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Generate a presigned URL for upload (client sends video directly to S3)
    const uploadUrl = generatePresignedPutUrl({
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
      region: s3Config.region,
      endpoint: s3Config.endpoint,
      bucketName: s3Config.bucketName,
      key,
      expiresInSeconds,
    })

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        s3Key: key,
        uploadUrl, // legacy field
        upload: {
          url: uploadUrl,
          method: 'PUT',
          headers: { 'Content-Type': fileType },
          expiresInSeconds,
        },
        message: 'Upload URL generated. Upload the video to the provided URL using HTTP PUT.',
      },
    })
  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Video upload failed' },
      { status: 500 }
    )
  }
}

type S3Config = {
  accessKeyId: string
  secretAccessKey: string
  region: string
  endpoint: string
  bucketName?: string
}

function getS3Config(): S3Config | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const endpoint = process.env.AWS_S3_ENDPOINT
  const region = process.env.AWS_REGION || 'us-east-1'
  const bucketName = process.env.AWS_BUCKET_NAME || undefined

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    return null
  }

  return { accessKeyId, secretAccessKey, endpoint, region, bucketName }
}

function encodeRfc3986(input: string): string {
  return encodeURIComponent(input).replace(/[!'()*]/g, (c) =>
    '%' + c.charCodeAt(0).toString(16).toUpperCase()
  )
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

function toAmzDate(date: Date): string {
  // YYYYMMDDTHHMMSSZ
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '')
}

function sha256Hex(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex')
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest()
}

function hmacHex(key: Buffer | string, data: string): string {
  return createHmac('sha256', key).update(data, 'utf8').digest('hex')
}

function getSigningKey(secretAccessKey: string, dateStamp: string, region: string): Buffer {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, 's3')
  return hmac(kService, 'aws4_request')
}

function generatePresignedPutUrl(params: {
  accessKeyId: string
  secretAccessKey: string
  region: string
  endpoint: string
  bucketName?: string
  key: string
  expiresInSeconds: number
}): string {
  const endpointUrl = new URL(params.endpoint)
  const objectPath = buildObjectPath(endpointUrl, params.key, params.bucketName)

  const now = new Date()
  const amzDate = toAmzDate(now)
  const dateStamp = amzDate.slice(0, 8)
  const credentialScope = `${dateStamp}/${params.region}/s3/aws4_request`

  const algorithm = 'AWS4-HMAC-SHA256'
  const signedHeaders = 'host'

  const queryParams: Array<[string, string]> = [
    ['X-Amz-Algorithm', algorithm],
    ['X-Amz-Credential', `${params.accessKeyId}/${credentialScope}`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(params.expiresInSeconds)],
    ['X-Amz-SignedHeaders', signedHeaders],
  ]

  queryParams.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]))

  const canonicalQuerystring = queryParams
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join('&')

  const canonicalUri = objectPath
    .split('/')
    .map((seg) => encodeRfc3986(seg))
    .join('/')

  const canonicalHeaders = `host:${endpointUrl.host}\n`
  const payloadHash = 'UNSIGNED-PAYLOAD'

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  const signingKey = getSigningKey(params.secretAccessKey, dateStamp, params.region)
  const signature = hmacHex(signingKey, stringToSign)

  return `${endpointUrl.origin}${objectPath}?${canonicalQuerystring}&X-Amz-Signature=${signature}`
}
