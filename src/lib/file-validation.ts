/**
 * File upload validation utilities
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
]

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

export interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedFilename?: string
}

/**
 * Validate image file
 */
export function validateImageFile(
  file: File,
  maxSize: number = MAX_IMAGE_SIZE
): FileValidationResult {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Image file too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
    }
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid image type. Allowed types: JPEG, PNG, GIF, WebP',
    }
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name)

  return {
    valid: true,
    sanitizedFilename,
  }
}

/**
 * Validate video file
 */
export function validateVideoFile(
  file: File,
  maxSize: number = MAX_VIDEO_SIZE
): FileValidationResult {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Video file too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
    }
  }

  // Check file type
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid video type. Allowed types: MP4, MOV, WebM',
    }
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name)

  return {
    valid: true,
    sanitizedFilename,
  }
}

/**
 * Validate document file
 */
export function validateDocumentFile(
  file: File,
  maxSize: number = MAX_FILE_SIZE
): FileValidationResult {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Document file too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
    }
  }

  // Check file type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid document type. Allowed types: PDF, DOC, DOCX, TXT',
    }
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name)

  return {
    valid: true,
    sanitizedFilename,
  }
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  let sanitized = filename.replace(/^.*[\\/]/, '')

  // Remove dangerous characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_')

  // Ensure filename is not empty and has an extension
  if (!sanitized || sanitized === '.' || sanitized === '..') {
    sanitized = `file_${Date.now()}`
  }

  // Limit filename length
  const maxLength = 255
  if (sanitized.length > maxLength) {
    const ext = sanitized.split('.').pop()
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'))
    sanitized = nameWithoutExt.substring(0, maxLength - (ext?.length || 0) - 1) + '.' + ext
  }

  return sanitized
}

/**
 * Server-side file validation
 */
export async function validateFileBuffer(
  buffer: Buffer,
  expectedType: 'image' | 'video' | 'document'
): Promise<FileValidationResult> {
  // Check magic numbers (file signatures) to verify actual file type.
  // We keep this intentionally lightweight and avoid pulling in external libs.
  const magicNumbers = buffer.slice(0, 16)

  const isJpeg = magicNumbers.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
  const isPng = magicNumbers
    .slice(0, 8)
    .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  const isGif = magicNumbers.slice(0, 3).equals(Buffer.from([0x47, 0x49, 0x46])) // GIF

  const isRiff = magicNumbers.slice(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46])) // RIFF
  const isWebp = isRiff && magicNumbers.slice(8, 12).equals(Buffer.from([0x57, 0x45, 0x42, 0x50])) // WEBP

  // ISO Base Media File Format (MP4/MOV): "ftyp" at offset 4.
  const isIsoBmff = magicNumbers.slice(4, 8).equals(Buffer.from([0x66, 0x74, 0x79, 0x70])) // ftyp

  // WebM is EBML: 1A 45 DF A3
  const isWebm = magicNumbers.slice(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))

  // AVI: RIFF .... AVI  (bytes 8-11)
  const isAvi = isRiff && magicNumbers.slice(8, 12).equals(Buffer.from([0x41, 0x56, 0x49, 0x20])) // AVI␠

  const isPdf = magicNumbers.slice(0, 4).equals(Buffer.from([0x25, 0x50, 0x44, 0x46])) // %PDF
  const isDoc = magicNumbers.slice(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0])) // DOC
  const isZip = magicNumbers.slice(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) // ZIP (DOCX)

  const isValid =
    expectedType === 'image'
      ? isJpeg || isPng || isGif || isWebp
      : expectedType === 'video'
        ? isIsoBmff || isWebm || isAvi
        : isPdf || isDoc || isZip

  if (!isValid) {
    return {
      valid: false,
      error: `File type mismatch. Expected ${expectedType} file.`,
    }
  }

  return {
    valid: true,
  }
}

/**
 * Generate secure random filename
 */
export function generateSecureFilename(originalFilename: string): string {
  const ext = originalFilename.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${random}.${ext}`
}
