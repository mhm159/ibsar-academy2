/**
 * Ibdaa Academy — Weekly WhatsApp Performance Reports
 *
 * Generates and sends a weekly Arabic performance summary for each student
 * to their parent via WhatsApp.
 *
 * Called by:
 *   POST /api/reports/send-weekly  (manually by admin or via cron)
 *   Auto-triggered every Friday via a scheduled job (when integrated).
 */

import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

const TRACK_NAMES: Record<string, string> = {
  PROGRAMMING: 'البرمجة 💻',
  ROBOTICS: 'الروبوتيكس 🤖',
  MENTAL_MATH: 'الحساب الذهني 🧮',
}

/** Resolve an Arabic track label from the DB (live data) with a static fallback. */
let trackLabelsCache: Record<string, string> | null = null
async function getTrackLabels(): Promise<Record<string, string>> {
  if (!trackLabelsCache) {
    const tracks = await db.track.findMany({ select: { id: true, nameAr: true } })
    trackLabelsCache = Object.fromEntries(tracks.map((t) => [t.id, t.nameAr]))
    // refresh periodically so edits show up
    setTimeout(() => {
      trackLabelsCache = null
    }, 5 * 60 * 1000)
  }
  return trackLabelsCache
}

const trackLabel = async (id: string) => {
  const labels = await getTrackLabels()
  return labels[id] ?? TRACK_NAMES[id] ?? id
}

const SCORE_EMOJI = (score: number) => {
  if (score >= 90) return '⭐⭐⭐⭐⭐'
  if (score >= 75) return '⭐⭐⭐⭐'
  if (score >= 60) return '⭐⭐⭐'
  if (score >= 40) return '⭐⭐'
  return '⭐'
}

const STARS = (rating: number) => '⭐'.repeat(Math.round(rating))

