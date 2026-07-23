/**
 * Ibsar Academy — Gamification Engine
 *
 * Awards points + tracks streaks + unlocks badges when students:
 *   - Complete a session
 *   - Score high in progress reports
 *   - Maintain a daily streak
 *   - Reach milestones (10 sessions, 1000 points, etc.)
 *
 * Called from session completion hooks + progress report creation.
 */

import { db } from '@/lib/db'

/** Points awarded per action */
export const POINTS = {
  SESSION_COMPLETED: 50,
  HIGH_SCORE: 100, // score >= 80
  PERFECT_SCORE: 200, // score >= 95
  STREAK_BONUS: 25, // per day of streak (capped)
  BADGE_UNLOCKED: 0, // badges don't give points, they're rewards themselves
  HOMEWORK_DONE: 15,
  ATTENDANCE: 10,
} as const

/** Level thresholds (cumulative points needed) */
export const LEVELS = [
  { level: 1, name: 'مبتدئ', nameEn: 'Beginner', icon: '🌱', minPoints: 0, color: '#4ECDC4' },
  { level: 2, name: 'متعلم', nameEn: 'Learner', icon: '📖', minPoints: 100, color: '#6C5CE7' },
  { level: 3, name: 'متمرّس', nameEn: 'Practitioner', icon: '⚔️', minPoints: 300, color: '#FF6B6B' },
  { level: 4, name: 'ماهر', nameEn: 'Skilled', icon: '🎯', minPoints: 600, color: '#FFE66D' },
  { level: 5, name: 'خبير', nameEn: 'Expert', icon: '🏅', minPoints: 1000, color: '#FF8E53' },
  { level: 6, name: 'محترف', nameEn: 'Professional', icon: '🏆', minPoints: 1500, color: '#A29BFE' },
  { level: 7, name: 'أسطورة', nameEn: 'Legend', icon: '👑', minPoints: 2500, color: '#FFD700' },
  { level: 8, name: 'بطل إبصار', nameEn: 'Ibsar Champion', icon: '🌟', minPoints: 5000, color: '#FF6B6B' },
]

/** Get level info from total points */
export function getLevelFromPoints(totalPoints: number) {
  let current = LEVELS[0]
  let next = LEVELS[1] ?? null
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalPoints >= LEVELS[i].minPoints) {
      current = LEVELS[i]
      next = LEVELS[i + 1] ?? null
    } else {
      break
    }
  }
  const progress = next
    ? Math.round(
        ((totalPoints - current.minPoints) / (next.minPoints - current.minPoints)) * 100,
      )
    : 100
  const pointsToNext = next ? next.minPoints - totalPoints : 0
  return { current, next, progress, pointsToNext }
}

/** Award points to a student + log the transaction */
export async function awardPoints(params: {
  studentId: string
  points: number
  reason: string
  description: string
  refId?: string
}): Promise<{ newTotal: number; levelUp: boolean }> {
  const { studentId, points, reason, description, refId } = params

  // Get student name
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { name: true },
  })

  // Log the points
  await db.pointsLog.create({
    data: {
      studentId,
      studentName: student?.name ?? 'طالب',
      points,
      reason,
      description,
      refId,
    },
  })

  // Get new total
  const newTotal = await getStudentTotalPoints(studentId)

  // Check for level up
  const beforeLevel = await getStudentLevelBefore(studentId, points)
  const afterLevel = getLevelFromPoints(newTotal)
  const levelUp = afterLevel.current.level > beforeLevel

  return { newTotal, levelUp }
}

/** Get student's total points (sum of all PointsLog) */
export async function getStudentTotalPoints(studentId: string): Promise<number> {
  const result = await db.pointsLog.aggregate({
    where: { studentId },
    _sum: { points: true },
  })
  return result._sum.points ?? 0
}

/** Helper: get the level the student was at before the last points award */
async function getStudentLevelBefore(studentId: string, lastPoints: number): Promise<number> {
  const result = await db.pointsLog.aggregate({
    where: { studentId },
    _sum: { points: true },
  })
  const total = (result._sum.points ?? 0) - lastPoints
  return getLevelFromPoints(total).current.level
}

/**
 * Update streak when a session is completed.
 * Streak increments if last session was yesterday; resets if gap > 1 day.
 */
