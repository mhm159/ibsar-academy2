/**
 * بذر بيانات الدفع: العملات + المحافظ + الكوبونات + الضمانات
 * يشغّل: bun run prisma/seed-payments.ts
 */
import { db } from '../src/lib/db'
import { CURRENCIES } from '../src/lib/payment/config'

async function main() {
  console.log('🌱 بذر بيانات الدفع...')

  // 1. أسعار العملات
  for (const [code, meta] of Object.entries(CURRENCIES)) {
    await db.currencyRate.upsert({
      where: { code },
      update: { rateToUSD: meta.rateToUSD },
      create: {
        code,
        name: meta.name,
        nameAr: meta.nameAr,
        symbol: meta.symbol,
        rateToUSD: meta.rateToUSD,
        providers: code === 'EGP' ? 'PAYMOB' : 'STRIPE',
      },
    })
  }
  console.log('  ✅ أسعار العملات')

  // 2. محفظة للمعلم الأول (فودافون كاش)
  const teacher1 = await db.teacher.findFirst({
    where: { user: { phone: { contains: '01000000010' } } },
  })
  if (teacher1) {
    await db.walletAccount.upsert({
      where: { id: 'seed-wallet-1' },
      update: {},
      create: {
        id: 'seed-wallet-1',
        teacherId: teacher1.id,
        type: 'VODAFONE_CASH',
        identifier: '01000000010',
        label: 'محفظتي فودافون',
        holderName: 'أحمد الشريف',
        currency: 'EGP',
        isDefault: true,
      },
    })
    console.log('  ✅ محفظة المعلم (فودافون كاش)')
  }

  // 3. كوبونات
  await db.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      currency: 'EGP',
      maxUses: 100,
      validFrom: new Date(),
      isActive: true,
    },
  })
  await db.coupon.upsert({
    where: { code: 'IBSAR50' },
    update: {},
    create: {
      code: 'IBSAR50',
      type: 'FIXED_AMOUNT',
      value: 50,
      currency: 'EGP',
      maxUses: 50,
      validFrom: new Date(),
      isActive: true,
    },
  })
  console.log('  ✅ الكوبونات (WELCOME10, IBSAR50)')

  // 4. ضمانات للمعاملات المدفوعة (المرتبطة بحجوزات)
  // نربط المعاملات بالحجوزات الموجودة فعلاً + ننشئ escrows
  const allBookings = await db.booking.findMany({
    include: { session: { select: { teacherId: true } } },
  })
  const paidTxs = await db.transaction.findMany({
    where: { status: 'PAID', escrow: null },
  })
  let escrowCount = 0
  for (const tx of paidTxs) {
    // ابحث عن booking مرتبط بهذه المعاملة
    let booking = tx.bookingId ? allBookings.find((b) => b.id === tx.bookingId) : null
    if (!booking) {
      // ابحث عن أي booking بنفس المبلغ التقريبي
      booking = allBookings.find((b) => Math.abs(b.priceEGP - tx.amountEGP) < 50)
    }
    if (!booking) continue

    // اربط المعاملة بالحجز
    if (tx.bookingId !== booking.id) {
      await db.transaction.update({
        where: { id: tx.id },
        data: { bookingId: booking.id },
      })
    }

    const platformFeeEGP = Math.round(tx.amountEGP * 0.15)
    const teacherShareEGP = Math.round(tx.amountEGP * 0.85)
    const platformFeeUSD = Math.round(tx.amountUSD * 0.15)
    const teacherShareUSD = Math.round(tx.amountUSD * 0.85)
    const isFirst = escrowCount === 0
    await db.escrow.create({
      data: {
        transactionId: tx.id,
        bookingId: booking.id,
        teacherId: booking.session.teacherId,
        amountEGP: tx.amountEGP,
        amountUSD: tx.amountUSD,
        platformFeeEGP,
        platformFeeUSD,
        teacherShareEGP,
        teacherShareUSD,
        status: isFirst ? 'RELEASED' : 'HELD',
        releasedAt: isFirst ? new Date() : null,
      },
    })
    escrowCount++
  }
  console.log(`  ✅ ${escrowCount} ضمان (Escrow) — ${escrowCount > 0 ? 1 : 0} مُحرر، ${Math.max(0, escrowCount - 1)} محتجز`)

  console.log('\n✅ تم بذر بيانات الدفع!')
  await db.$disconnect()
}

main().catch((e) => {
  console.error('❌ خطأ:', e.message)
  process.exit(1)
})
