import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { releaseEscrow, createEscrowForTransaction } from '@/lib/payment/escrow'
import { sendNotification } from '@/lib/notifications'
import { awardPoints, updateStreak, checkAndUnlockBadges } from '@/lib/gamification'

/**
 * POST /api/dashboard/teacher/complete-session
 * Body: { sessionId }
 *
 * Teacher marks a session as COMPLETED.
 * This triggers the full financial flow:
 *   1. Session status → COMPLETED
 *   2. Find all bookings with PAID transactions
 *   3. Ensure escrow exists for each (create if missing)
 *   4. Release escrow → teacher gets share, academy gets commission
 *   5. Award gamification points to student
 *   6. Notify parent
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json()
  const { sessionId } = body as { sessionId: string }

  if (!sessionId) {
    return NextResponse.json({ error: 'معرف الحصة مطلوب' }, { status: 422 })
  }

  // Fetch session + verify teacher owns it
  const sess = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      teacher: { include: { user: { select: { id: true, name: true } } } },
      bookings: {
        include: {
          student: {
            include: {
              parent: { include: { user: { select: { id: true, name: true } } } },
            },
          },
          transaction: { select: { id: true, status: true } },
        },
      },
    },
  })

  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }

  if (sess.teacher.userId !== session.userId) {
    return NextResponse.json({ error: 'لست معلم هذه الحصة' }, { status: 403 })
  }

  if (sess.status === 'COMPLETED') {
    return NextResponse.json({ error: 'تم إكمال هذه الحصة بالفعل' }, { status: 400 })
  }

  // 1. Mark session as COMPLETED
  await db.session.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED' },
  })

  let releasedCount = 0
  let teacherEarnedEGP = 0
  let academyCommissionEGP = 0

  // 2. Process each booking
  for (const booking of sess.bookings) {
    if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') continue

    // Update booking status
    await db.booking.update({
      where: { id: booking.id },
      data: { status: 'COMPLETED' },
    })

    // 3. Ensure escrow exists
    if (booking.transaction?.status === 'PAID' && booking.transaction.id) {
      const escrowResult = await createEscrowForTransaction(booking.transaction.id)
      if (escrowResult.ok) {
        // 4. Release escrow immediately (session completed)
        const releaseResult = await releaseEscrow(escrowResult.escrowId, session.userId)
        if (releaseResult.ok) {
          releasedCount++
          // Get escrow details for amounts
          const escrow = await db.escrow.findUnique({
            where: { id: escrowResult.escrowId },
            select: { teacherShareEGP: true, platformFeeEGP: true },
          })
          if (escrow) {
            teacherEarnedEGP += escrow.teacherShareEGP
            academyCommissionEGP += escrow.platformFeeEGP
          }
        }
      } else {
        // Escrow might already exist — try to release it
        const existing = await db.escrow.findUnique({
          where: { transactionId: booking.transaction.id },
        })
        if (existing && existing.status === 'HELD') {
          const releaseResult = await releaseEscrow(existing.id, session.userId)
          if (releaseResult.ok) {
            releasedCount++
            teacherEarnedEGP += existing.teacherShareEGP
            academyCommissionEGP += existing.platformFeeEGP
          }
        }
      }
    }

    // 5. Gamification: award points to student
    await awardPoints({
      studentId: booking.studentId,
      points: 50,
      reason: 'SESSION_COMPLETED',
      description: `إكمال حصة: ${sess.title}`,
      refId: sessionId,
    })

    // Update streak
    await updateStreak(booking.studentId)

    // Check badges
    await checkAndUnlockBadges(booking.studentId)

    // 6. Notify parent
    await sendNotification(
      booking.student.parent.user.id,
      'PROGRESS_UPDATED',
      {
        studentName: booking.student.name,
        score: '100', // will be updated when teacher submits progress report
      },
    )
  }

  return NextResponse.json({
    ok: true,
    message: `تم إكمال الحصة — ${releasedCount} طالب`,
    details: {
      releasedCount,
      teacherEarnedEGP: teacherEarnedEGP / 100, // convert piasters to pounds
      academyCommissionEGP: academyCommissionEGP / 100,
    },
  })
}
