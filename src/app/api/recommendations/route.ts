import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getRecommendationsForStudent } from '@/lib/ai/recommendations'

/**
 * GET /api/recommendations?student=<id>
 * Returns AI recommendations for a student (cached 24h).
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const studentId = new URL(req.url).searchParams.get('student')
  if (!studentId) {
    return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 422 })
  }

  // Verify student belongs to parent
  const parent = await db.parent.findUnique({
    where: { userId: session.userId },
    include: { students: { select: { id: true, name: true, birthDate: true, grade: true, levelsJson: true } } },
  })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const owns = parent.students.some((s) => s.id === studentId)
  if (!owns) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { recommendations, cached } = await getRecommendationsForStudent(studentId)

  return NextResponse.json({
    recommendations,
    cached,
    students: parent.students,
  })
}

/**
 * POST /api/recommendations
 * Body: { studentId, recommendationId, action: 'click' | 'book' }
 * Tracks whether parent acted on a recommendation (for AI improvement).
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json()
  const { recommendationId, action } = body as { recommendationId: string; action: 'click' | 'book' }

  if (!recommendationId || !action) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }

  if (action === 'click') {
    await db.recommendationLog.update({
      where: { id: recommendationId },
      data: { clicked: true },
    })
  } else if (action === 'book') {
    await db.recommendationLog.update({
      where: { id: recommendationId },
      data: { booked: true },
    })
  }

  return NextResponse.json({ ok: true })
}
