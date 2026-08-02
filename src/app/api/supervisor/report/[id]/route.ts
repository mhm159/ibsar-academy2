import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** DELETE /api/supervisor/report/[id] — delete a supervisor report (own, or any when admin) */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSession()
  if (!sessionUser || (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPERVISOR')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { id } = await params
  const report = await db.supervisorReport.findUnique({ where: { id } })
  if (!report) {
    return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 })
  }

  if (sessionUser.role === 'SUPERVISOR') {
    const sup = await db.supervisor.findUnique({ where: { userId: sessionUser.userId } })
    if (!sup || sup.id !== report.supervisorId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }
  }

  await db.supervisorReport.delete({ where: { id } })
  return NextResponse.json({ ok: true, message: 'تم حذف التقرير' })
}
