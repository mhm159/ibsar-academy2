import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sendWeeklyReportsToAll, previewReportForParent, collectWeeklyReports } from '@/lib/weekly-reports'

/**
 * POST /api/reports/send-weekly
 * Body: { action: 'send' | 'preview' | 'dry-run', parentId?: string }
 *
 * - 'send'    → sends WhatsApp reports to ALL parents with active children
 * - 'preview' → returns the formatted message for a specific parentId (no WhatsApp)
 * - 'dry-run' → shows how many parents would receive reports (no WhatsApp)
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json()
  const { action, parentId } = body as { action: string; parentId?: string }

  if (!action) {
    return NextResponse.json({ error: 'يرجى تحديد الإجراء (action)' }, { status: 422 })
  }

  if (action === 'preview') {
    if (!parentId) {
      return NextResponse.json({ error: 'parentId مطلوب للمعاينة' }, { status: 422 })
    }
    const preview = await previewReportForParent(parentId)
    if (!preview) {
      return NextResponse.json({ error: 'لا توجد بيانات لهذا الأسبوع لهذا الحساب' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, preview })
  }

  if (action === 'dry-run') {
    const reports = await collectWeeklyReports()
    return NextResponse.json({
      ok: true,
      wouldSend: reports.length,
      parents: reports.map(r => ({
        parentId: r.parentId,
        parentName: r.parentName,
        phone: r.parentPhone,
        studentsCount: r.students.length,
        sessionsCount: r.students.reduce((sum, s) => sum + s.reports.length, 0),
      })),
    })
  }

  if (action === 'send') {
    const result = await sendWeeklyReportsToAll()
    return NextResponse.json({
      ok: true,
      message: `تم الإرسال: ${result.sent} | فشل: ${result.failed} | تم تخطيه: ${result.skipped}`,
      ...result,
    })
  }

  return NextResponse.json({ error: 'action غير صحيح. استخدم: send | preview | dry-run' }, { status: 422 })
}
