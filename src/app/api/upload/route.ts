import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

/**
 * POST /api/upload
 * Body: { file: "base64data", type: "avatar|video|diploma|material", fileName: "original.jpg" }
 *
 * Saves file to /public/uploads/<hash>.<ext>
 * Returns: { url: "/uploads/<hash>.<ext>" }
 *
 * Restrictions:
 * - Max 5MB for images, 50MB for videos
 * - Allowed: jpg, png, webp, gif, pdf, mp4, webm
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  let body: { file?: string; type?: string; fileName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }

  const { file, type, fileName } = body
  if (!file || !type || !fileName) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }

  // Validate type
  const allowedTypes = ['avatar', 'video', 'diploma', 'material', 'banner', 'session-media', 'track']
  if (!allowedTypes.includes(type)) {
    return NextResponse.json({ error: 'نوع غير صالح' }, { status: 422 })
  }

  // Extract base64 data + extension
  const matches = file.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/)
  if (!matches) {
    return NextResponse.json({ error: 'صيغة base64 غير صحيحة' }, { status: 422 })
  }

  const mimeType = matches[1]
  const base64Data = matches[2]
  const buffer = Buffer.from(base64Data, 'base64')

  // Size limits
  const maxBytes = type === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024
  if (buffer.length > maxBytes) {
    return NextResponse.json(
      { error: `حجم الملف كبير جداً (الحد الأقصى ${type === 'video' ? '50MB' : '5MB'})` },
      { status: 413 },
    )
  }

  // Allowed mime types
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'video/webm',
  ]
  if (!allowedMimes.includes(mimeType)) {
    return NextResponse.json(
      { error: `نوع ملف غير مسموح: ${mimeType}` },
      { status: 422 },
    )
  }

  // Generate filename
  const ext = mimeType.split('/')[1].replace('jpeg', 'jpg')
  const hash = crypto.randomBytes(8).toString('hex')
  const prefix = type === 'avatar' ? 'avatar' : type === 'video' ? 'video' : type === 'diploma' ? 'diploma' : type === 'banner' ? 'banner' : type === 'session-media' ? 'session' : type === 'track' ? 'track' : 'material'
  const newFileName = `${prefix}_${session.userId}_${hash}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  const filePath = path.join(uploadDir, newFileName)

  try {
    // Ensure dir exists
    await fs.mkdir(uploadDir, { recursive: true })
    // Write file
    await fs.writeFile(filePath, buffer)
  } catch (err) {
    console.error('[upload] Write error:', err)
    return NextResponse.json({ error: 'فشل حفظ الملف' }, { status: 500 })
  }

  const url = `/uploads/${newFileName}`

  return NextResponse.json({
    ok: true,
    url,
    type,
    size: buffer.length,
    mimeType,
  })
}
