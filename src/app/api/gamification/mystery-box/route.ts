// src/app/api/gamification/mystery-box/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Cost of one mystery box (points)
const BOX_COST = 150;

// Rarity distribution (percentage weights)
const RARITY_WEIGHTS = {
  COMMON: 60,
  RARE: 25,
  EPIC: 10,
  LEGENDARY: 5,
};

/**
 * Choose a random reward respecting the rarity weights.
 */
async function pickRandomReward() {
  const rewards = await db.rewardItem.findMany();
  if (!rewards.length) throw new Error('No rewards configured');

  const weighted: { reward: any; weight: number }[] = [];
  for (const r of rewards) {
    const w = (RARITY_WEIGHTS as any)[r.rarity] ?? 0;
    if (w > 0) weighted.push({ reward: r, weight: w });
  }
  const total = weighted.reduce((s, cur) => s + cur.weight, 0);
  const rnd = Math.random() * total;
  let cum = 0;
  for (const { reward, weight } of weighted) {
    cum += weight;
    if (rnd <= cum) return reward;
  }
  // Fallback – return first reward
  return weighted[0].reward;
}

export async function POST(req: NextRequest) {
  // Expect a header identifying the student (for demo purposes)
  const studentId = req.headers.get('x-student-id');
  if (!studentId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  if ((student.pointsBalance ?? 0) < BOX_COST) {
    return NextResponse.json({ error: 'Insufficient points balance' }, { status: 400 });
  }

  // Deduct points atomically and grant reward
  await db.student.update({
    where: { id: studentId },
    data: { pointsBalance: { decrement: BOX_COST } },
  });

  const reward = await pickRandomReward();

  // Record ownership
  await db.studentReward.create({
    data: { studentId, rewardId: reward.id },
  });

  return NextResponse.json({
    reward: {
      id: reward.id,
      name: reward.name,
      type: reward.type,
      rarity: reward.rarity,
      cssValue: reward.cssValue,
      imageUrl: reward.imageUrl ?? null,
    },
    newBalance: (student.pointsBalance ?? 0) - BOX_COST,
  });
}

import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

const MYSTERY_BOX_PRICE = 150

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
        parent: { userId: sessionUser.userId }
      },
      include: {
        rewards: { select: { rewardId: true } }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })
    }

    if (student.pointsBalance < MYSTERY_BOX_PRICE) {
      return NextResponse.json({ error: 'رصيد النقاط غير كافٍ' }, { status: 400 })
    }

    // 1. Get all rewards
    const allRewards = await db.rewardItem.findMany()
// src/app/api/gamification/mystery-box/route.ts
import { db } from '@/lib/db';
import type { NextApiRequest, NextApiResponse } from 'next';

// Cost of one mystery box (points)
const BOX_COST = 150;

// Rarity distribution (percentage weights)
const RARITY_WEIGHTS = {
  COMMON: 60,
  RARE: 25,
  EPIC: 10,
  LEGENDARY: 5,
};

/**
 * Choose a random reward respecting the rarity weights.
 */
async function pickRandomReward() {
  const rewards = await db.rewardItem.findMany();
  if (!rewards.length) throw new Error('No rewards configured');

  const weighted: { reward: any; weight: number }[] = [];
  for (const r of rewards) {
    const w = (RARITY_WEIGHTS as any)[r.rarity] ?? 0;
    if (w > 0) weighted.push({ reward: r, weight: w });
  }
  const total = weighted.reduce((s, cur) => s + cur.weight, 0);
  const rnd = Math.random() * total;
  let cum = 0;
  for (const { reward, weight } of weighted) {
    cum += weight;
    if (rnd <= cum) return reward;
  }
  return weighted[0].reward; // fallback
}