export async function updateStreak(studentId: string): Promise<{
  currentStreak: number
  longestStreak: number
  streakBonus: number
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await db.streak.findUnique({ where: { studentId } })
  const lastDate = existing?.lastSessionDate ? new Date(existing.lastSessionDate) : null
  if (lastDate) lastDate.setHours(0, 0, 0, 0)

  let newStreak = 1
  if (lastDate) {
    const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      newStreak = (existing?.currentStreak ?? 0) + 1
    } else if (diffDays === 0) {
      // Already completed a session today, keep streak
      newStreak = existing?.currentStreak ?? 1
    } else {
      newStreak = 1
    }
  }

  const longestStreak = Math.max(existing?.longestStreak ?? 0, newStreak)
  const streakBonus = Math.min(newStreak, 7) * POINTS.STREAK_BONUS // cap at 7 days

  await db.streak.upsert({
    where: { studentId },
    update: {
      currentStreak: newStreak,
      longestStreak,
      lastSessionDate: today,
    },
    create: {
      studentId,
      currentStreak: newStreak,
      longestStreak,
      lastSessionDate: today,
    },
  })

  return { currentStreak: newStreak, longestStreak, streakBonus }
}

/**
 * Check + unlock badges for a student based on current stats.
 * Returns newly unlocked badges.
 */
export async function checkAndUnlockBadges(studentId: string): Promise<
  Array<{ id: string; slug: string; name: string; nameAr: string; icon: string; color: string; tier: string }>
> {
  const [totalPoints, completedSessions, streak, progressReports, existingBadges] = await Promise.all([
    getStudentTotalPoints(studentId),
    db.booking.count({ where: { studentId, status: 'COMPLETED' } }),
    db.streak.findUnique({ where: { studentId } }),
    db.progressReport.findMany({
      where: { studentId },
      select: { score: true },
    }),
    db.studentBadge.findMany({
      where: { studentId },
      include: { badge: true },
    }),
  ])

  const highScores = progressReports.filter((r) => r.score >= 80).length
  const currentStreak = streak?.currentStreak ?? 0
  const existingSlugs = new Set(existingBadges.map((sb) => sb.badge.slug))

  // Fetch all active badges
  const allBadges = await db.badge.findMany({ where: { isActive: true } })

  const newlyUnlocked: any[] = []
  for (const badge of allBadges) {
    if (existingSlugs.has(badge.slug)) continue

    let meetsRequirement = false
    switch (badge.requirementType) {
      case 'SESSIONS_COMPLETED':
        meetsRequirement = completedSessions >= badge.requirementValue
        break
      case 'TOTAL_POINTS':
        meetsRequirement = totalPoints >= badge.requirementValue
        break
      case 'STREAK_DAYS':
        meetsRequirement = currentStreak >= badge.requirementValue
        break
      case 'HIGH_SCORES':
        meetsRequirement = highScores >= badge.requirementValue
        break
    }

    if (meetsRequirement) {
      await db.studentBadge.create({
        data: { studentId, badgeId: badge.id },
      })
      newlyUnlocked.push({
        id: badge.id,
        slug: badge.slug,
        name: badge.name,
        nameAr: badge.nameAr,
        icon: badge.icon,
        color: badge.color,
        tier: badge.tier,
      })
    }
  }

  return newlyUnlocked
}

/** Get full gamification profile for a student */
export async function getStudentGamification(studentId: string) {
  const [totalPoints, pointsLog, badges, streak, completedSessions] = await Promise.all([
    getStudentTotalPoints(studentId),
    db.pointsLog.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    db.studentBadge.findMany({
      where: { studentId },
      include: { badge: true },
      orderBy: { unlockedAt: 'desc' },
    }),
    db.streak.findUnique({ where: { studentId } }),
    db.booking.count({ where: { studentId, status: 'COMPLETED' } }),
  ])

  const level = getLevelFromPoints(totalPoints)
  const allBadges = await db.badge.findMany({ where: { isActive: true } })

  return {
    totalPoints,
    level,
    completedSessions,
    streak: streak
      ? { current: streak.currentStreak, longest: streak.longestStreak }
      : { current: 0, longest: 0 },
    unlockedBadges: badges.map((sb) => ({
      id: sb.badge.id,
      slug: sb.badge.slug,
      name: sb.badge.name,
      nameAr: sb.badge.nameAr,
      description: sb.badge.description,
      icon: sb.badge.icon,
      color: sb.badge.color,
      tier: sb.badge.tier,
      unlockedAt: sb.unlockedAt,
    })),
    lockedBadges: allBadges
      .filter((b) => !badges.some((sb) => sb.badgeId === b.id))
      .map((b) => ({
        id: b.id,
        slug: b.slug,
        name: b.name,
        nameAr: b.nameAr,
        description: b.description,
        icon: b.icon,
        color: b.color,
        tier: b.tier,
        requirementType: b.requirementType,
        requirementValue: b.requirementValue,
      })),
    recentPoints: pointsLog.map((p) => ({
      id: p.id,
      points: p.points,
      reason: p.reason,
      description: p.description,
      createdAt: p.createdAt,
    })),
  }
}

