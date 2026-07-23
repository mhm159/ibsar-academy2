import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'

/**
 * GET /api/dashboard/parent/homework
 * Returns homework for parent's children.
 */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const parent = await db.parent.findUnique({
    where: { userId: session.userId },
    include: { students: { select: { id: true, name: true } } },
  })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const studentIds = parent.students.map((s) => s.id)
  const homeworks = await db.homework.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      student: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'desc' },
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
      teacherName: h.teacher.user.name,
      studentName: h.student.name,
      studentId: h.student.id,
      submissionText: h.submissionText,
      submissionUrl: h.submissionUrl,
      submissionName: h.submissionName,
      submittedAt: h.submittedAt,
      grade: h.grade,
      feedback: h.feedback,
      reviewedAt: h.reviewedAt,
      createdAt: h.createdAt,
    })),
    students: parent.students,
  })
}

/**
 * POST /api/dashboard/parent/homework
 * Submit homework (student/parent uploads their work).
 * Body: { homeworkId, submissionText?, submissionUrl?, submissionName? }
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const parent = await db.parent.findUnique({
    where: { userId: session.userId },
    include: { students: { select: { id: true } } },
  })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const body = await req.json()
  const { homeworkId, submissionText, submissionUrl, submissionName } = body as {
    homeworkId: string
    submissionText?: string
    submissionUrl?: string
    submissionName?: string
  }

  if (!homeworkId) {
    return NextResponse.json({ error: 'معرف الواجب مطلوب' }, { status: 422 })
  }

  const homework = await db.homework.findUnique({
    where: { id: homeworkId },
    include: {
      student: { include: { parent: true } },
      teacher: { include: { user: { select: { id: true } } } },
    },
  })
  if (!homework) {
    return NextResponse.json({ error: 'الواجب غير موجود' }, { status: 404 })
  }

  // Verify ownership
  const studentIds = parent.students.map((s) => s.id)
  if (!studentIds.includes(homework.studentId)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  if (homework.status === 'REVIEWED') {
    return NextResponse.json({ error: 'تم تصحيح هذا الواجب بالفعل' }, { status: 400 })
  }

  // Check if late
  const isLate = new Date() > homework.dueDate

  await db.homework.update({
    where: { id: homeworkId },
    data: {
      submissionText,
      submissionUrl,
      submissionName,
      submittedAt: new Date(),
      status: isLate ? 'LATE' : 'SUBMITTED',
    },
  })

  // Notify teacher
  await sendNotification(
    homework.teacher.user.id,
    'HOMEWORK_SUBMITTED',
    {
      title: homework.title,
      studentName: homework.student.name,
    },
  )

  return NextResponse.json({ ok: true, message: 'تم تسليم الواجب' })
}
