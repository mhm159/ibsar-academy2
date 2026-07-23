import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'
import { z } from 'zod'

/** Safe JSON parse — returns null on invalid/empty input */
function safeJsonParse(str: string | null | undefined): any {
  if (!str || str.trim() === '') return null
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

/**
 * GET /api/dashboard/teacher/homework
 * Returns homework assigned by this teacher.
 */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const teacher = await db.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const homeworks = await db.homework.findMany({
    where: { teacherId: teacher.id },
    include: {
      student: { select: { id: true, name: true } },
      session: { select: { title: true, track: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    homeworks: homeworks.map((h) => ({
      id: h.id,
      title: h.title,
      description: h.description,
      type: h.type,
      status: h.status,
      dueDate: h.dueDate,
      attachmentUrl: h.attachmentUrl,
      attachmentName: h.attachmentName,
      studentName: h.student.name,
      studentId: h.student.id,
      sessionTitle: h.session?.title ?? null,
      submissionText: h.submissionText,
      submissionUrl: h.submissionUrl,
      submissionName: h.submissionName,
      submittedAt: h.submittedAt,
      grade: h.grade,
      feedback: h.feedback,
      reviewedAt: h.reviewedAt,
      createdAt: h.createdAt,
      // Interactive fields
      questions: h.questionsJson ? safeJsonParse(h.questionsJson) : null,
      answers: h.answersJson ? safeJsonParse(h.answersJson) : null,
      autoGraded: h.autoGraded,
      totalPoints: h.totalPoints,
      earnedPoints: h.earnedPoints,
    })),
  })
}

const CreateHomework = z.object({
  studentId: z.string().min(1),
  sessionId: z.string().optional(),
  title: z.string().min(2).max(120),
  description: z.string().min(5).max(2000),
  type: z.enum(['PRACTICAL', 'WRITTEN', 'READING', 'QUIZ', 'PROJECT', 'INTERACTIVE']).default('PRACTICAL'),
  dueDate: z.string().datetime(),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
  // Interactive homework
  questions: z.array(z.any()).optional(),
})

/**
 * POST /api/dashboard/teacher/homework
 * Assign homework to a student.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const teacher = await db.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }

  const parsed = CreateHomework.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'البيانات غير صحيحة', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  // Verify student belongs to a parent (exists)
  const student = await db.student.findUnique({
    where: { id: parsed.data.studentId },
    include: { parent: { include: { user: { select: { id: true } } } } },
  })
  if (!student) {
    return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })
  }

  const homework = await db.homework.create({
    data: {
      teacherId: teacher.id,
      studentId: parsed.data.studentId,
      sessionId: parsed.data.sessionId,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      dueDate: new Date(parsed.data.dueDate),
      attachmentUrl: parsed.data.attachmentUrl,
      attachmentName: parsed.data.attachmentName,
      status: 'ASSIGNED',
      // Interactive homework fields
      ...(parsed.data.questions && parsed.data.questions.length > 0
        ? {
            questionsJson: JSON.stringify(parsed.data.questions),
            totalPoints: (parsed.data.questions as any[]).reduce((sum, q) => sum + (q.points || 0), 0),
            autoGraded: (parsed.data.questions as any[]).every((q) => q.type !== 'ESSAY'),
          }
        : {}),
    },
  })

  // Notify parent
  await sendNotification(
    student.parent.user.id,
    'HOMEWORK_ASSIGNED',
    {
      title: parsed.data.title,
      dueDate: new Date(parsed.data.dueDate).toLocaleDateString('ar-EG'),
    },
  )

  return NextResponse.json({ ok: true, homework }, { status: 201 })
}

/**
 * PATCH /api/dashboard/teacher/homework
 * Review a homework submission (grade + feedback).
 * Body: { homeworkId, grade, feedback }
 */
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const teacher = await db.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const body = await req.json()
  const { homeworkId, grade, feedback } = body as {
    homeworkId: string
    grade: number
    feedback?: string
  }

  if (!homeworkId || grade === undefined || grade < 0 || grade > 100) {
    return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 422 })
  }

  const homework = await db.homework.findUnique({
    where: { id: homeworkId },
    include: { student: { include: { parent: { include: { user: { select: { id: true } } } } } } },
  })
  if (!homework || homework.teacherId !== teacher.id) {
    return NextResponse.json({ error: 'الواجب غير موجود' }, { status: 404 })
  }
  if (homework.status !== 'SUBMITTED') {
    return NextResponse.json({ error: 'لم يتم تسليم الواجب بعد' }, { status: 400 })
  }

  await db.homework.update({
    where: { id: homeworkId },
    data: {
      grade,
      feedback,
      reviewedAt: new Date(),
      status: 'REVIEWED',
    },
  })

  // Notify parent
  await sendNotification(
    homework.student.parent.user.id,
    'HOMEWORK_REVIEWED',
    {
      title: homework.title,
      grade: String(grade),
    },
  )

  return NextResponse.json({ ok: true, message: 'تم تصحيح الواجب' })
}
