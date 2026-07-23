/**
 * Ibdaa Academy — AI Recommendations Engine
 *
 * Uses z-ai-web-dev-sdk LLM to analyze a student's profile (age, level,
 * past sessions, progress reports) and recommend the best teachers/courses.
 *
 * Flow:
 *   1. Gather student context (profile + past sessions + progress + reviews given)
 *   2. Fetch available approved teachers + their courses
 *   3. Send structured prompt to LLM → get ranked recommendations with reasoning
 *   4. Parse + persist to RecommendationLog
 *   5. Return to client
 */

import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

interface StudentContext {
  id: string
  name: string
  birthDate: string | null
  grade: string | null
  levelsJson: string
  completedSessions: number
  avgScore: number
  tracksStudied: string[]
  recentProgress: Array<{
    sessionTitle: string
    track: string
    score: number
    engagement: number
    understanding: number
    attendance: string
    notes: string | null
  }>
}

interface TeacherCandidate {
  id: string
  name: string
  tracks: string[]
  rating: number
  reviewsCount: number
  experienceYears: number
  hourlyRateEGP: number
  bio: string | null
  coursesCount: number
}

export interface Recommendation {
  type: 'TEACHER' | 'COURSE' | 'TRACK'
  entityId: string
  entityName: string
  reason: string
  score: number
}

/**
 * Get AI recommendations for a student.
 * Caches for 24h (returns cached if exists).
 */
