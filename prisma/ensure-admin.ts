/**
 * إضافة حساب admin + التأكد من وجود المستخدمين التجريبيين
 * يشغّل: bun run prisma/ensure-admin.ts
 *
 * هذا السكربت آمن — لا يحذف أي بيانات موجودة، فقط يضيف/يحدّث.
 */
import { db } from '../src/lib/db'

async function main() {
  console.log('🔧 التحقق من المستخدمين التجريبيين...\n')

  // 1. إنشاء أو تحديث حساب الإدارة
  const adminPhone = '+201000000001'
  let admin = await db.user.findFirst({ where: { phone: adminPhone } })
  if (!admin) {
    admin = await db.user.create({
      data: {
        phone: adminPhone,
        email: 'admin@dars-academy.com',
        role: 'ADMIN',
        name: 'إدارة الأكاديمية',
        nameAr: 'إدارة الأكاديمية',
        country: 'EG',
        city: 'القاهرة',
        emailVerified: new Date(),
        phoneVerified: new Date(),
      },
    })
    console.log('✅ تم إنشاء حساب الإدارة')
  } else if (admin.role !== 'ADMIN') {
    admin = await db.user.update({
      where: { id: admin.id },
      data: { role: 'ADMIN', name: 'إدارة الأكاديمية', email: 'admin@dars-academy.com' },
    })
    console.log('✅ تم تحديث حساب الإدارة (كان ' + admin.role + ')')
  } else {
    console.log('✓ حساب الإدارة موجود بالفعل')
  }

  // 2. التأكد من وجود معلم تجريبي
  const teacherPhone = '+201000000010'
  let teacher = await db.user.findFirst({ where: { phone: teacherPhone } })
  if (!teacher) {
    teacher = await db.user.create({
      data: {
        phone: teacherPhone,
        role: 'TEACHER',
        name: 'م. أحمد الشريف',
        country: 'EG',
        city: 'القاهرة',
        phoneVerified: new Date(),
      },
    })
    // إنشاء ملف المعلم
    await db.teacher.create({
      data: {
        userId: teacher.id,
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
    console.log('✅ تم إنشاء حساب المعلم التجريبي')
  } else {
    console.log('✓ حساب المعلم موجود')
  }

  // 3. التأكد من وجود ولي أمر تجريبي
  const parentPhone = '+201012345678'
  let parent = await db.user.findFirst({ where: { phone: parentPhone } })
  if (!parent) {
    parent = await db.user.create({
      data: {
        phone: parentPhone,
        role: 'PARENT',
        name: 'أحمد محمد',
        country: 'EG',
        city: 'القاهرة',
        phoneVerified: new Date(),
      },
    })
    await db.parent.create({
      data: { userId: parent.id },
    })
    // إضافة طفل تجريبي
    await db.student.create({
      data: {
        parentId: (await db.parent.findUnique({ where: { userId: parent.id } }))!.id,
        name: 'محمد أحمد',
        birthDate: new Date('2015-03-15'),
        gender: 'MALE',
        grade: 'الصف الخامس الابتدائي',
      },
    })
    console.log('✅ تم إنشاء حساب ولي الأمر التجريبي')
  } else {
    console.log('✓ حساب ولي الأمر موجود')
  }

  // 4. عرض كل المستخدمين
  console.log('\n📋 جميع المستخدمين:')
  const allUsers = await db.user.findMany({
    select: { phone: true, name: true, role: true, isActive: true },
    orderBy: { role: 'asc' },
  })
  for (const u of allUsers) {
    const icon = u.role === 'ADMIN' ? '👑' : u.role === 'TEACHER' ? '👩‍🏫' : u.role === 'PARENT' ? '👨‍👩‍👧' : '👤'
    console.log(`  ${icon} ${u.role.padEnd(8)} | ${u.phone} | ${u.name}`)
  }

  console.log('\n✅ اكتمل! استخدم الأرقام أعلاه لتسجيل الدخول')
  console.log('💡 رمز OTP سيظهر في صندوق أصفر بالواجهة')
  await db.$disconnect()
}

main().catch((e) => {
  console.error('❌ خطأ:', e.message)
  process.exit(1)
})
