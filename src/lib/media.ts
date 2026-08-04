import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

/**
 * Media protection helpers — HMAC-signed, short-lived URLs for videos.
 *
 * Videos are stored OUTSIDE `public/` (in MEDIA_DIR) so they are never served
 * as static files. Access is only possible through /api/media/token (issues a
 * short-lived signed URL) and /api/media/file (validates the signature + the
 * user's entitlement, then streams with HTTP Range support for seeking).
 */

const MEDIA_SECRET =
  process.env.MEDIA_SECRET || process.env.OTP_SECRET || process.env.NEXTAUTH_SECRET || 'insecure-media-secret'

export const MEDIA_DIR = process.env.MEDIA_DIR || path.join(process.cwd(), 'data', 'media')

/** Default signed-URL lifetime (1 hour — long enough to finish a lesson video). */
export const MEDIA_TTL_SECONDS = 3600

const VIDEO_EXT = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogg'])

export function isVideoFile(fileName: string): boolean {
  const ext = path.extname(fileName).slice(1).toLowerCase()
  return VIDEO_EXT.has(ext)
}

export function mimeForFile(fileName: string): string {
  const ext = path.extname(fileName).slice(1).toLowerCase()
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    m4v: 'video/mp4',
    ogg: 'video/ogg',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    pdf: 'application/pdf',
  }
  return map[ext] ?? 'application/octet-stream'
}

/** Safe filename — only the bare name, no separators or traversal. */
export function safeMediaName(name: string): string | null {
  const base = path.basename(name)
  if (!base || base !== name) return null
  if (base.includes('..') || base.includes('/') || base.includes('\\')) return null
  return base
}

export function mediaFilePath(name: string): string | null {
  const safe = safeMediaName(name)
  if (!safe) return null
  return path.join(MEDIA_DIR, safe)
}

export async function mediaFileExists(name: string): Promise<boolean> {
  const fp = mediaFilePath(name)
  if (!fp) return false
  try {
    await fs.access(fp)
    return true
  } catch {
    return false
  }
}

export async function ensureMediaDir(): Promise<void> {
  await fs.mkdir(MEDIA_DIR, { recursive: true })
}

export function signMediaToken(fileName: string, ttlSeconds = MEDIA_TTL_SECONDS): { exp: number; sig: string } {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const sig = crypto.createHmac('sha256', MEDIA_SECRET).update(`${fileName}:${exp}`).digest('hex')
  return { exp, sig }
}

export function verifyMediaToken(fileName: string, exp: number, sig: string): boolean {
  if (!fileName || !Number.isFinite(exp) || !sig) return false
  if (exp < Math.floor(Date.now() / 1000)) return false
  const expected = crypto.createHmac('sha256', MEDIA_SECRET).update(`${fileName}:${exp}`).digest('hex')
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(sig, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