export async function getRecommendationsForStudent(
  studentId: string,
): Promise<{ recommendations: Recommendation[]; cached: boolean }> {
  // Check cache (last 24h)
  const cached = await db.recommendationLog.findFirst({
    where: {
      studentId,
      createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (cached) {
    const allCached = await db.recommendationLog.findMany({
      where: {
        studentId,
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { score: 'desc' },
    })
    return {
      recommendations: allCached.map((r) => ({
        type: r.type as Recommendation['type'],
        entityId: r.entityId,
        entityName: r.entityName,
        reason: r.reason,
        score: r.score,
      })),
      cached: true,
    }
  }

  // 1. Gather student context
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      bookings: {
        where: { status: 'COMPLETED' },
        include: {
          session: { select: { track: true, title: true } },
        },
      },
    },
  })

  if (!student) {
    return { recommendations: [], cached: false }
  }

  // Fetch progress reports separately (they're on Session, not Booking)
  const progressReports = await db.progressReport.findMany({
    where: { studentId },
    include: {
      session: { select: { title: true, track: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })
  const avgScore =
    progressReports.length > 0
      ? Math.round(progressReports.reduce((s, r) => s + r.score, 0) / progressReports.length)
      : 0
  const tracksStudied = Array.from(
    new Set(student.bookings.map((b) => b.session.track)),
  )

  const studentContext: StudentContext = {
    id: student.id,
    name: student.name,
    birthDate: student.birthDate?.toISOString() ?? null,
    grade: student.grade,
    levelsJson: student.levelsJson,
    completedSessions: student.bookings.length,
    avgScore,
    tracksStudied,
    recentProgress: progressReports.slice(-5).map((r) => ({
      sessionTitle: r.session.title,
      track: r.session.track,
      score: r.score,
      engagement: r.engagement,
      understanding: r.understanding,
      attendance: r.attendance,
      notes: r.notes,
    })),
  }

  // 2. Fetch approved teachers
  const teachers = await db.teacher.findMany({
    where: { status: 'APPROVED' },
    include: {
      user: { select: { name: true } },
      courses: { where: { status: 'PUBLISHED' }, select: { id: true, title: true, track: true, level: true, priceEGP: true } },
    },
    take: 20,
  })

  const teacherCandidates: TeacherCandidate[] = teachers.map((t) => ({
    id: t.id,
    name: t.user.name ?? 'معلم',
    tracks: t.tracks.split(',').filter(Boolean),
    rating: t.rating,
    reviewsCount: t.reviewsCount,
    experienceYears: t.experienceYears,
    hourlyRateEGP: t.hourlyRateEGP,
    bio: t.bio,
    coursesCount: t.courses.length,
  }))

  // 3. Build LLM prompt
  const systemPrompt = `أنت مستشار تعليمي خبير في أكاديمية إبداع لتعليم الأطفال.
مهمتك: تحليل ملف الطفل واقتراح أفضل المعلمين/الكورسات المناسبة له.

قواعد التوصية:
- راعِ عمر الطفل ومستواه الحالي
- ابحث عن معلمين في مسارات لم يدرسها الطفل بعد (لتوسيع آفاقه) أو معلمين أقدر على تطوير مستواه الحالي
- اذا كان الطفل يعاني (درجات أقل من 60%)، اقترح معلمين بصبر وتقييم عالي في التفاعل
- اذا كان الطفل متفوق (درجات أعلى من 85%)، اقترح معلمين متقدمين أو مسارات جديدة
- اجعل التوصيات مخصصة وشخصية (اذكر اسم الطفل في السبب)
- رتب التوصيات حسب الأولوية (الأعلى أولاً)

أعد الاستجابة بصيغة JSON فقط (بدون نص إضافي):
{
  "recommendations": [
    {
      "type": "TEACHER" | "COURSE" | "TRACK",
      "entityId": "<id>",
      "entityName": "<name>",
      "reason": "<سبب مختصر بالعربية>",
      "score": <0-100>
    }
  ]
}`

  const userPrompt = `ملف الطفل:
${JSON.stringify(studentContext, null, 2)}

المعلمون المتاحون:
${JSON.stringify(teacherCandidates, null, 2)}

قدم 3-5 توصيات مخصصة لهذا الطفل.`

  // 4. Call LLM
  let recommendations: Recommendation[] = []
  try {
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const response = completion.choices[0]?.message?.content ?? ''
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      recommendations = (parsed.recommendations ?? []).slice(0, 5)
    }
  } catch (err) {
    console.error('[ai-recommendations] LLM error:', err)
    // Fallback: rule-based recommendations
    recommendations = generateFallbackRecommendations(studentContext, teacherCandidates)
  }

  // 5. Persist to DB
  if (recommendations.length > 0) {
    // Clear old recommendations for this student
    await db.recommendationLog.deleteMany({ where: { studentId } })
    await db.recommendationLog.createMany({
      data: recommendations.map((r) => ({
        studentId,
        type: r.type,
        entityId: r.entityId,
        entityName: r.entityName,
        reason: r.reason,
        score: r.score,
      })),
    })
  }

  return { recommendations, cached: false }
}

/** Fallback rule-based recommendations if LLM fails */
function generateFallbackRecommendations(
  student: StudentContext,
  teachers: TeacherCandidate[],
): Recommendation[] {
  const recs: Recommendation[] = []
  const studiedTracks = new Set(student.tracksStudied)

  // Suggest a teacher in a track the student hasn't studied
  const newTrackTeacher = teachers.find((t) =>
    t.tracks.some((track) => !studiedTracks.has(track)),
  )
  if (newTrackTeacher) {
    const newTrack = newTrackTeacher.tracks.find((t) => !studiedTracks.has(t))!
    recs.push({
      type: 'TEACHER',
      entityId: newTrackTeacher.id,
      entityName: newTrackTeacher.name,
      reason: `بما أن ${student.name} لم يدرس ${newTrack} بعد، فإن ${newTrackTeacher.name} (تقييم ${newTrackTeacher.rating}) معلم ممتاز للبدء.`,
      score: 85,
    })
  }

  // If struggling (avgScore < 60), suggest patient teacher (high engagement ratings)
  if (student.avgScore > 0 && student.avgScore < 60) {
    const patientTeacher = teachers
      .filter((t) => t.rating >= 4.5)
      .sort((a, b) => b.rating - a.rating)[0]
    if (patientTeacher) {
      recs.push({
        type: 'TEACHER',
        entityId: patientTeacher.id,
        entityName: patientTeacher.name,
        reason: `${student.name} يحتاج لدعم إضافي. ${patientTeacher.name} معلم صبور بتقييم ${patientTeacher.rating} مناسب لتعزيز الفهم.`,
        score: 90,
      })
    }
  }

  // If excelling (avgScore > 85), suggest advanced teacher
  if (student.avgScore > 85) {
    const advancedTeacher = teachers
      .filter((t) => t.experienceYears >= 7)
      .sort((a, b) => b.experienceYears - a.experienceYears)[0]
    if (advancedTeacher) {
      recs.push({
        type: 'TEACHER',
        entityId: advancedTeacher.id,
        entityName: advancedTeacher.name,
        reason: `${student.name} متفوق! ${advancedTeacher.name} (${advancedTeacher.experienceYears} سنوات خبرة) سيقدم له تحديات متقدمة.`,
        score: 88,
      })
    }
  }

  return recs.slice(0, 3)
}

/* TODO(phase-5): Add collaborative filtering (students-with-similar-profiles-also-liked). */
