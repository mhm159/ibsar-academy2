// src/app/api/gamification/mystery-box/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

const MYSTERY_BOX_PRICE = 150

// Rarity distribution (percentage weights)
const RARITY_WEIGHTS = {
  COMMON: 60,
  RARE: 25,
  EPIC: 10,
  LEGENDARY: 5,
}

/**
 * Choose a random reward respecting the rarity weights.
 */
async function pickRandomReward() {
  const rewards = await db.rewardItem.findMany()
  if (!rewards.length) throw new Error('لا توجد جوائز متاحة حالياً')

  const weighted: { reward: (typeof rewards)[0]; weight: number }[] = []
  for (const r of rewards) {
    const w = (RARITY_WEIGHTS as Record<string, number>)[r.rarity] ?? 0
    if (w > 0) weighted.push({ reward: r, weight: w })
  }

  if (!weighted.length) throw new Error('لا توجد جوائز قابلة للسحب')

  const total = weighted.reduce((s, cur) => s + cur.weight, 0)
  const rnd = Math.random() * total
  let cum = 0
  for (const { reward, weight } of weighted) {
    cum += weight
    if (rnd <= cum) return reward
  }
  // Fallback – return first reward
  return weighted[0].reward
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSession()
  if (!sessionUser || sessionUser.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  try {
    const { studentId } = await req.json()
    if (!studentId) {
      return NextResponse.json({ error: 'طالب غير محدد' }, { status: 400 })
    }

    // Verify student belongs to parent
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        parent: { userId: sessionUser.userId },
      },
      include: {
        rewards: { select: { rewardId: true } },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })
    }

    if (student.pointsBalance < MYSTERY_BOX_PRICE) {
      return NextResponse.json({ error: 'رصيد النقاط غير كافٍ' }, { status: 400 })
    }

    // Pick a random reward
    const reward = await pickRandomReward()

    // Deduct points & record reward in a transaction
    await db.$transaction([
      db.student.update({
        where: { id: studentId },
        data: { pointsBalance: { decrement: MYSTERY_BOX_PRICE } },
      }),
      db.studentReward.upsert({
        where: { studentId_rewardId: { studentId, rewardId: reward.id } },
        create: { studentId, rewardId: reward.id },
        update: {}, // already owns it — no-op
      }),
    ])

    // Re-fetch updated balance
    const updated = await db.student.findUnique({
      where: { id: studentId },
      select: { pointsBalance: true },
    })

    return NextResponse.json({
      reward: {
        id: String(reward.id),
        name: reward.name,
        type: reward.type,
        rarity: reward.rarity,
        cssValue: reward.cssValue,
        imageUrl: reward.imageUrl ?? null,
      },
      newBalance: updated?.pointsBalance ?? 0,
    })
  } catch (error) {
    console.error('Mystery Box Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' },
      { status: 500 },
    )
  }
}
