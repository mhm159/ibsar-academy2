import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const sessionUser = await getSession()
  if (!sessionUser || sessionUser.role !== 'STUDENT' && sessionUser.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  try {
    const { sessionId, score } = await req.json()
    if (!sessionId || typeof score !== 'number') {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
    }

    // ProgressReport might already exist if teacher filled it early,
    // or we create a partial one if it doesn't exist. 
    // Usually teacher fills it *after* the session, so we can upsert or wait.
    // For MVP, we will try to find the Booking to get the studentId.
    
    // 1. Get the booking for this session & user
    const booking = await db.booking.findFirst({
      where: {
        sessionId,
        student: { parent: { userId: sessionUser.userId } }
      },
      include: { session: true }
    })

    if (!booking) {
      return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 })
    }

    // 2. Upsert ProgressReport
    await db.progressReport.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: booking.studentId
        }
      },
      update: {
        focusScore: score
      },
      create: {
        sessionId,
        studentId: booking.studentId,
        teacherId: booking.session.teacherId,
        focusScore: score
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Focus save error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ التقرير' }, { status: 500 })
  }
}
