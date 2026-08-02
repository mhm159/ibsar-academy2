/**
 * منصة منهل — بذر بيانات شاملة لاختبار كل ميزات البرنامج
 *
 * ينشئ:
 *   - 1 admin
 *   - 10 معلمين (8 معتمد + 2 بانتظار الاعتماد)
 *   - 5 أولياء أمور + 8 أطفال
 *   - 15 كورس
 *   - 20 حصة (12 قادمة + 8 مكتملة)
 *   - 15 حجز
 *   - 10 معاملات مدفوعة + escrows
 *   - 5 واجبات (3 تفاعلية + 2 عادية)
 *   - 8 تقييمات
 *   - نقاط + أوسمة + streaks
 *   - 15 إشعار
 *   - محافظ معلمين + كوبونات
 *
 * تشغيل: bun run prisma/seed-comprehensive.ts
 */
import { db } from '../src/lib/db'
import { seedBadges, awardPoints, updateStreak, checkAndUnlockBadges } from '../src/lib/gamification'
import { createEscrowForTransaction, releaseEscrow } from '../src/lib/payment/escrow'

async function main() {
  console.log('🌱 بذر البيانات الشاملة...\n')

  // ============================================================
  // 1. Admin
  // ============================================================
  const admin = await db.user.upsert({
    where: { phone: '+201000000001' },
    update: {},
    create: {
      phone: '+201000000001', email: 'admin@manhal-academy.com', role: 'ADMIN',
      name: 'إدارة الأكاديمية', country: 'EG', city: 'القاهرة',
      emailVerified: new Date(), phoneVerified: new Date(),
    },
  })
  console.log('✅ Admin')

  // ============================================================
  // 2. Teachers (10)
  // ============================================================
  const teacherData = [
    { phone: '+201000000010', name: 'م. أحمد الشريف', tracks: 'PROGRAMMING,ROBOTICS', bio: 'مهندس برمجيات سابق، متخصص في تعليم الأطفال البرمجة بطريقة ممتعة.', exp: 8, rateEGP: 200, rateUSD: 20, rating: 4.9, reviews: 187, featured: true, pricingMode: 'FREE' },
    { phone: '+201000000011', name: 'أ. منى عبد الله', tracks: 'ROBOTICS', bio: 'ماجستير هندسة كهربائية، شاركت بفرق روبوتيكس في مسابقات عالمية.', exp: 6, rateEGP: 180, rateUSD: 18, rating: 4.8, reviews: 142, featured: true, pricingMode: 'CAPPED', maxRate: 25000 },
    { phone: '+201000000012', name: 'أ. سارة فؤاد', tracks: 'MENTAL_MATH', bio: 'خبيرة في الحساب الذهني والسوروبان، درّبت أكثر من 400 طفل.', exp: 10, rateEGP: 150, rateUSD: 15, rating: 5.0, reviews: 213, featured: true, pricingMode: 'FREE' },
    { phone: '+201000000013', name: 'م. كريم مصطفى', tracks: 'PROGRAMMING', bio: 'مطوّر ألعاب مستقل، يعلّم الأطفال كيف يصنعون ألعابهم الخاصة.', exp: 5, rateEGP: 170, rateUSD: 17, rating: 4.7, reviews: 98, featured: false, pricingMode: 'FREE' },
    { phone: '+201000000014', name: 'أ. ياسمين خالد', tracks: 'MENTAL_MATH', bio: 'معلمة رياضيات بخبرة 4 سنوات، ترغب في تدريس الحساب الذهني.', exp: 4, rateEGP: 130, rateUSD: 13, rating: 0, reviews: 0, featured: false, pricingMode: 'FREE', status: 'PENDING' },
    { phone: '+201000000015', name: 'م. عمر حسن', tracks: 'PROGRAMMING,ROBOTICS', bio: 'مهندس ميكاترونكس، خبرة في Arduino و Raspberry Pi.', exp: 7, rateEGP: 190, rateUSD: 19, rating: 4.6, reviews: 76, featured: false, pricingMode: 'FIXED', fixedEGP: 15000, fixedUSD: 1500 },
    { phone: '+201000000016', name: 'أ. ندى إبراهيم', tracks: 'MENTAL_MATH,PROGRAMMING', bio: 'معلمة حاسب آلي ورياضيات، تحب تبسيط المفاهيم المعقدة.', exp: 6, rateEGP: 160, rateUSD: 16, rating: 4.8, reviews: 112, featured: true, pricingMode: 'FREE' },
    { phone: '+201000000017', name: 'م. طارق رضا', tracks: 'ROBOTICS,PROGRAMMING', bio: 'مدرب معتمد في FIRST LEGO League، شارك في تحكيم مسابقات دولية.', exp: 9, rateEGP: 220, rateUSD: 22, rating: 4.9, reviews: 156, featured: true, pricingMode: 'CAPPED', maxRate: 30000 },
    { phone: '+201000000018', name: 'أ. هبة سامي', tracks: 'MENTAL_MATH', bio: 'مدربة سوروبان معتمدة من اليابان، خبرة 12 سنة.', exp: 12, rateEGP: 250, rateUSD: 25, rating: 5.0, reviews: 287, featured: true, pricingMode: 'FREE' },
    { phone: '+201000000019', name: 'م. وليد عادل', tracks: 'PROGRAMMING', bio: ' مطوّر ويب متخصص في تعليم الـ HTML و CSS و JavaScript للأطفال.', exp: 5, rateEGP: 140, rateUSD: 14, rating: 4.5, reviews: 64, featured: false, pricingMode: 'FREE', status: 'PENDING' },
  ]

  const teachers: any[] = []
  for (const td of teacherData) {
    const user = await db.user.upsert({
      where: { phone: td.phone },
      update: {},
      create: { phone: td.phone, role: 'TEACHER', name: td.name, country: 'EG', city: 'القاهرة', phoneVerified: new Date() },
    })
    const teacher = await db.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id, bio: td.bio, tracks: td.tracks, experienceYears: td.exp,
        hourlyRateEGP: td.rateEGP * 100, hourlyRateUSD: td.rateUSD * 100,
        rating: td.rating, reviewsCount: td.reviews, status: td.status ?? 'APPROVED',
        isFeatured: td.featured, pricingMode: td.pricingMode,
        maxHourlyRateEGP: td.maxRate, fixedHourlyRateEGP: td.fixedEGP, fixedHourlyRateUSD: td.fixedUSD,
      },
    })
    teachers.push({ user, teacher })

    // Wallet for approved teachers
    if ((td.status ?? 'APPROVED') === 'APPROVED') {
      await db.walletAccount.upsert({
        where: { id: `seed-wallet-${teacher.id.slice(-6)}` },
        update: {},
        create: {
          id: `seed-wallet-${teacher.id.slice(-6)}`, teacherId: teacher.id,
          type: 'VODAFONE_CASH', identifier: td.phone.replace('+', ''),
          label: 'محفظة فودافون', holderName: td.name, currency: 'EGP', isDefault: true,
        },
      })
    }

    // Availability
    await db.availability.deleteMany({ where: { teacherId: teacher.id } })
    for (const day of [6, 0, 1, 2, 3, 4]) {
      await db.availability.create({ data: { teacherId: teacher.id, dayOfWeek: day, startHour: 16, endHour: 20 } })
    }
  }
  console.log(`✅ ${teachers.length} معلمين`)

  // ============================================================
  // 3. Parents (5) + Students (8)
  // ============================================================
  const parentData = [
    { phone: '+201012345678', name: 'أحمد محمد', country: 'EG', city: 'القاهرة', students: [
      { name: 'محمد أحمد', birth: '2015-03-15', gender: 'MALE', grade: 'الصف الخامس الابتدائي' },
      { name: 'فاطمة أحمد', birth: '2017-08-22', gender: 'FEMALE', grade: 'الصف الثالث الابتدائي' },
    ]},
    { phone: '+201009998877', name: 'خالد العتيبي', country: 'SA', city: 'الرياض', students: [
      { name: 'عبدالله خالد', birth: '2014-11-05', gender: 'MALE', grade: 'الصف السادس الابتدائي' },
    ]},
    { phone: '+201012223344', name: 'محمود السيد', country: 'EG', city: 'الإسكندرية', students: [
      { name: 'عمر محمود', birth: '2013-06-10', gender: 'MALE', grade: 'الصف الأول الإعدادي' },
      { name: 'ملك محمود', birth: '2016-01-20', gender: 'FEMALE', grade: 'الصف الثاني الابتدائي' },
    ]},
    { phone: '+201014445566', name: 'سارة عبد الرحمن', country: 'EG', city: 'الجيزة', students: [
      { name: 'يوسف كمال', birth: '2014-09-15', gender: 'MALE', grade: 'الصف السادس الابتدائي' },
      { name: 'لينا كمال', birth: '2018-04-03', gender: 'FEMALE', grade: 'الصف الأول الابتدائي' },
    ]},
    { phone: '+201016667788', name: 'فهد الدوسري', country: 'KW', city: 'الكويت', students: [
      { name: 'ناصر فهد', birth: '2012-12-01', gender: 'MALE', grade: 'الصف الثاني الإعدادي' },
      { name: 'لمى فهد', birth: '2016-07-18', gender: 'FEMALE', grade: 'الصف الثاني الابتدائي' },
    ]},
  ]

  const parents: any[] = []
  const allStudents: any[] = []
  for (const pd of parentData) {
    const user = await db.user.upsert({
      where: { phone: pd.phone },
      update: {},
      create: { phone: pd.phone, role: 'PARENT', name: pd.name, country: pd.country, city: pd.city, phoneVerified: new Date() },
    })
    const parent = await db.parent.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    })
    parents.push({ user, parent })

    for (const sd of pd.students) {
      const student = await db.student.create({
        data: {
          parentId: parent.id,
          name: sd.name, birthDate: new Date(sd.birth), gender: sd.gender, grade: sd.grade,
          levelsJson: JSON.stringify({ PROGRAMMING: 'BEGINNER', MENTAL_MATH: 'BEGINNER' }),
        },
      })
      allStudents.push({ student, parentUser: user })
    }
  }
  console.log(`✅ ${parents.length} أولياء أمور + ${allStudents.length} أطفال`)

  // ============================================================
  // 4. Courses (15)
  // ============================================================
  const courseData = [
    { tIdx: 0, track: 'PROGRAMMING', title: 'Python للمبتدئين', level: 'BEGINNER', ageMin: 8, ageMax: 14, sessions: 8, dur: 60, egp: 499, usd: 29 },
    { tIdx: 0, track: 'ROBOTICS', title: 'مدخل إلى الروبوتيكس', level: 'BEGINNER', ageMin: 9, ageMax: 15, sessions: 10, dur: 60, egp: 599, usd: 35 },
    { tIdx: 1, track: 'ROBOTICS', title: 'Arduino المتقدم', level: 'INTERMEDIATE', ageMin: 11, ageMax: 16, sessions: 12, dur: 90, egp: 799, usd: 45 },
    { tIdx: 2, track: 'MENTAL_MATH', title: 'السوروبان والحساب الذهني', level: 'BEGINNER', ageMin: 6, ageMax: 12, sessions: 12, dur: 45, egp: 399, usd: 25 },
    { tIdx: 2, track: 'MENTAL_MATH', title: 'الضرب والقسمة الذهنية', level: 'INTERMEDIATE', ageMin: 8, ageMax: 13, sessions: 10, dur: 45, egp: 449, usd: 28 },
    { tIdx: 3, track: 'PROGRAMMING', title: 'تطوير الألعاب بـ Godot', level: 'INTERMEDIATE', ageMin: 10, ageMax: 16, sessions: 10, dur: 75, egp: 549, usd: 32 },
    { tIdx: 5, track: 'PROGRAMMING', title: 'HTML و CSS للأطفال', level: 'BEGINNER', ageMin: 9, ageMax: 14, sessions: 8, dur: 60, egp: 399, usd: 25 },
    { tIdx: 5, track: 'ROBOTICS', title: 'روبوتات LEGO WeDo', level: 'BEGINNER', ageMin: 7, ageMax: 10, sessions: 10, dur: 60, egp: 499, usd: 30 },
    { tIdx: 6, track: 'MENTAL_MATH', title: 'الجمع والطرح السريع', level: 'BEGINNER', ageMin: 6, ageMax: 10, sessions: 8, dur: 45, egp: 349, usd: 22 },
    { tIdx: 6, track: 'PROGRAMMING', title: 'Scratch للأطفال', level: 'BEGINNER', ageMin: 7, ageMax: 12, sessions: 10, dur: 60, egp: 449, usd: 28 },
    { tIdx: 7, track: 'ROBOTICS', title: 'FIRST LEGO League التحضير', level: 'ADVANCED', ageMin: 10, ageMax: 16, sessions: 15, dur: 90, egp: 999, usd: 55 },
    { tIdx: 8, track: 'MENTAL_MATH', title: 'السوروبان المستوى المتقدم', level: 'ADVANCED', ageMin: 9, ageMax: 14, sessions: 15, dur: 60, egp: 799, usd: 45 },
    { tIdx: 0, track: 'PROGRAMMING', title: 'JavaScript للمبتدئين', level: 'BEGINNER', ageMin: 10, ageMax: 16, sessions: 10, dur: 60, egp: 549, usd: 32 },
    { tIdx: 4, track: 'MENTAL_MATH', title: 'الحساب الذهني للمرحلة الإعدادية', level: 'INTERMEDIATE', ageMin: 11, ageMax: 15, sessions: 10, dur: 45, egp: 449, usd: 28 },
    { tIdx: 7, track: 'ROBOTICS', title: 'مقدمة في الذكاء الاصطناعي', level: 'INTERMEDIATE', ageMin: 12, ageMax: 16, sessions: 8, dur: 75, egp: 699, usd: 40 },
  ]

  const courses: any[] = []
  for (const cd of courseData) {
    const t = teachers[cd.tIdx]
    const course = await db.course.create({
      data: {
        teacherId: t.teacher.id, track: cd.track, title: cd.title,
        description: `${cd.title} — كورس تفاعلي للأطفال`,
        level: cd.level, ageMin: cd.ageMin, ageMax: cd.ageMax,
        totalSessions: cd.sessions, sessionDurationMins: cd.dur,
        priceEGP: cd.egp * 100, priceUSD: cd.usd * 100, status: 'PUBLISHED',
      },
    })
    courses.push(course)
  }
  console.log(`✅ ${courses.length} كورس`)

  // ============================================================
  // 5. Sessions (20: 12 upcoming + 8 completed)
  // ============================================================
  const now = new Date()
  const sessions: any[] = []
  const tracks = ['PROGRAMMING', 'ROBOTICS', 'MENTAL_MATH']

  // Upcoming sessions
  for (let i = 0; i < 12; i++) {
    const t = teachers[i % 8]
    const date = new Date(now)
    date.setDate(date.getDate() + (i + 1))
    date.setHours(16 + (i % 3), 0, 0, 0)
    const end = new Date(date)
    end.setMinutes(end.getMinutes() + 60)
    const track = tracks[i % 3]
    const titles: Record<string, string[]> = {
      PROGRAMMING: ['Python: المتغيرات', 'Python: الحلقات', 'Scratch: أول لعبة', 'HTML: الصفحة الأولى'],
      ROBOTICS: ['Arduino: LED', 'Arduino: مستشعرات', 'LEGO: محركات', 'روبوتيكس: تحكم'],
      MENTAL_MATH: ['السوروبان: الجمع', 'السوروبان: الطرح', 'الضرب الذهني', 'القسمة الذهنية'],
    }
    const title = titles[track][i % 4]
    const session = await db.session.create({
      data: {
        teacherId: t.teacher.id, courseId: courses[i % courses.length]?.id ?? null,
        title, track, startTime: date, endTime: end, durationMins: 60, status: 'SCHEDULED',
      },
    })
    sessions.push(session)
  }

  // Completed sessions (past)
  for (let i = 0; i < 8; i++) {
    const t = teachers[i % 8]
    const date = new Date(now)
    date.setDate(date.getDate() - (i + 1) * 2)
    date.setHours(17, 0, 0, 0)
    const end = new Date(date)
    end.setMinutes(end.getMinutes() + 60)
    const track = tracks[i % 3]
    const titles: Record<string, string[]> = {
      PROGRAMMING: ['Python: مقدمة', 'Python: الطباعة', 'Scratch: المسرح', 'HTML: العناصر'],
      ROBOTICS: ['Arduino: أساسيات', 'Arduino: دوائر', 'LEGO: تركيب', 'روبوتيكس: مفاهيم'],
      MENTAL_MATH: ['السوروبان: الأساسيات', 'الجمع السريع', 'الطرح الذهني', 'الضرب المزدوج'],
    }
    const title = titles[track][i % 4]
    const session = await db.session.create({
      data: {
        teacherId: t.teacher.id, title, track, startTime: date, endTime: end, durationMins: 60, status: 'COMPLETED',
      },
    })
    sessions.push(session)
  }
  console.log(`✅ ${sessions.length} حصة`)

  // ============================================================
  // 6. Bookings (15)
  // ============================================================
  let bookingCount = 0
  for (let i = 0; i < 15; i++) {
    const session = sessions[i % sessions.length]
    const studentEntry = allStudents[i % allStudents.length]
    const teacher = teachers.find((t) => t.teacher.id === session.teacherId)

    const existing = await db.booking.findFirst({ where: { sessionId: session.id, studentId: studentEntry.student.id } })
    if (existing) continue

    const booking = await db.booking.create({
      data: {
        sessionId: session.id, studentId: studentEntry.student.id,
        status: session.status === 'COMPLETED' ? 'COMPLETED' : 'CONFIRMED',
        priceEGP: teacher.teacher.hourlyRateEGP, priceUSD: teacher.teacher.hourlyRateUSD,
      },
    })
    bookingCount++

    // Create transaction for PAID bookings
    if (i < 10) {
      const tx = await db.transaction.create({
        data: {
          parentId: studentEntry.parentUser.id ? (await db.parent.findUnique({ where: { userId: studentEntry.parentUser.id } }))!.id : '',
          userId: studentEntry.parentUser.id,
          type: 'SESSION_BOOKING', amountEGP: teacher.teacher.hourlyRateEGP, amountUSD: teacher.teacher.hourlyRateUSD,
          currency: studentEntry.parentUser.country === 'SA' || studentEntry.parentUser.country === 'KW' ? 'USD' : 'EGP',
          status: 'PAID', provider: studentEntry.parentUser.country === 'EG' ? 'PAYMOB' : 'STRIPE',
          providerRef: `ref-${Date.now()}-${i}`, description: `حجز حصة ${session.title}`,
          bookingId: booking.id, paymentMethod: 'CARD', buyerCountry: studentEntry.parentUser.country,
        },
      })

      // Create escrow
      const platformFeeEGP = Math.round(teacher.teacher.hourlyRateEGP * 0.15)
      const teacherShareEGP = Math.round(teacher.teacher.hourlyRateEGP * 0.85)
      const platformFeeUSD = Math.round(teacher.teacher.hourlyRateUSD * 0.15)
      const teacherShareUSD = Math.round(teacher.teacher.hourlyRateUSD * 0.85)

      const escrow = await db.escrow.create({
        data: {
          transactionId: tx.id, bookingId: booking.id, teacherId: teacher.teacher.id,
          amountEGP: teacher.teacher.hourlyRateEGP, amountUSD: teacher.teacher.hourlyRateUSD,
          platformFeeEGP, platformFeeUSD, teacherShareEGP, teacherShareUSD,
          status: session.status === 'COMPLETED' ? 'RELEASED' : 'HELD',
          releasedAt: session.status === 'COMPLETED' ? new Date() : null,
        },
      })

      // Link booking to transaction
      await db.booking.update({ where: { id: booking.id }, data: { transactionId: tx.id } })
    }
  }
  console.log(`✅ ${bookingCount} حجز + معاملات + ضمانات`)

  // Release escrows for completed sessions (so teachers have available balance)
  const completedEscrows = await db.escrow.findMany({
    where: { status: 'HELD', booking: { session: { status: 'COMPLETED' } } },
    take: 10,
  })
  for (const e of completedEscrows) {
    await db.escrow.update({
      where: { id: e.id },
      data: { status: 'RELEASED', releasedAt: new Date() },
    })
  }
  if (completedEscrows.length > 0) {
    console.log(`✅ ${completedEscrows.length} ضمان متحرر (للحصص المكتملة)`)
  }

  // ============================================================
  // 7. Progress Reports (for completed sessions)
  // ============================================================
  let reportCount = 0
  for (let i = 0; i < 8; i++) {
    const session = sessions[12 + i] // completed sessions
    if (!session || session.status !== 'COMPLETED') continue
    const booking = await db.booking.findFirst({ where: { sessionId: session.id, status: 'COMPLETED' } })
    if (!booking) continue
    const scores = [85, 92, 78, 95, 88, 70, 90, 82]
    await db.progressReport.create({
      data: {
        sessionId: session.id, studentId: booking.studentId, teacherId: session.teacherId,
        attendance: 'PRESENT', score: scores[i] ?? 80,
        engagement: 3 + (i % 3), understanding: 3 + (i % 2), homework: 2 + (i % 3),
        notes: i % 2 === 0 ? 'أداء ممتاز، يفهم المفاهيم جيداً' : 'يحتاج لممارسة أكثر في التطبيق',
      },
    })
    reportCount++
  }
  console.log(`✅ ${reportCount} تقرير تقدم`)

  // ============================================================
  // 8. Homework (5: 3 interactive + 2 regular)
  // ============================================================
  const hwStudent = allStudents[0].student
  const hwTeacher = teachers[0].teacher

  // Interactive homework 1: MCQ
  await db.homework.create({
    data: {
      teacherId: hwTeacher.id, studentId: hwStudent.id,
      title: 'اختبار Python: المتغيرات', description: 'اختبر فهمك للمتغيرات في Python',
      type: 'INTERACTIVE', dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: 'ASSIGNED', totalPoints: 40, autoGraded: true,
      questionsJson: JSON.stringify([
        { id: 'q1', type: 'MCQ', question: 'ما الذي تستخدمه لتعريف متغير في Python؟', options: ['var x = 5', 'x = 5', 'int x = 5', 'let x = 5'], correctAnswer: 1, points: 10, explanation: 'في Python نكتب اسم المتغير ثم = ثم القيمة' },
        { id: 'q2', type: 'TRUE_FALSE', question: 'في Python، الأسماء حساسة لحالة الأحرف (age ≠ Age)', correctAnswer: 'true', points: 10, explanation: 'نعم، Python حساسة لحالة الأحرف' },
        { id: 'q3', type: 'FILL_BLANK', question: 'للطباعة في Python نستخدم الدالة ____', correctAnswer: 'print', points: 10, explanation: 'print() هي الدالة المستخدمة للطباعة' },
        { id: 'q4', type: 'MCQ', question: 'ما نوع البيانات في: name = "Ahmed"？', options: ['int', 'str', 'float', 'bool'], correctAnswer: 1, points: 10, explanation: 'النصوص بين علامتي تنصيص هي str' },
      ]),
    },
  })

  // Interactive homework 2: Mixed
  await db.homework.create({
    data: {
      teacherId: teachers[2].teacher.id, studentId: allStudents[1].student.id,
      title: 'اختبار الحساب الذهني', description: 'أسئلة سريعة في الجمع والطرح الذهني',
      type: 'INTERACTIVE', dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      status: 'ASSIGNED', totalPoints: 30, autoGraded: true,
      questionsJson: JSON.stringify([
        { id: 'q1', type: 'FILL_BLANK', question: '15 + 27 = ?', correctAnswer: '42', points: 10 },
        { id: 'q2', type: 'FILL_BLANK', question: '100 - 38 = ?', correctAnswer: '62', points: 10 },
        { id: 'q3', type: 'TRUE_FALSE', question: '9 × 9 = 81', correctAnswer: 'true', points: 10 },
      ]),
    },
  })

  // Interactive homework 3: submitted (for review)
  await db.homework.create({
    data: {
      teacherId: teachers[0].teacher.id, studentId: allStudents[2].student.id,
      title: 'اختبار الروبوتيكس', description: 'أسئلة في أساسيات الروبوتيكس',
      type: 'INTERACTIVE', dueDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      status: 'SUBMITTED', totalPoints: 30, autoGraded: false,
      submittedAt: new Date(),
      questionsJson: JSON.stringify([
        { id: 'q1', type: 'MCQ', question: 'ما هو المستشعر الذي يكتشف الضوء؟', options: ['Ultrasonic', 'Light sensor', 'Touch sensor', 'Temperature'], correctAnswer: 1, points: 10 },
        { id: 'q2', type: 'ESSAY', question: 'اشرح كيف يعمل المحرك الكهربائي', modelAnswer: 'المحرك يحول الطاقة الكهربائية إلى طاقة حركية', points: 20 },
      ]),
      answersJson: JSON.stringify({ q1: '1', q2: 'المحرك يحول الكهرباء إلى حركة' }),
    },
  })

  // Regular homework 1
  await db.homework.create({
    data: {
      teacherId: teachers[1].teacher.id, studentId: allStudents[0].student.id,
      title: 'مشروع: بناء دائرة LED', description: 'ابنِ دائرة LED بسيطة باستخدام Arduino وارفع صورة المشروع.',
      type: 'PRACTICAL', dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: 'ASSIGNED',
    },
  })

  // Regular homework 2 (submitted + reviewed)
  await db.homework.create({
    data: {
      teacherId: teachers[2].teacher.id, studentId: allStudents[1].student.id,
      title: 'تمرين: جدول الضرب', description: 'احفظي جدول الضرب من 2 إلى 9',
      type: 'WRITTEN', dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      status: 'REVIEWED', submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      grade: 90, feedback: 'أحسنت! حفظتِ الجداول جيداً', reviewedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      submissionText: 'تم حفظ جميع الجداول',
    },
  })
  console.log('✅ 5 واجبات (3 تفاعلية + 2 عادية)')

  // ============================================================
  // 9. Reviews (8)
  // ============================================================
  const reviewData = [
    { teacherIdx: 0, rating: 5, comment: 'معلم ممتاز وصبور، ابني تعلم الكثير', tags: 'PATIENCE,PROFESSIONALISM' },
    { teacherIdx: 0, rating: 5, comment: 'أسلوب تدريس ممتع وعملي', tags: 'ENGAGEMENT,PROGRESS' },
    { teacherIdx: 1, rating: 4, comment: 'شرح واضح والمتابعة جيدة', tags: 'COMMUNICATION' },
    { teacherIdx: 2, rating: 5, comment: 'ابنتي صارت تحب الرياضيات!', tags: 'PATIENCE,PROGRESS,ENGAGEMENT' },
    { teacherIdx: 2, rating: 5, comment: 'نتائج مبهرة في وقت قصير', tags: 'PROGRESS' },
    { teacherIdx: 3, rating: 4, comment: 'كورس تطوير الألعاب رائع', tags: 'ENGAGEMENT' },
    { teacherIdx: 7, rating: 5, comment: 'محتوى احترافي وتحضير لمسابقات حقيقية', tags: 'PROFESSIONALISM,PUNCTUALITY' },
    { teacherIdx: 8, rating: 5, comment: 'خبيرة كبيرة في السوروبان', tags: 'PROFESSIONALISM,PROGRESS' },
  ]

  for (const rd of reviewData) {
    const t = teachers[rd.teacherIdx]
    const p = parents[rd.teacherIdx % parents.length]
    // Find a completed session for this teacher
    const completedSession = sessions.find((s) => s.teacherId === t.teacher.id && s.status === 'COMPLETED')
    if (!completedSession) continue
    await db.review.create({
      data: {
        sessionId: completedSession.id,
        reviewedId: t.user.id, reviewedRole: 'TEACHER',
        reviewerId: p.user.id, reviewerRole: 'PARENT', reviewerName: p.user.name ?? 'ولي أمر',
        rating: rd.rating, comment: rd.comment, tags: rd.tags,
      },
    }).catch(() => {})
  }
  console.log('✅ 8 تقييمات')

  // ============================================================
  // 10. Gamification (points + badges + streaks)
  // ============================================================
  await seedBadges()
  for (const { student } of allStudents) {
    const completedBookings = await db.booking.findMany({
      where: { studentId: student.id, status: 'COMPLETED' },
    })
    for (let i = 0; i < completedBookings.length; i++) {
      await awardPoints({ studentId: student.id, points: 50, reason: 'SESSION_COMPLETED', description: `إكمال حصة #${i + 1}` })
      // Get progress report separately
      const report = await db.progressReport.findFirst({
        where: { sessionId: completedBookings[i].sessionId, studentId: student.id },
      })
      if (report?.score && report.score >= 95) {
        await awardPoints({ studentId: student.id, points: 200, reason: 'PERFECT_SCORE', description: `درجة مثالية: ${report.score}%` })
      } else if (report?.score && report.score >= 80) {
        await awardPoints({ studentId: student.id, points: 100, reason: 'HIGH_SCORE', description: `درجة عالية: ${report.score}%` })
      }
    }
    await updateStreak(student.id)
    await checkAndUnlockBadges(student.id)
  }
  console.log('✅ نقاط + أوسمة + streaks')

  // ============================================================
  // 11. Notifications (15)
  // ============================================================
  const notifTypes = [
    { type: 'BOOKING_CONFIRMED', title: '✅ تم تأكيد الحجز', body: 'تم تأكيد حجز حصة Python للمتغيرات' },
    { type: 'PAYMENT_RECEIVED', title: '💰 تم استلام الدفع', body: 'تم تأكيد دفع 200 ج.م' },
    { type: 'SESSION_REMINDER', title: '⏰ تذكير: حصة غداً', body: 'حصتك غداً الساعة 5:00 م' },
    { type: 'HOMEWORK_ASSIGNED', title: '📚 واجب جديد', body: 'تم تكليفك بواجب: اختبار Python' },
    { type: 'HOMEWORK_REVIEWED', title: '✅ تم تصحيح واجبك', body: 'الدرجة: 90%' },
    { type: 'PROGRESS_UPDATED', title: '📊 تحديث التقرير', body: 'درجة الطالب: 85%' },
    { type: 'PAYOUT_COMPLETED', title: '✅ تم تحويل السحب', body: 'تم تحويل 170 ج.م لمحفظتك' },
    { type: 'BEHAVIOR_ALERT', title: '⚠️ تنبيه سلوك', body: 'انخفاض في التفاعل' },
    { type: 'REVIEW_RECEIVED', title: '⭐ تقييم جديد', body: 'حصلت على 5 نجوم' },
    { type: 'WELCOME', title: '🎉 مرحباً بك!', body: 'أهلاً بك في منصة منهل' },
  ]

  for (let i = 0; i < 15; i++) {
    const notif = notifTypes[i % notifTypes.length]
    const userId = i < 5 ? parents[0].user.id : i < 10 ? teachers[0].user.id : admin.id
    await db.notification.create({
      data: {
        userId, type: notif.type, title: notif.title, body: notif.body,
        link: i % 2 === 0 ? '/parent' : '/teacher',
        isRead: i % 3 === 0,
      },
    })
  }
  console.log('✅ 15 إشعار')

  // ============================================================
  // 12. Coupons + Currency rates
  // ============================================================
  await db.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { code: 'WELCOME10', type: 'PERCENTAGE', value: 10, currency: 'EGP', maxUses: 100, validFrom: new Date(), isActive: true },
  })
  await db.coupon.upsert({
    where: { code: 'MANHAL50' },
    update: {},
    create: { code: 'MANHAL50', type: 'FIXED_AMOUNT', value: 50, currency: 'EGP', maxUses: 50, validFrom: new Date(), isActive: true },
  })
  await db.coupon.upsert({
    where: { code: 'SUMMER20' },
    update: {},
    create: { code: 'SUMMER20', type: 'PERCENTAGE', value: 20, currency: 'EGP', maxUses: 30, validFrom: new Date(), isActive: true },
  })

  // Currency rates
  const currencies = [
    { code: 'EGP', name: 'Egyptian Pound', nameAr: 'جنيه مصري', symbol: 'ج.م', rate: 48.5, providers: 'PAYMOB' },
    { code: 'SAR', name: 'Saudi Riyal', nameAr: 'ريال سعودي', symbol: 'ر.س', rate: 3.75, providers: 'STRIPE' },
    { code: 'AED', name: 'UAE Dirham', nameAr: 'درهم إماراتي', symbol: 'د.إ', rate: 3.67, providers: 'STRIPE' },
    { code: 'KWD', name: 'Kuwaiti Dinar', nameAr: 'دينار كويتي', symbol: 'د.ك', rate: 0.31, providers: 'STRIPE' },
    { code: 'USD', name: 'US Dollar', nameAr: 'دولار', symbol: '$', rate: 1, providers: 'STRIPE' },
  ]
  for (const c of currencies) {
    await db.currencyRate.upsert({
      where: { code: c.code },
      update: { rateToUSD: c.rate },
      create: {
        code: c.code, name: c.name, nameAr: c.nameAr, symbol: c.symbol,
        rateToUSD: c.rate, providers: c.providers,
      },
    })
  }
  console.log('✅ كوبونات + أسعار عملات')

  console.log('\n✅ تم بذر البيانات الشاملة!')
  console.log('\n📋 حسابات تجريبية:')
  console.log('  Admin:    01000000001')
  console.log('  Teacher:  01000000010 (أحمد الشريف)')
  console.log('  Parent:   01012345678 (أحمد محمد)')
  console.log('  Parent:   0109998877 (خالد العتيبي - السعودية)')
  await db.$disconnect()
}

main().catch((e) => {
  console.error('❌ خطأ:', e.message)
  process.exit(1)
})
