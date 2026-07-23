/**
 * إصلاح سريع: يضمن وجود كل الحسابات التجريبية
 * بدون ما يمسح أي بيانات موجودة
 *
 * تشغيل: bun run prisma/fix-accounts.ts
 * أو: npx tsx prisma/fix-accounts.ts
 */
import { db } from '../src/lib/db'

async function main() {
  console.log('إصلاح الحسابات التجريبية...\n')

  // قائمة الحسابات المطلوبة
  const accounts = [
    {
      phone: '+201000000001',
      role: 'ADMIN',
      name: 'إدارة الأكاديمية',
      email: 'admin@ibsar-academy.com',
    },
    {
      phone: '+201000000010',
      role: 'TEACHER',
      name: 'م. أحمد الشريف',
    },
    {
      phone: '+201012345678',
      role: 'PARENT',
      name: 'أحمد محمد',
    },
  ]

  for (const acc of accounts) {
    // ابحث بالرقم بالضبط
    let user = await db.user.findFirst({ where: { phone: acc.phone } })

    // لو مش موجود، ابحث بأي صيغة (بدون +20 أو بـ 0)
    if (!user) {
      const localPhone = acc.phone.replace('+20', '0')
      user = await db.user.findFirst({ where: { phone: localPhone } })
      if (user) {
        // حدّث الرقم للصيغة القياسية
        user = await db.user.update({
          where: { id: user.id },
          data: { phone: acc.phone, role: acc.role, name: acc.name },
        })
        console.log(`✅ تم تحديث: ${acc.role} | ${acc.phone} | ${acc.name}`)
        continue
      }
    }

    if (user) {
      // تأكد إن الدور صحيح
      if (user.role !== acc.role) {
        user = await db.user.update({
          where: { id: user.id },
          data: { role: acc.role, name: acc.name, phone: acc.phone },
        })
        console.log(`✅ تم تصحيح الدور: ${acc.role} | ${acc.phone} | ${acc.name}`)
      } else {
        console.log(`✓ موجود: ${acc.role} | ${acc.phone} | ${acc.name}`)
      }
    } else {
      // أنشئ جديد
      user = await db.user.create({
        data: {
          phone: acc.phone,
          email: acc.email ?? null,
          role: acc.role,
          name: acc.name,
          country: 'EG',
          city: 'القاهرة',
          phoneVerified: new Date(),
          emailVerified: acc.email ? new Date() : null,
        },
      })
      console.log(`✅ تم إنشاء: ${acc.role} | ${acc.phone} | ${acc.name}`)

      // أنشئ ملف إضافي حسب الدور
      if (acc.role === 'TEACHER') {
        await db.teacher.create({
          data: {
            userId: user.id,
            bio: 'مهندس برمجيات سابق في شركات عالمية',
            tracks: 'PROGRAMMING,ROBOTICS',
            experienceYears: 8,
            hourlyRateEGP: 200,
            hourlyRateUSD: 20,
            rating: 4.9,
            reviewsCount: 187,
            status: 'APPROVED',
            isFeatured: true,
          },
        })
      } else if (acc.role === 'PARENT') {
        const parent = await db.parent.create({
          data: { userId: user.id },
        })
        await db.student.create({
          data: {
            parentId: parent.id,
            name: 'محمد أحمد',
            birthDate: new Date('2015-03-15'),
            gender: 'MALE',
            grade: 'الصف الخامس الابتدائي',
          },
        })
      }
    }
  }

  // اعرض كل المستخدمين
  console.log('\n所有 المستخدمين في قاعدة البيانات:')
  const allUsers = await db.user.findMany({
    select: { phone: true, name: true, role: true, isActive: true },
    orderBy: { role: 'asc' },
  })
  for (const u of allUsers) {
    const icon = u.role === 'ADMIN' ? '👑' : u.role === 'TEACHER' ? '👩‍🏫' : u.role === 'PARENT' ? '👨‍👩‍👧' : '👤'
    console.log(`  ${icon} ${u.role.padEnd(8)} | ${u.phone} | ${u.name}`)
  }

  console.log('\n✅ تم! استخدم الأرقام أعلاه لتسجيل الدخول')
  console.log('💡 رمز OTP سيظهر في صندوق أصفر بالواجهة')
  await db.$disconnect()
}

main().catch((e) => {
  console.error('❌ خطأ:', e.message)
  process.exit(1)
})
