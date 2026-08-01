/**
 * Ibsar Academy — Phase 2 Seed Script
 *
 * Creates demo data so dashboards render with real content:
 * - 1 Admin user
 * - 4 Approved teachers (with courses + availability + sessions)
 * - 1 Pending teacher (for admin approval flow)
 * - 2 Parents with students
 * - Sessions + bookings + transactions + progress reports + notifications
 *
 * Run: bun run db:seed
 *
 * Idempotent: checks for existing data by phone/email before creating.
 */

import { db } from '@/lib/db'

const ADMIN_PHONE = '+201000000001'
const TEACHER_PHONES = [
  '+201000000010', // Ahmed El-Sherif — Programming
  '+201000000011', // Mona Abdullah — Robotics
  '+201000000012', // Sara Fouad — Mental Math
  '+201000000013', // Karim Mostafa — Game Dev
]
const PENDING_TEACHER_PHONE = '+201000000014'
const PARENT_PHONES = ['+201012345678', '+201009998877']

async function main() {
  console.log('🌱 Seeding Ibsar Academy Phase 2 data...')

  // ---------- Admin ----------
  const admin = await db.user.upsert({
    where: { phone: ADMIN_PHONE },
    update: {},
    create: {
      phone: ADMIN_PHONE,
      email: 'admin@ibsar-academy.com',
      role: 'ADMIN',
      name: 'إدارة الأكاديمية',
      nameAr: 'إدارة الأكاديمية',
      country: 'EG',
      city: 'القاهرة',
      emailVerified: new Date(),
      phoneVerified: new Date(),
    },
  })
  console.log(`  ✓ Admin: ${admin.name}`)

  // ---------- Teachers ----------
  const teacherData = [
    {
      phone: TEACHER_PHONES[0],
      name: 'م. أحمد الشريف',
      tracks: 'PROGRAMMING,ROBOTICS',
      bio: 'مهندس برمجيات سابق في شركات عالمية، متخصص في تعليم الأطفال البرمجة بطريقة ممتعة وعملية.',
      experienceYears: 8,
      hourlyRateEGP: 200,
      hourlyRateUSD: 20,
      rating: 4.9,
      reviewsCount: 187,
      isFeatured: true,
      avatar: '👨‍💻',
    },
    {
      phone: TEACHER_PHONES[1],
      name: 'أ. منى عبد الله',
      tracks: 'ROBOTICS',
      bio: 'حاصلة على ماجستير في الهندسة الكهربائية، شاركت بفرق روبوتيكس في مسابقات عالمية.',
      experienceYears: 6,
      hourlyRateEGP: 180,
      hourlyRateUSD: 18,
      rating: 4.8,
      reviewsCount: 142,
      isFeatured: true,
      avatar: '👩‍🔬',
    },
    {
      phone: TEACHER_PHONES[2],
      name: 'أ. سارة فؤاد',
      tracks: 'MENTAL_MATH',
      bio: 'خبيرة في الحساب الذهني والسوروبان، درّبت أكثر من 400 طفل على مهارات الحساب السريع.',
      experienceYears: 10,
      hourlyRateEGP: 150,
      hourlyRateUSD: 15,
      rating: 5.0,
      reviewsCount: 213,
      isFeatured: true,
      avatar: '👩‍🏫',
    },
    {
      phone: TEACHER_PHONES[3],
      name: 'م. كريم مصطفى',
      tracks: 'PROGRAMMING',
      bio: 'مطوّر ألعاب مستقل، يعلّم الأطفال كيف يصنعون ألعابهم الخاصة باستخدام Unity و Godot.',
      experienceYears: 5,
      hourlyRateEGP: 170,
      hourlyRateUSD: 17,
      rating: 4.7,
      reviewsCount: 98,
      isFeatured: false,
      avatar: '👨‍🎨',
    },
  ]

  const teachers: Array<{ user: { id: string; name: string | null }; teacher: { id: string }; avatar: string }> = []
  for (const td of teacherData) {
    const user = await db.user.upsert({
      where: { phone: td.phone },
      update: {},
      create: {
        phone: td.phone,
        role: 'TEACHER',
        name: td.name,
        country: 'EG',
        city: 'القاهرة',
        phoneVerified: new Date(),
      },
    })
    const teacher = await db.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        bio: td.bio,
        tracks: td.tracks,
        experienceYears: td.experienceYears,
        hourlyRateEGP: td.hourlyRateEGP,
        hourlyRateUSD: td.hourlyRateUSD,
        rating: td.rating,
        reviewsCount: td.reviewsCount,
        status: 'APPROVED',
        isFeatured: td.isFeatured,
      },
    })
    teachers.push({ user, teacher, avatar: td.avatar })
    console.log(`  ✓ Teacher: ${user.name}`)
  }

  // ---------- Pending teacher ----------
  const pendingUser = await db.user.upsert({
    where: { phone: PENDING_TEACHER_PHONE },
    update: {},
    create: {
      phone: PENDING_TEACHER_PHONE,
      role: 'TEACHER',
      name: 'أ. ياسمين خالد',
      country: 'EG',
      city: 'الإسكندرية',
      phoneVerified: new Date(),
    },
  })
  await db.teacher.upsert({
    where: { userId: pendingUser.id },
    update: {},
    create: {
      userId: pendingUser.id,
      bio: 'معلمة رياضيات بخبرة 4 سنوات، ترغب في تدريس الحساب الذهني للأطفال.',
      tracks: 'MENTAL_MATH',
      experienceYears: 4,
      hourlyRateEGP: 130,
      hourlyRateUSD: 13,
      status: 'PENDING',
    },
  })
  console.log(`  ✓ Pending teacher: ${pendingUser.name}`)

  // ---------- Courses ----------
  const coursesData = [
    { teacherIdx: 0, track: 'PROGRAMMING', title: 'Python للمبتدئين', level: 'BEGINNER', ageMin: 8, ageMax: 14, totalSessions: 8, sessionDurationMins: 60, priceEGP: 499, priceUSD: 29, description: 'تعلّم أساسيات البرمجة بلغة Python من خلال مشاريع ممتعة' },
    { teacherIdx: 0, track: 'ROBOTICS', title: 'مدخل إلى الروبوتيكس', level: 'BEGINNER', ageMin: 9, ageMax: 15, totalSessions: 10, sessionDurationMins: 60, priceEGP: 599, priceUSD: 35, description: 'تعرّف على عالم الروبوتات باستخدام Arduino والمستشعرات' },
    { teacherIdx: 1, track: 'ROBOTICS', title: 'Arduino المتقدم', level: 'INTERMEDIATE', ageMin: 11, ageMax: 16, totalSessions: 12, sessionDurationMins: 90, priceEGP: 799, priceUSD: 45, description: 'مشاريع إلكترونية متقدمة مع Arduino و Raspberry Pi' },
    { teacherIdx: 2, track: 'MENTAL_MATH', title: 'السوروبان والحساب الذهني', level: 'BEGINNER', ageMin: 6, ageMax: 12, totalSessions: 12, sessionDurationMins: 45, priceEGP: 399, priceUSD: 25, description: 'تعلّم الحساب الذهني السريع باستخدام السوروبان الياباني' },
    { teacherIdx: 2, track: 'MENTAL_MATH', title: 'الضرب والقسمة الذهنية', level: 'INTERMEDIATE', ageMin: 8, ageMax: 13, totalSessions: 10, sessionDurationMins: 45, priceEGP: 449, priceUSD: 28, description: 'إتقان الضرب والقسمة ذهنياً بسرعة فائقة' },
    { teacherIdx: 3, track: 'PROGRAMMING', title: 'تطوير الألعاب بـ Godot', level: 'INTERMEDIATE', ageMin: 10, ageMax: 16, totalSessions: 10, sessionDurationMins: 75, priceEGP: 549, priceUSD: 32, description: 'اصنع لعبتك الخاصة من الصفر باستخدام محرك Godot' },
  ]

  const courses: Array<{ id: string; title: string }> = []
  for (const cd of coursesData) {
    const teacher = teachers[cd.teacherIdx].teacher
    const existing = await db.course.findFirst({
      where: { teacherId: teacher.id, title: cd.title },
    })
    if (existing) {
      courses.push(existing)
      continue
    }
    const course = await db.course.create({
      data: {
        teacherId: teacher.id,
        track: cd.track,
        title: cd.title,
        description: cd.description,
        level: cd.level,
        ageMin: cd.ageMin,
        ageMax: cd.ageMax,
        totalSessions: cd.totalSessions,
        sessionDurationMins: cd.sessionDurationMins,
        priceEGP: cd.priceEGP,
        priceUSD: cd.priceUSD,
        status: 'PUBLISHED',
      },
    })
    courses.push(course)
    console.log(`  ✓ Course: ${course.title}`)
  }

  // ---------- Teacher availability (weekly) ----------
  // Clear old availability for seeded teachers
  for (const t of teachers) {
    await db.availability.deleteMany({ where: { teacherId: t.teacher.id } })
    // Sun-Tue-Thu: 4pm-8pm, Mon-Wed: 5pm-7pm, Sat: 10am-2pm
    const slots = [
      { day: 6, start: 16, end: 20 }, // Sat
      { day: 0, start: 16, end: 20 }, // Sun
      { day: 1, start: 17, end: 19 }, // Mon
      { day: 2, start: 16, end: 20 }, // Tue
      { day: 3, start: 17, end: 19 }, // Wed
      { day: 4, start: 16, end: 20 }, // Thu
    ]
    for (const s of slots) {
      await db.availability.create({
        data: {
          teacherId: t.teacher.id,
          dayOfWeek: s.day,
          startHour: s.start,
          endHour: s.end,
        },
      })
    }
  }
  console.log(`  ✓ Availability for ${teachers.length} teachers`)

  // ---------- Parents + Students ----------
  const parent1User = await db.user.upsert({
    where: { phone: PARENT_PHONES[0] },
    update: {},
    create: {
      phone: PARENT_PHONES[0],
      role: 'PARENT',
      name: 'أحمد محمد',
      country: 'EG',
      city: 'القاهرة',
      phoneVerified: new Date(),
    },
  })
  const parent1 = await db.parent.upsert({
    where: { userId: parent1User.id },
    update: {},
    create: { userId: parent1User.id },
  })

  const parent2User = await db.user.upsert({
    where: { phone: PARENT_PHONES[1] },
    update: {},
    create: {
      phone: PARENT_PHONES[1],
      role: 'PARENT',
      name: 'خالد العتيبي',
      country: 'SA',
      city: 'الرياض',
      phoneVerified: new Date(),
    },
  })
  const parent2 = await db.parent.upsert({
    where: { userId: parent2User.id },
    update: {},
    create: { userId: parent2User.id },
  })
  console.log(`  ✓ Parents: ${parent1User.name}, ${parent2User.name}`)

  // Students
  const student1 = await db.student.upsert({
    where: { id: 'seed-student-1' },
    update: { parentId: parent1.id },
    create: {
      id: 'seed-student-1',
      parentId: parent1.id,
      name: 'محمد أحمد',
      birthDate: new Date('2015-03-15'),
      gender: 'MALE',
      grade: 'الصف الخامس الابتدائي',
      levelsJson: JSON.stringify({ PROGRAMMING: 'BEGINNER', MENTAL_MATH: 'INTERMEDIATE' }),
    },
  })
  const student2 = await db.student.upsert({
    where: { id: 'seed-student-2' },
    update: { parentId: parent1.id },
    create: {
      id: 'seed-student-2',
      parentId: parent1.id,
      name: 'فاطمة أحمد',
      birthDate: new Date('2017-08-22'),
      gender: 'FEMALE',
      grade: 'الصف الثالث الابتدائي',
      levelsJson: JSON.stringify({ MENTAL_MATH: 'BEGINNER' }),
    },
  })
  const student3 = await db.student.upsert({
    where: { id: 'seed-student-3' },
    update: { parentId: parent2.id },
    create: {
      id: 'seed-student-3',
      parentId: parent2.id,
      name: 'عبدالله خالد',
      birthDate: new Date('2014-11-05'),
      gender: 'MALE',
      grade: 'الصف السادس الابتدائي',
      levelsJson: JSON.stringify({ PROGRAMMING: 'INTERMEDIATE' }),
    },
  })
  console.log(`  ✓ Students: ${student1.name}, ${student2.name}, ${student3.name}`)

  // ---------- Sessions (upcoming + past) ----------
  await db.session.deleteMany({ where: { id: { startsWith: 'seed-session-' } } })
  const now = new Date()
  const sessions: Array<{ id: string }> = []

  // Helper to create a session
  const createSession = async (
    id: string,
    teacherIdx: number,
    courseIdx: number | null,
    title: string,
    track: string,
    daysOffset: number,
    hour: number,
    durationMins: number = 60,
    status: string = 'SCHEDULED',
  ) => {
    const date = new Date(now)
    date.setDate(date.getDate() + daysOffset)
    date.setHours(hour, 0, 0, 0)
    const end = new Date(date)
    end.setMinutes(end.getMinutes() + durationMins)
    const teacher = teachers[teacherIdx].teacher
    const course = courseIdx !== null ? courses[courseIdx] : null
    const session = await db.session.create({
      data: {
        id,
        courseId: course?.id ?? null,
        teacherId: teacher.id,
        title,
        track,
        startTime: date,
        endTime: end,
        durationMins,
        status,
      },
    })
    sessions.push(session)
    return session
  }

  // Upcoming sessions (next 7 days)
  await createSession('seed-session-1', 0, 0, 'Python: المتغيرات والحلقات', 'PROGRAMMING', 1, 17, 60)
  await createSession('seed-session-2', 2, 3, 'السوروبان: الجمع والطرح', 'MENTAL_MATH', 2, 16, 45)
  await createSession('seed-session-3', 1, 2, 'Arduino: إضاءة LED', 'ROBOTICS', 3, 17, 90)
  await createSession('seed-session-4', 0, 1, 'الروبوتيكس: المستشعرات', 'ROBOTICS', 4, 18, 60)
  await createSession('seed-session-5', 2, 4, 'الضرب الذهني', 'MENTAL_MATH', 5, 16, 45)
  await createSession('seed-session-6', 3, 5, 'Godot: أول لعبة', 'PROGRAMMING', 6, 19, 75)

  // Past completed sessions (with progress reports)
  await createSession('seed-session-p1', 0, 0, 'Python: مقدمة', 'PROGRAMMING', -7, 17, 60, 'COMPLETED')
  await createSession('seed-session-p2', 2, 3, 'السوروبان: الأساسيات', 'MENTAL_MATH', -5, 16, 45, 'COMPLETED')
  await createSession('seed-session-p3', 0, 0, 'Python: الطباعة والمدخلات', 'PROGRAMMING', -3, 17, 60, 'COMPLETED')

  console.log(`  ✓ ${sessions.length} sessions created`)

  // ---------- Bookings ----------
  await db.booking.deleteMany({ where: { id: { startsWith: 'seed-booking-' } } })

  // Student 1 booked in sessions 1, 4, p1, p3 (programming + robotics)
  await db.booking.create({ data: { id: 'seed-booking-1', sessionId: 'seed-session-1', studentId: student1.id, status: 'CONFIRMED', priceEGP: 200, priceUSD: 20 } })
  await db.booking.create({ data: { id: 'seed-booking-4', sessionId: 'seed-session-4', studentId: student1.id, status: 'CONFIRMED', priceEGP: 200, priceUSD: 20 } })
  await db.booking.create({ data: { id: 'seed-booking-p1', sessionId: 'seed-session-p1', studentId: student1.id, status: 'COMPLETED', priceEGP: 200, priceUSD: 20 } })
  await db.booking.create({ data: { id: 'seed-booking-p3', sessionId: 'seed-session-p3', studentId: student1.id, status: 'COMPLETED', priceEGP: 200, priceUSD: 20 } })

  // Student 2 in session 2, p2 (mental math)
  await db.booking.create({ data: { id: 'seed-booking-2', sessionId: 'seed-session-2', studentId: student2.id, status: 'CONFIRMED', priceEGP: 150, priceUSD: 15 } })
  await db.booking.create({ data: { id: 'seed-booking-p2', sessionId: 'seed-session-p2', studentId: student2.id, status: 'COMPLETED', priceEGP: 150, priceUSD: 15 } })

  // Student 3 in session 6 (game dev)
  await db.booking.create({ data: { id: 'seed-booking-6', sessionId: 'seed-session-6', studentId: student3.id, status: 'CONFIRMED', priceEGP: 170, priceUSD: 17 } })
  console.log(`  ✓ 7 bookings created`)

  // ---------- Transactions (PAID) ----------
  await db.transaction.deleteMany({ where: { id: { startsWith: 'seed-tx-' } } })
  await db.transaction.create({
    data: {
      id: 'seed-tx-1', parentId: parent1.id, userId: parent1User.id,
      type: 'SESSION_BOOKING', amountEGP: 400, amountUSD: 40, currency: 'EGP',
      status: 'PAID', provider: 'PAYMOB', providerRef: 'paymob-1234',
      description: 'حجز 2 حصة برمجة - محمد أحمد', bookingId: 'seed-booking-1',
    },
  })
  await db.transaction.create({
    data: {
      id: 'seed-tx-2', parentId: parent1.id, userId: parent1User.id,
      type: 'SESSION_BOOKING', amountEGP: 150, amountUSD: 15, currency: 'EGP',
      status: 'PAID', provider: 'PAYMOB', providerRef: 'paymob-1235',
      description: 'حجز حصة حساب ذهني - فاطمة أحمد', bookingId: 'seed-booking-2',
    },
  })
  await db.transaction.create({
    data: {
      id: 'seed-tx-3', parentId: parent2.id, userId: parent2User.id,
      type: 'SESSION_BOOKING', amountEGP: 170, amountUSD: 17, currency: 'USD',
      status: 'PAID', provider: 'STRIPE', providerRef: 'stripe-6789',
      description: 'Game Dev session - Abdullah Khalid', bookingId: 'seed-booking-6',
    },
  })
  console.log(`  ✓ 3 transactions created`)

  // ---------- Progress reports (for past sessions) ----------
  await db.progressReport.deleteMany({ where: { id: { startsWith: 'seed-pr-' } } })
  await db.progressReport.create({
    data: {
      id: 'seed-pr-1', sessionId: 'seed-session-p1', studentId: student1.id,
      teacherId: teachers[0].teacher.id, attendance: 'PRESENT', score: 85,
      engagement: 4, understanding: 4, homework: 5,
      notes: 'محمد تفاعل بشكل ممتاز مع مقدمة Python. يفهم المتغيرات جيداً.',
    },
  })
  await db.progressReport.create({
    data: {
      id: 'seed-pr-2', sessionId: 'seed-session-p2', studentId: student2.id,
      teacherId: teachers[2].teacher.id, attendance: 'PRESENT', score: 90,
      engagement: 5, understanding: 4, homework: 4,
      notes: 'فاطمة سريعة التعلم. أتقنت أساسيات السوروبان.',
    },
  })
  await db.progressReport.create({
    data: {
      id: 'seed-pr-3', sessionId: 'seed-session-p3', studentId: student1.id,
      teacherId: teachers[0].teacher.id, attendance: 'PRESENT', score: 88,
      engagement: 5, understanding: 4, homework: 4,
      notes: 'تقدّم ملحوظ في فهم المدخلات والمخرجات. ينصح بممارسة المزيد.',
    },
  })
  console.log(`  ✓ 3 progress reports created`)

  // ---------- Notifications ----------
  await db.notification.deleteMany({ where: { id: { startsWith: 'seed-notif-' } } })
  await db.notification.create({
    data: {
      id: 'seed-notif-1', userId: parent1User.id, type: 'BOOKING_CONFIRMED',
      title: 'تم تأكيد حجز الحصة', body: 'تم تأكيد حجز حصة Python مع م. أحمد الشريف غداً الساعة 5 مساءً',
      link: '/parent/sessions',
    },
  })
  await db.notification.create({
    data: {
      id: 'seed-notif-2', userId: parent1User.id, type: 'PROGRESS_UPDATED',
      title: 'تحديث تقرير التقدّم', body: 'تم تحديث تقرير تقدّم محمد في حصة Python',
      link: '/parent/reports',
    },
  })
  await db.notification.create({
    data: {
      id: 'seed-notif-3', userId: teachers[0].user.id, type: 'SESSION_REMINDER',
      title: 'تذكير: حصة قادمة', body: 'لديك حصة Python مع محمد أحمد غداً الساعة 5 مساءً',
      link: '/teacher/schedule',
    },
  })
  console.log(`  ✓ 3 notifications created`)

  console.log('\n✅ Seed completed successfully!')
  console.log('\n📋 Demo accounts (login with phone, use dev OTP):')
  console.log(`  Admin:    ${ADMIN_PHONE}`)
  console.log(`  Teacher:  ${TEACHER_PHONES[0]} (أحمد الشريف)`)
  console.log(`  Parent:   ${PARENT_PHONES[0]} (أحمد محمد)`)
  console.log(`  Parent:   ${PARENT_PHONES[1]} (خالد العتيبي - USD)`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

/* TODO(phase-3): Add seed for coupons/campaigns when payment flows land. */
