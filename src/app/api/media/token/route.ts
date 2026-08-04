import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canAccessMedia } from '@/lib/media-access'
import { mediaFileExists, signMediaToken } from '@/lib/media'

/**
 * GET /api/media/token?file=<fileName>
 *
 * Issues a short-lived signed URL for a protected video. Requires:
 * 1. An authenticated session.
 * 2. The user passes the entitlement check (canAccessMedia).
 * 3. The file exists in MEDIA_DIR.
 *
 * Returns: { url: "/api/media/file?p=..&e=..&s=.." }
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const file = req.nextUrl.searchParams.get('file')
  if (!file) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }

  if (!(await canAccessMedia(session.role, session.userId))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  if (!(await mediaFileExists(file))) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const { exp, sig } = signMediaToken(file)
  const url = `/api/media/file?p=${encodeURIComponent(file)}&e=${exp}&s=${sig}`

  return NextResponse.json({ url, exp })
}
