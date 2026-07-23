import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getStudentGamification } from '@/lib/gamification'

/** GET /api/dashboard/parent/gamification?student=<id> */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const studentId = new URL(req.url).searchParams.get('student')
  if (!studentId) {
    return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 422 })
  }

  // Verify ownership
  const parent = await db.parent.findUnique({
    where: { userId: session.userId },
    include: { students: { select: { id: true, name: true } } },
  })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }
  if (!parent.students.some((s) => s.id === studentId)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const gamification = await getStudentGamification(studentId)
  return NextResponse.json({
    ...gamification,
    students: parent.students,
  })
}
