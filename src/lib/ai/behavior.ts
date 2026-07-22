/**
 * Ibsar Academy — AI Behavior Analysis
 *
 * Analyzes a student's progress reports + attendance patterns to detect:
 *   - LOW_ENGAGEMENT: consistently low engagement scores
 *   - STRUGGLING: declining scores / low understanding
 *   - ABSENT: multiple no-shows
 *   - BEHIND: completed fewer sessions than expected
 *   - EXCELLENT_PROGRESS: consistently high performance
 *
 * Generates alerts to parents + recommendations.
 *
 * Uses z-ai-web-dev-sdk LLM for nuanced analysis.
 */

import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

interface BehaviorAnalysis {
  type: 'LOW_ENGAGEMENT' | 'STRUGGLING' | 'ABSENT' | 'BEHIND' | 'EXCELLENT_PROGRESS' | 'ON_TRACK'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string
  recommendation: string
  score: number
  analysis: {
    avgScore: number
    avgEngagement: number
    avgUnderstanding: number
    attendanceRate: number
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING'
    sessionsAnalyzed: number
  }
}

/**
 * Analyze a student's behavior and create alerts if needed.
 * Called periodically (e.g. after each completed session) or on-demand.
 */
export async function analyzeStudentBehavior(
  studentId: string,
): Promise<BehaviorAnalysis | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      parent: { include: { user: { select: { id: true, name: true } } } },
      bookings: {
        where: { status: { in: ['COMPLETED', 'NO_SHOW'] } },
        include: {
          session: { select: { title: true, track: true, startTime: true } },
          progressReports: {
            select: {
              score: true,
              engagement: true,
              understanding: true,
              homework: true,
              attendance: true,
              notes: true,
              createdAt: true,
            },
          },
        },
        orderBy: { session: { startTime: 'asc' } },
      },
    },
  })

  if (!student || student.bookings.length === 0) {
    return null
  }

  // Aggregate metrics
  const reports = student.bookings.flatMap((b) => b.progressReports)
  const totalSessions = student.bookings.length
  const completedSessions = student.bookings.filter((b) => b.status === 'COMPLETED').length
  const noShowSessions = student.bookings.filter((b) => b.status === 'NO_SHOW').length

  const avgScore = reports.length > 0 ? Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length) : 0
  const avgEngagement = reports.length > 0 ? +(reports.reduce((s, r) => s + r.engagement, 0) / reports.length).toFixed(1) : 0
  const avgUnderstanding = reports.length > 0 ? +(reports.reduce((s, r) => s + r.understanding, 0) / reports.length).toFixed(1) : 0
  const presentCount = reports.filter((r) => r.attendance === 'PRESENT').length
  const attendanceRate = reports.length > 0 ? Math.round((presentCount / reports.length) * 100) : 0

  // Detect trend (compare last 3 vs first 3)
  let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE'
  if (reports.length >= 4) {
    const firstHalf = reports.slice(0, Math.floor(reports.length / 2))
    const secondHalf = reports.slice(Math.floor(reports.length / 2))
    const firstAvg = firstHalf.reduce((s, r) => s + r.score, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((s, r) => s + r.score, 0) / secondHalf.length
    if (secondAvg > firstAvg + 10) trend = 'IMPROVING'
    else if (secondAvg < firstAvg - 10) trend = 'DECLINING'
  }

  const baseAnalysis = {
    avgScore,
    avgEngagement,
    avgUnderstanding,
    attendanceRate,
    trend,
    sessionsAnalyzed: totalSessions,
  }

  // Rule-based quick detection (before LLM)
  let detectedType: BehaviorAnalysis['type'] = 'ON_TRACK'
  let severity: BehaviorAnalysis['severity'] = 'LOW'

  if (noShowSessions >= 3) {
    detectedType = 'ABSENT'
    severity = 'HIGH'
  } else if (avgScore > 0 && avgScore < 50) {
    detectedType = 'STRUGGLING'
    severity = 'HIGH'
  } else if (avgEngagement > 0 && avgEngagement < 2.5) {
    detectedType = 'LOW_ENGAGEMENT'
    severity = 'MEDIUM'
  } else if (trend === 'DECLINING' && avgScore < 70) {
    detectedType = 'STRUGGLING'
    severity = 'MEDIUM'
  } else if (avgScore >= 85 && trend !== 'DECLINING') {
    detectedType = 'EXCELLENT_PROGRESS'
    severity = 'LOW'
  } else if (completedSessions < 2 && totalSessions >= 4) {
    detectedType = 'BEHIND'
    severity = 'LOW'
  }

  if (detectedType === 'ON_TRACK') {
    return {
      type: 'ON_TRACK',
      severity: 'LOW',
      description: 'الطالب على المسار الصحيح',
      recommendation: 'استمرار المتابعة',
      score: 80,
      analysis: baseAnalysis,
    }
  }

  // Use LLM for nuanced description + recommendation
  let description = ''
  let recommendation = ''
  let aiScore = 50

  try {
    const zai = await ZAI.create()
    const systemPrompt = `أنت مستشار تعليمي خبير في أكاديمية إبصار للأطفال.
حلل بيانات الطفل التالية واكتب:
1. وصف مختصر بالعربية لحالته (جملة-جملتين)
2. توصية عملية لولي الأمر (جملة واحدة)
3. درجة خطورة من 0-100

أعد الاستجابة بصيغة JSON فقط:
{
  "description": "<وصف>",
  "recommendation": "<توصية>",
  "score": <0-100>
}`

    const userPrompt = `بيانات الطفل:
- الاسم: ${student.name}
- عدد الحصص: ${totalSessions}
- مكتملة: ${completedSessions}
- غياب: ${noShowSessions}
- متوسط الدرجة: ${avgScore}%
- متوسط التفاعل: ${avgEngagement}/5
- متوسط الفهم: ${avgUnderstanding}/5
- نسبة الحضور: ${attendanceRate}%
- الاتجاه: ${trend}

نوع المشكلة المكتشفة: ${detectedType}
الخطورة: ${severity}

ملاحظات المعلمين الأخيرة:
${reports.slice(-3).map((r) => `- ${r.notes ?? 'لا ملاحظات'}`).join('\n')}`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const response = completion.choices[0]?.message?.content ?? ''
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      description = parsed.description ?? ''
      recommendation = parsed.recommendation ?? ''
      aiScore = parsed.score ?? 50
    }
  } catch (err) {
    console.error('[ai-behavior] LLM error:', err)
    // Fallback: rule-based descriptions
    description = getFallbackDescription(detectedType, student.name, baseAnalysis)
    recommendation = getFallbackRecommendation(detectedType)
    aiScore = severity === 'HIGH' ? 80 : severity === 'MEDIUM' ? 60 : 40
  }

  // Persist alert to DB (dedupe: don't create duplicate within 7 days)
  const existingRecent = await db.behaviorAlert.findFirst({
    where: {
      studentId,
      type: detectedType,
      createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  })

  if (!existingRecent) {
    await db.behaviorAlert.create({
      data: {
        studentId,
        studentName: student.name,
        parentId: student.parent.id,
        type: detectedType,
        severity,
        description,
        recommendation,
        analysisJson: JSON.stringify(baseAnalysis),
      },
    })

    // Notify parent
    await db.notification.create({
      data: {
        userId: student.parent.user.id,
        type: 'BEHAVIOR_ALERT',
        title:
          detectedType === 'EXCELLENT_PROGRESS'
            ? `أداء ممتاز لـ ${student.name}! 🌟`
            : `تنبيه: ${student.name}`,
        body: description,
        link: '/parent/reports',
      },
    })
  }

  return {
    type: detectedType,
    severity,
    description,
    recommendation,
    score: aiScore,
    analysis: baseAnalysis,
  }
}

