import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  let body: { file?: string; type?: string; fileName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'خطأ في قراءة البيانات' }, { status: 400 })
  }

  const { file, type, fileName } = body
  if (!file || !type || !fileName) {
    return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 422 })
  }

  const allowedTypes = ['avatar', 'video', 'diploma', 'material', 'banner', 'session-media', 'track']
  if (!allowedTypes.includes(type)) {
    return NextResponse.json({ error: 'نوع ملف غير صالح' }, { status: 422 })
  }

  const matches = file.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/)
  if (!matches) {
    return NextResponse.json({ error: 'صيغة base64 غير صالحة' }, { status: 422 })
  }

  const mimeType = matches[1]
  const base64Data = matches[2]
  const buffer = Buffer.from(base64Data, 'base64')

  const maxBytes = type === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024
  if (buffer.length > maxBytes) {
    return NextResponse.json(
      { error: `حجم الملف كبير جداً (الحد الأقصى ${type === 'video' ? '50MB' : '5MB'})` },
      { status: 413 },
    )
  }

  const ext = mimeType.split('/')[1].replace('jpeg', 'jpg')
  const newFileName = `${type}_${session.userId}_${Date.now()}.${ext}`

  const formData = new FormData()
  formData.append('file', new Blob([buffer], { type: mimeType }), newFileName)
  formData.append('fileName', newFileName)
  formData.append('type', type)

  // الرابط لملف PHP في استضافتك
  const hostingerUploadUrl = process.env.HOSTINGER_UPLOAD_URL || "https://yourdomain.com/upload.php"
  const mediaSecret = process.env.MEDIA_SECRET || "dev-media-secret-change-me"

  try {
    const uploadRes = await fetch(hostingerUploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mediaSecret}`
      },
      body: formData
    })

    const hostingerData = await uploadRes.json()

    if (!uploadRes.ok) {
      throw new Error(hostingerData.error || 'فشل الرفع')
    }

    return NextResponse.json({
      ok: true,
      url: hostingerData.url,
      type,
      size: buffer.length,
      mimeType,
    })
  } catch (err) {
    console.error('[upload] Hostinger error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء الرفع إلى الخادم الخارجي' }, { status: 500 })
  }
}
