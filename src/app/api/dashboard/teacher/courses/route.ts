import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * Teacher courses & attached content (lessons) management.
 *
 * GET    /api/dashboard/teacher/courses — list my courses with their lessons
 * POST   /api/dashboard/teacher/courses — create a lesson   { courseId, title, type, description?, content?, contentUrl? }
 * PATCH  /api/dashboard/teacher/courses — update a lesson   { id, ...fields }
 * DELETE /api/dashboard/teacher/courses — delete a lesson   { id }
 */

async function requireTeacher() {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') return null
  const teacher = await db.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) return null
  return { session, teacher }
}

export async function GET() {
  const ctx = await requireTeacher()
  if (!ctx) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const courses = await db.course.findMany({
    where: { teacherId: ctx.teacher.id },
    include: {
      lessons: { orderBy: { orderIndex: 'asc' } },
      _count: { select: { sessions: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({
    courses: courses.map((c) => ({
      id: c.id,
      title: c.title,
      track: c.track,
      level: c.level,
      description: c.description,
      status: c.status,
      totalSessions: c._count.sessions,
      lessonCount: c.lessons.length,
      lessons: c.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        type: l.type,
        content: l.content,
        contentUrl: l.contentUrl,
        orderIndex: l.orderIndex,
        isPublished: l.isPublished,
      })),
    })),
  })
}

export async function POST(req: NextRequest) {
  const ctx = await requireTeacher()
  if (!ctx) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json()
  const { courseId, title, type, description, content, contentUrl } = body as {
    courseId: string
    title: string
    type?: string
    description?: string
    content?: string
    contentUrl?: string
  }

  if (!courseId || !title?.trim()) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }

  const course = await db.course.findFirst({
    where: { id: courseId, teacherId: ctx.teacher.id },
  })
  if (!course) {
    return NextResponse.json({ error: 'الكورس غير موجود أو غير مملوك لك' }, { status: 404 })
  }

  const maxOrder = await db.courseLesson.aggregate({
    where: { courseId },
    _max: { orderIndex: true },
  })

  const lesson = await db.courseLesson.create({
    data: {
      courseId,
      title: title.trim(),
      type: type || 'TEXT',
      description: description?.trim() || null,
      content: content?.trim() || null,
      contentUrl: contentUrl?.trim() || null,
      orderIndex: (maxOrder._max.orderIndex ?? 0) + 1,
      isPublished: true,
    },
  })

  return NextResponse.json({ ok: true, lesson }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireTeacher()
  if (!ctx) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json()
  const { id, title, type, description, content, contentUrl, orderIndex, isPublished } = body as {
    id: string
    title?: string
    type?: string
    description?: string
    content?: string
    contentUrl?: string
    orderIndex?: number
    isPublished?: boolean
  }

  if (!id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })

  // Verify ownership through the course
  const existing = await db.courseLesson.findFirst({
    where: { id, course: { teacherId: ctx.teacher.id } },
  })
  if (!existing) {
    return NextResponse.json({ error: 'الدرس غير موجود أو غير مملوك لك' }, { status: 404 })
  }

  const lesson = await db.courseLesson.update({
    where: { id },
    data: {
      title: title?.trim() || undefined,
      type: type || undefined,
      description: description === undefined ? undefined : description?.trim() || null,
      content: content === undefined ? undefined : content?.trim() || null,
      contentUrl: contentUrl === undefined ? undefined : contentUrl?.trim() || null,
      orderIndex: orderIndex ?? undefined,
      isPublished: isPublished ?? undefined,
    },
  })

  return NextResponse.json({ ok: true, lesson })
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireTeacher()
  if (!ctx) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })

  const existing = await db.courseLesson.findFirst({
    where: { id, course: { teacherId: ctx.teacher.id } },
  })
  if (!existing) {
    return NextResponse.json({ error: 'الدرس غير موجود أو غير مملوك لك' }, { status: 404 })
  }

  await db.courseLesson.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
