/**
 * بذر بيانات الـ Gamification: الأوسمة + النقاط للطلاب
 * يشغّل: bun run prisma/seed-gamification.ts
 */
import { db } from '../src/lib/db'
import {
  seedBadges,
  awardPoints,
  updateStreak,
  checkAndUnlockBadges,
} from '../src/lib/gamification'

async function main() {
  console.log('🌱 بذر بيانات الـ Gamification...')

  // 1. بذر الأوسمة
  await seedBadges()

  // 2. منح نقاط للطلاب بناءً على الحصص المكتملة
  const students = await db.student.findMany({
    include: {
      bookings: {
        where: { status: 'COMPLETED' },
      },
    },
  })

  for (const student of students) {
    const completed = student.bookings.length
    if (completed === 0) continue

    console.log(`  📊 ${student.name}: ${completed} حصص مكتملة`)

    // جلب تقارير التقدم
    const reports = await db.progressReport.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'asc' },
    })

    // منح نقاط لكل حصة
    for (let i = 0; i < completed; i++) {
      await awardPoints({
        studentId: student.id,
        points: 50,
        reason: 'SESSION_COMPLETED',
        description: `إكمال حصة #${i + 1}`,
      })

      // نقاط إضافية للدرجات العالية
      const report = reports[i]
      if (report) {
        if (report.score >= 95) {
          await awardPoints({
            studentId: student.id,
            points: 200,
            reason: 'PERFECT_SCORE',
            description: `درجة مثالية: ${report.score}%`,
          })
        } else if (report.score >= 80) {
          await awardPoints({
            studentId: student.id,
            points: 100,
            reason: 'HIGH_SCORE',
            description: `درجة عالية: ${report.score}%`,
          })
        }
      }
    }

    // تحديث الـ streak
    await updateStreak(student.id)

    // فحص وفتح الأوسمة
    const newBadges = await checkAndUnlockBadges(student.id)
    if (newBadges.length > 0) {
      console.log(`  🏅 فُتحت ${newBadges.length} أوسمة: ${newBadges.map((b) => b.icon).join(' ')}`)
    }
  }

  console.log('\n✅ تم بذر بيانات الـ Gamification!')
  await db.$disconnect()
}

main().catch((e) => {
  console.error('❌ خطأ:', e.message)
  process.exit(1)
})
