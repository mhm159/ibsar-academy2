/**
 * زراعة المرة الأولى فقط (Seed Once)
 *
 * بدلاً من زراعة البيانات في كل تشغيل، هذا السكربت يتحقق أولاً:
 *   - إذا كانت قاعدة البيانات تحتوي بيانات حقيقية → يتخطى الزراعة تماماً
 *     (الاعتماد على عمليات CRUD والبيانات الحقيقية المخزنة).
 *   - إذا كانت فارغة (أول تشغيل) → يزرع البيانات للمرة الأولى فقط.
 *
 * التشغيل: bun run prisma/seed-once.ts
 * أو: npx tsx prisma/seed-once.ts
 */
import { db } from '../src/lib/db'

async function main() {
  const userCount = await db.user.count()

  if (userCount > 0) {
    console.log('✓ البيانات موجودة بالفعل (' + userCount + ' مستخدم) — تم تخطي الزراعة.')
    console.log('  يتم الآن الاعتماد على عمليات CRUD والبيانات الحقيقية في قاعدة البيانات.')
    return
  }

  console.log('🌱 قاعدة البيانات فارغة — زراعة البيانات للمرة الأولى فقط...')
  await import('./seed')
  await import('./seed-comprehensive')
  await import('./fix-accounts')
  console.log('✅ تمت زراعة البيانات للمرة الأولى. من الآن فصاعداً كل العمليات عبر CRUD.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