/** Get leaderboard (top N students by total points) */
export async function getLeaderboard(limit: number = 20) {
  // Aggregate points per student (groupBy on studentId only)
  const leaderboard = await db.pointsLog.groupBy({
    by: ['studentId'],
    _sum: { points: true },
    orderBy: { _sum: { points: 'desc' } },
    take: limit,
  })

  // Enrich with student info + badges count + streak
  const enriched = await Promise.all(
    leaderboard.map(async (entry, index) => {
      const [badgesCount, streak, student, lastLog] = await Promise.all([
        db.studentBadge.count({ where: { studentId: entry.studentId } }),
        db.streak.findUnique({ where: { studentId: entry.studentId } }),
        db.student.findUnique({
          where: { id: entry.studentId },
          select: { name: true, gender: true, grade: true },
        }),
        db.pointsLog.findFirst({
          where: { studentId: entry.studentId },
          orderBy: { createdAt: 'desc' },
          select: { studentName: true },
        }),
      ])
      const totalPoints = entry._sum.points ?? 0
      const level = getLevelFromPoints(totalPoints)
      return {
        rank: index + 1,
        studentId: entry.studentId,
        studentName: student?.name ?? lastLog?.studentName ?? 'طالب',
        totalPoints,
        level: level.current,
        badgesCount,
        currentStreak: streak?.currentStreak ?? 0,
        gender: student?.gender ?? null,
        grade: student?.grade ?? null,
      }
    }),
  )

  return enriched
}

/** Seed default badges (call once) */
export async function seedBadges() {
  const badges = [
    { slug: 'first_lesson', name: 'First Lesson', nameAr: 'أول حصة', description: 'أكمل أول حصة لك', icon: '🎯', color: '#4ECDC4', requirementType: 'SESSIONS_COMPLETED', requirementValue: 1, tier: 'BRONZE' },
    { slug: 'sessions_5', name: 'Getting Started', nameAr: 'بداية رحلة', description: 'أكمل 5 حصص', icon: '📚', color: '#6C5CE7', requirementType: 'SESSIONS_COMPLETED', requirementValue: 5, tier: 'BRONZE' },
    { slug: 'sessions_10', name: 'Dedicated', nameAr: 'مثابر', description: 'أكمل 10 حصص', icon: '⭐', color: '#FFE66D', requirementType: 'SESSIONS_COMPLETED', requirementValue: 10, tier: 'SILVER' },
    { slug: 'sessions_25', name: 'Scholar', nameAr: 'مجتهد', description: 'أكمل 25 حصة', icon: '🎓', color: '#FF8E53', requirementType: 'SESSIONS_COMPLETED', requirementValue: 25, tier: 'GOLD' },
    { slug: 'streak_3', name: 'On Fire', nameAr: 'مشتعلة', description: '3 أيام متتالية', icon: '🔥', color: '#FF6B6B', requirementType: 'STREAK_DAYS', requirementValue: 3, tier: 'BRONZE' },
    { slug: 'streak_7', name: 'Week Warrior', nameAr: 'بطل الأسبوع', description: '7 أيام متتالية', icon: '⚡', color: '#FFE66D', requirementType: 'STREAK_DAYS', requirementValue: 7, tier: 'SILVER' },
    { slug: 'streak_30', name: 'Unstoppable', nameAr: 'لا يُوقَف', description: '30 يوم متتالية', icon: '💎', color: '#A29BFE', requirementType: 'STREAK_DAYS', requirementValue: 30, tier: 'PLATINUM' },
    { slug: 'high_score_1', name: 'Bright Spark', nameAr: 'لمعة', description: 'احصل على درجة عالية في حصة', icon: '✨', color: '#FFE66D', requirementType: 'HIGH_SCORES', requirementValue: 1, tier: 'BRONZE' },
    { slug: 'high_score_5', name: 'Star Student', nameAr: 'طالب نجمة', description: '5 درجات عالية', icon: '🌟', color: '#FF8E53', requirementType: 'HIGH_SCORES', requirementValue: 5, tier: 'SILVER' },
    { slug: 'high_score_15', name: 'Genius', nameAr: 'عبقري', description: '15 درجة عالية', icon: '🧠', color: '#6C5CE7', requirementType: 'HIGH_SCORES', requirementValue: 15, tier: 'GOLD' },
    { slug: 'points_500', name: 'Rising Star', nameAr: 'نجمة صاعدة', description: 'اجمع 500 نقطة', icon: '📈', color: '#4ECDC4', requirementType: 'TOTAL_POINTS', requirementValue: 500, tier: 'SILVER' },
    { slug: 'points_2000', name: 'Champion', nameAr: 'بطل', description: 'اجمع 2000 نقطة', icon: '🏆', color: '#FFD700', requirementType: 'TOTAL_POINTS', requirementValue: 2000, tier: 'GOLD' },
  ]

  for (const badge of badges) {
    await db.badge.upsert({
      where: { slug: badge.slug },
      update: {},
      create: badge,
    })
  }
  console.log(`✓ Seeded ${badges.length} badges`)
}
