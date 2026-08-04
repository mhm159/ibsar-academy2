import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import { Readable } from 'stream'
import { getSession } from '@/lib/auth'
import { canAccessMedia } from '@/lib/media-access'
import { mediaFilePath, mimeForFile, verifyMediaToken } from '@/lib/media'

export const runtime = 'nodejs'

const RANGE_RE = /bytes=(\d*)-(\d*)/

/**
 * GET /api/media/file?p=<fileName>&e=<exp>&s=<sig>
 *
 * Streams a protected media file after validating:
 * 1. The HMAC signature + expiry (short-lived signed URL).
 * 2. The user's entitlement (canAccessMedia).
 *
 * Supports HTTP Range requests so <video> can seek. Videos are stored outside
 * `public/`, so this route is the ONLY way to reach them.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return new Response('غير مصرح', { status: 401 })
  }

  const p = req.nextUrl.searchParams.get('p') ?? ''
  const e = Number(req.nextUrl.searchParams.get('e'))
  const s = req.nextUrl.searchParams.get('s') ?? ''

  if (!verifyMediaToken(p, e, s)) {
    return new Response('الرابط منتهي أو غير صالح', { status: 401 })
  }

  if (!(await canAccessMedia(session.role, session.userId))) {
    return new Response('غير مصرح', { status: 403 })
  }

  const fp = mediaFilePath(p)
  if (!fp) {
    return new Response('غير موجود', { status: 404 })
  }

  let stat
  try {
    stat = await fs.stat(fp)
  } catch {
    return new Response('غير موجود', { status: 404 })
  }

  const size = stat.size
  const baseHeaders: Record<string, string> = {
    'Content-Type': mimeForFile(p),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, no-store, must-revalidate',
    'Content-Disposition': `inline; filename="${p}"`,
    'X-Content-Type-Options': 'nosniff',
    'Last-Modified': stat.mtime.toUTCString(),
  }

  const range = req.headers.get('range')
  if (range) {
    const match = RANGE_RE.exec(range)
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0
      const end = match[2] ? parseInt(match[2], 10) : size - 1
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= size || start < 0) {
        return new Response(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${size}` },
        })
      }
      const stream = Readable.toWeb(createReadStream(fp, { start, end })) as ReadableStream
      return new Response(stream, {
        status: 206,
        headers: {
          ...baseHeaders,
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Content-Length': String(end - start + 1),
        },
      })
    }
  }

  const stream = Readable.toWeb(createReadStream(fp)) as ReadableStream
  return new Response(stream, {
    status: 200,
    headers: { ...baseHeaders, 'Content-Length': String(size) },
  })
}
