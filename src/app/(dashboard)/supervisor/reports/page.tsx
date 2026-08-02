'use client'

import { useEffect, useState } from 'react'
import { FileText, Loader2, Trash2 } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, EmptyState, TrackBadge } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { notify } from '@/lib/notify'

interface Report {
  id: string
  sessionId: string
  sessionTitle: string
  track: string
  sessionStart: string
  supervisorName: string
  rating: number
  notes: string | null
  chatCount: number
  studentCount: number
  avgFocusScore: number
  durationMins: number
  eventsCount: number
  createdAt: string
}

export default function SupervisorReportsPage() {
  return (
    <DashboardShell role="SUPERVISOR">
      <MyReports />
    </DashboardShell>
  )
}

function MyReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/supervisor/report?supervisor=me')
      .then((r) => r.json())
      .then((d) => {
        if (d.reports) setReports(d.reports)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [])

  const remove = async (id: string) => {
    if (!confirm('حذف هذا التقرير؟')) return
    const res = await fetch(`/api/supervisor/report/${id}`, { method: 'DELETE' })
    const d = await res.json()
    if (!res.ok) return notify.error(d.error || 'فشل الحذف')
    notify.success('تم الحذف')
    load()
  }

  return (
    <>
      <PageHeader title="تقاريري" description="كل التقارير التي أصدرتها بضغطة زر" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard icon={FileText} label="إجمالي التقارير" value={reports.length} color="var(--azure)" />
        <StatCard icon={FileText} label="متوسط التقييم" value={reports.length ? (reports.reduce((a, r) => a + r.rating, 0) / reports.length).toFixed(1) : 0} color="var(--gold)" />
        <StatCard icon={FileText} label="طلاب في تقاريري" value={reports.reduce((a, r) => a + r.studentCount, 0)} color="var(--emerald-egypt)" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState
            icon={FileText}
            title="لا توجد تقارير"
            description="أنشئ تقريرك الأول من صفحة الحصص والتقارير"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-4 glass border-gold/15">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold truncate">{r.sessionTitle}</h3>
                    <TrackBadge track={r.track} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(r.sessionStart).toLocaleString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' • '}
                    {r.durationMins} د • {new Date(r.createdAt).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {r.notes && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{r.notes}</p>}
                  <div className="flex flex-wrap gap-2 mt-2 text-[0.7rem]">
                    <span className="rounded-full bg-muted px-2 py-0.5 font-bold">{r.chatCount} رسالة</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-bold">{r.studentCount} طالب</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-bold">{r.eventsCount} حدث</span>
                    {r.avgFocusScore > 0 && (
                      <span className="rounded-full bg-azure/20 px-2 py-0.5 font-bold text-azure">تركيز {r.avgFocusScore}%</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-lg font-bold text-gold">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-destructive hover:bg-destructive/10" onClick={() => remove(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
