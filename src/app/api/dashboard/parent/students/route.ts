import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

/** GET /api/dashboard/parent/students — list current parent's children */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const parent = await db.parent.findUnique({
    where: { userId: session.userId },
    include: {
      students: {
        orderBy: { birthDate: 'asc' },
      },
    },
  })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  // Enrich each student with session counts
  const enriched = await Promise.all(
    parent.students.map(async (s) => {
      const completed = await db.booking.count({
        where: { studentId: s.id, status: 'COMPLETED' },
      })
      const upcoming = await db.booking.count({
        where: {
          studentId: s.id,
          status: 'CONFIRMED',
          session: { startTime: { gt: new Date() } },
        },
      })
      return { ...s, completedSessions: completed, upcomingSessions: upcoming }
    }),
  )

  return NextResponse.json({ students: enriched })
}

const CreateStudent = z.object({
  name: z.string().min(2).max(80),
  birthDate: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  grade: z.string().max(80).optional(),
  levels: z.record(z.string(), z.string()).optional(),
})

/** POST /api/dashboard/parent/students — add a new child */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }
  const parsed = CreateStudent.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'البيانات غير صحيحة', details: parsed.error.flatten() },
      { status: 422 },
    )
  }
  const parent = await db.parent.findUnique({ where: { userId: session.userId } })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const student = await db.student.create({
    data: {
      parentId: parent.id,
      name: parsed.data.name,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      gender: parsed.data.gender,
      grade: parsed.data.grade,
      levelsJson: JSON.stringify(parsed.data.levels ?? {}),
    },
  })

  return NextResponse.json({ ok: true, student }, { status: 201 })
}

/** PATCH /api/dashboard/parent/students — update a child */
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) {
    return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 422 })
  }

  // Verify ownership
  const parent = await db.parent.findUnique({ where: { userId: session.userId } })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }
  const student = await db.student.findUnique({ where: { id } })
  if (!student || student.parentId !== parent.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const updated = await db.student.update({
    where: { id },
    data: {
      ...(updates.name && { name: updates.name }),
      ...(updates.birthDate && { birthDate: new Date(updates.birthDate) }),
      ...(updates.gender && { gender: updates.gender }),
      ...(updates.grade !== undefined && { grade: updates.grade }),
      ...(updates.levels && { levelsJson: JSON.stringify(updates.levels) }),
    },
  })

  return NextResponse.json({ ok: true, student: updated })
}

/** DELETE /api/dashboard/parent/students — remove a child */
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 422 })
  }
  const parent = await db.parent.findUnique({ where: { userId: session.userId } })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }
  const student = await db.student.findUnique({ where: { id } })
  if (!student || student.parentId !== parent.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  await db.student.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

/* TODO(phase-2): Add level assessment flow when student is created. */