const ATTENDANCE_AR: Record<string, string> = {
  PRESENT: 'حضر ✅',
  ABSENT: 'غاب ❌',
  LATE: 'تأخر ⚠️',
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface WeeklyReportData {
  parentName: string
  parentPhone: string
  parentId: string
  students: StudentReport[]
}

interface StudentReport {
  studentName: string
  reports: {
    sessionTitle: string
    track: string
    trackLabel: string
    teacherName: string
    attendance: string
    score: number
    engagement: number
    understanding: number
    homework: number
    focusScore: number | null
    notes: string | null
    sessionDate: Date
  }[]
}

// ─── Collect this week's data ─────────────────────────────────────────────────
export async function collectWeeklyReports(): Promise<WeeklyReportData[]> {
  const now = new Date()
  const weekAgo = new Date()
  weekAgo.setDate(now.getDate() - 7)

  // Fetch all parents with phone numbers
  const parents = await db.parent.findMany({
    include: {
      user: { select: { id: true, name: true, phone: true } },
      students: {
        include: {
          progressReports: {
            where: { createdAt: { gte: weekAgo } },
            include: {
              session: { select: { title: true, track: true, startTime: true } },
              teacher: { include: { user: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  })

  const built = await Promise.all(
    parents
      .filter(p => p.user.phone) // only parents with phone numbers
      .map(async parent => {
        const students = await Promise.all(
          parent.students
            .filter(s => s.progressReports.length > 0)
            .map(async student => ({
              studentName: student.name,
              reports: await Promise.all(student.progressReports.map(async r => ({
                sessionTitle: r.session.title,
                track: r.session.track,
                trackLabel: await trackLabel(r.session.track),
                teacherName: r.teacher.user.name ?? 'المعلم',
                attendance: r.attendance,
                score: r.score,
                engagement: r.engagement,
                understanding: r.understanding,
                homework: r.homework,
                focusScore: r.focusScore,
                notes: r.notes,
                sessionDate: r.session.startTime,
              }))),
            }))
        )
        return {
          parentName: parent.user.name ?? 'ولي الأمر',
          parentPhone: parent.user.phone!,
          parentId: parent.id,
          students: students.filter(s => s.reports.length > 0),
        }
      })
  )

  return built.filter(p => p.students.length > 0) // only parents with active children this week
}

// ─── Build the WhatsApp message ───────────────────────────────────────────────
export function buildWeeklyReportMessage(data: WeeklyReportData): string {
  const lines: string[] = []

  lines.push(`🎓 *أكاديمية إبداع*`)
  lines.push(`📊 *التقرير الأسبوعي لأداء أبنائك*`)
  lines.push(`━━━━━━━━━━━━━━━━━━━━`)
  lines.push(``)

  for (const student of data.students) {
    lines.push(`👦 *${student.studentName}*`)
    lines.push(``)

    for (const r of student.reports) {
      const avgRating = Math.round((r.engagement + r.understanding + r.homework) / 3)
      lines.push(`📚 *${r.sessionTitle}*`)
      lines.push(`   🎯 المسار: ${r.trackLabel}`)
      lines.push(`   👩‍🏫 المعلم: ${r.teacherName}`)
      lines.push(`   📅 التاريخ: ${r.sessionDate.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}`)
      lines.push(`   ✔️ الحضور: ${ATTENDANCE_AR[r.attendance] ?? r.attendance}`)
      lines.push(`   📈 الدرجة: ${r.score}/100  ${SCORE_EMOJI(r.score)}`)
      lines.push(`   💡 التقييم العام: ${STARS(avgRating)} (${avgRating}/5)`)
      lines.push(`      • التفاعل: ${STARS(r.engagement)}`)
      lines.push(`      • الفهم: ${STARS(r.understanding)}`)
      lines.push(`      • الواجب: ${STARS(r.homework)}`)
      if (r.focusScore !== null) {
        lines.push(`      • مستوى الانتباه الآلي: ${r.focusScore}% 🧠`)
      }
      if (r.notes) {
        lines.push(`   📝 ملاحظة المعلم: _${r.notes}_`)
      }
      lines.push(``)
    }

    // Weekly summary for this student
    const totalSessions = student.reports.length
    const presentCount = student.reports.filter(r => r.attendance === 'PRESENT').length
    const avgScore = Math.round(student.reports.reduce((sum, r) => sum + r.score, 0) / totalSessions)
    const avgEngagement = Math.round(student.reports.reduce((sum, r) => sum + r.engagement, 0) / totalSessions)

    lines.push(`📊 *ملخص الأسبوع لـ ${student.studentName}:*`)
    lines.push(`   • الحصص هذا الأسبوع: ${totalSessions}`)
    lines.push(`   • نسبة الحضور: ${Math.round((presentCount / totalSessions) * 100)}%`)
    lines.push(`   • متوسط الدرجات: ${avgScore}/100  ${SCORE_EMOJI(avgScore)}`)
    lines.push(`   • مستوى التفاعل: ${STARS(avgEngagement)}`)
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
    lines.push(``)
  }

  lines.push(`💬 للاستفسار أو التواصل مع المعلمين، زر لوحة التحكم:`)
  lines.push(`🔗 https://ibdaa-academy.vercel.app/parent`)
  lines.push(``)
  lines.push(`_أكاديمية إبداع — نُبدِعُ مستقبلَ طفلِك_ 🌟`)

  return lines.join('\n')
}

// ─── Send reports to all parents ─────────────────────────────────────────────
export async function sendWeeklyReportsToAll(): Promise<{
  sent: number
  failed: number
  skipped: number
  details: { parentId: string; phone: string; status: string; error?: string }[]
}> {
  const allReports = await collectWeeklyReports()

  let sent = 0, failed = 0, skipped = 0
  const details: { parentId: string; phone: string; status: string; error?: string }[] = []

  for (const parentData of allReports) {
    if (!parentData.parentPhone) {
      skipped++
      details.push({ parentId: parentData.parentId, phone: '', status: 'SKIPPED_NO_PHONE' })
      continue
    }

    const message = buildWeeklyReportMessage(parentData)

    const result = await sendWhatsAppMessage({
      phone: parentData.parentPhone,
      message,
    })

    if (result.ok) {
      sent++
      details.push({ parentId: parentData.parentId, phone: parentData.parentPhone, status: 'SENT' })
    } else {
      failed++
      details.push({ parentId: parentData.parentId, phone: parentData.parentPhone, status: 'FAILED', error: result.error })
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300))
  }

  return { sent, failed, skipped, details }
}

// ─── Preview a report for a specific parent (for admin testing) ───────────────
export async function previewReportForParent(parentId: string): Promise<string | null> {
  const now = new Date()
  const weekAgo = new Date()
  weekAgo.setDate(now.getDate() - 7)

  const parent = await db.parent.findUnique({
    where: { id: parentId },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      students: {
        include: {
          progressReports: {
            where: { createdAt: { gte: weekAgo } },
            include: {
              session: { select: { title: true, track: true, startTime: true } },
              teacher: { include: { user: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  })

  if (!parent) return null

  const students = await Promise.all(
    parent.students
      .filter(s => s.progressReports.length > 0)
      .map(async student => ({
        studentName: student.name,
        reports: await Promise.all(student.progressReports.map(async r => ({
          sessionTitle: r.session.title,
          track: r.session.track,
          trackLabel: await trackLabel(r.session.track),
          teacherName: r.teacher.user.name ?? 'المعلم',
          attendance: r.attendance,
          score: r.score,
          engagement: r.engagement,
          understanding: r.understanding,
          homework: r.homework,
          focusScore: r.focusScore,
          notes: r.notes,
          sessionDate: r.session.startTime,
        }))),
      }))
  )

  const reportData: WeeklyReportData = {
    parentName: parent.user.name ?? 'ولي الأمر',
    parentPhone: parent.user.phone ?? '',
    parentId: parent.id,
    students,
  }

  if (reportData.students.length === 0) return null
  return buildWeeklyReportMessage(reportData)
}
