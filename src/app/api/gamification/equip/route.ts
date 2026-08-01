import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const sessionUser = await getSession()
  if (!sessionUser || sessionUser.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  try {
    const { studentId, rewardId } = await req.json()
    if (!studentId || !rewardId) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
    }

    // Verify ownership
    const studentReward = await db.studentReward.findFirst({
      where: {
        studentId,
        rewardId,
        student: { parent: { userId: sessionUser.userId } }
      },
      include: { reward: true }
    })

    if (!studentReward) {
      return NextResponse.json({ error: 'لا تملك هذا العنصر أو الطالب غير موجود' }, { status: 404 })
    }

    // Equip it
    if (studentReward.reward.type === 'FRAME') {
      await db.student.update({
        where: { id: studentId },
        data: { activeFrameId: studentReward.rewardId }
      })
    } else if (studentReward.reward.type === 'TITLE') {
      await db.student.update({
        where: { id: studentId },
        data: { activeTitleId: studentReward.rewardId }
      })
    }

    return NextResponse.json({ success: true, type: studentReward.reward.type })

  } catch (error) {
    console.error('Equip Error:', error)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
