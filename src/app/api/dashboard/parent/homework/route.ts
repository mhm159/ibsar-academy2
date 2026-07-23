import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'
import { autoGradeHomework, type Question } from '@/components/dashboard/interactive-homework-editor'

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
      // Interactive fields
      questions: h.questionsJson ? JSON.parse(h.questionsJson) : null,
      answers: h.answersJson ? JSON.parse(h.answersJson) : null,
      autoGraded: h.autoGraded,
      totalPoints: h.totalPoints,
      earnedPoints: h.earnedPoints,
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
  const { homeworkId, submissionText, submissionUrl, submissionName, answers } = body as {
    homeworkId: string
    submissionText?: string
    submissionUrl?: string
    submissionName?: string
    // Interactive: { questionId: answer }
    answers?: Record<string, string>
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

  // Auto-grade interactive homework
  let earnedPoints = 0
  let grade: number | null = null
  let newStatus = isLate ? 'LATE' : 'SUBMITTED'
  let fullyGraded = false

  if (homework.questionsJson && answers) {
    const questions = JSON.parse(homework.questionsJson) as Question[]
    const result = autoGradeHomework(questions, answers)
    earnedPoints = result.earnedPoints
    fullyGraded = result.fullyGraded

    // If all questions auto-graded, set grade + mark as REVIEWED
    if (fullyGraded) {
      grade = homework.totalPoints > 0
        ? Math.round((earnedPoints / homework.totalPoints) * 100)
        : 0
      newStatus = 'REVIEWED'
    }
  }

  await db.homework.update({
    where: { id: homeworkId },
    data: {
      submissionText,
      submissionUrl,
      submissionName,
      submittedAt: new Date(),
      status: newStatus,
      answersJson: answers ? JSON.stringify(answers) : null,
      earnedPoints,
      ...(fullyGraded && { grade, reviewedAt: new Date() }),
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

  // If auto-graded, notify parent with result
  if (fullyGraded && grade !== null) {
    const parentUserId = homework.student.parent.userId
    await sendNotification(
      parentUserId,
      'HOMEWORK_REVIEWED',
      {
        title: homework.title,
        grade: String(grade),
      },
    )
  }

  return NextResponse.json({
    ok: true,
    message: fullyGraded ? 'تم تسليم وتصحيح الواجب تلقائياً' : 'تم تسليم الواجب',
    autoGraded: fullyGraded,
    grade,
    earnedPoints,
    totalPoints: homework.totalPoints,
  })
}