function getFallbackDescription(
  type: string,
  name: string,
  analysis: BehaviorAnalysis['analysis'],
): string {
  switch (type) {
    case 'LOW_ENGAGEMENT':
      return `${name} يظهر تفاعلاً منخفضاً في الحصص (${analysis.avgEngagement}/5). قد يحتاج لأسلوب تدريس أكثر تشويقاً.`
    case 'STRUGGLING':
      return `${name} يعاني في الفهم (متوسط ${analysis.avgScore}%). الاتجاه: ${analysis.trend === 'DECLINING' ? 'تنازلي' : 'ثابت'}. يحتاج لدعم إضافي.`
    case 'ABSENT':
      return `${name} تغيب عن عدة حصص. نسبة الحضور ${analysis.attendanceRate}%.`
    case 'BEHIND':
      return `${name} أتمّ حصصاً أقل من المتوقع. يحتاج لجدولة حصص إضافية.`
    case 'EXCELLENT_PROGRESS':
      return `${name} متفوق! متوسط ${analysis.avgScore}% واتجاه ${analysis.trend === 'IMPROVING' ? 'تصاعدي' : 'ثابت'}.`
    default:
      return 'الطالب على المسار الصحيح'
  }
}

function getFallbackRecommendation(type: string): string {
  switch (type) {
    case 'LOW_ENGAGEMENT':
      return 'جرب تغيير المعلم أو الكورس لأسلوب أكثر تفاعلية. تحدث مع الطفل عن اهتماماته.'
    case 'STRUGGLING':
      return 'حجز حصص تقوية إضافية + مراجعة المواد المسجلة. تواصل مع المعلم لخطة علاجية.'
    case 'ABSENT':
      return 'راجع جدول الحصص مع الطفل. تأكد من عدم وجود تعارضات. تواصل مع المعلم.'
    case 'BEHIND':
      return 'أضف حصصاً أسبوعياً للوصول للمستوى المطلوب. استفد من باقة النخبة.'
    case 'EXCELLENT_PROGRESS':
      return 'تحدي الطفل بمسارات جديدة (روبوتيكس/حساب ذهني) أو مستوى متقدم.'
    default:
      return 'استمرار المتابعة الدورية'
  }
}

/* TODO(phase-5): Add weekly digest emails summarizing all students' behavior. */
