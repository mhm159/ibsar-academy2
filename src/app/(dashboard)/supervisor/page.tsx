'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, FileText, ExternalLink, ClipboardCheck, ArrowLeft, Wallet, Sparkles, ChevronLeft } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { StatCard, PageHeader, EmptyState, TrackBadge } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fmtEgp } from '@/lib/money'

export default function SupervisorHomePage() {
  return (
    <DashboardShell role="SUPERVISOR">
      <SupervisorHome />
    </DashboardShell>
  )
}

function SupervisorHome() {
  const [stats, setStats] = useState<{ total: number; completed: number; inProgress: number; totalChat: number }>({
    total: 0,
    completed: 0,
    inProgress: 0,
    totalChat: 0,
  })
  const [reports, setReports] = useState<any[]>([])
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [finance, setFinance] = useState<{ balanceEGP?: number; credits?: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/admin/sessions').then((r) => r.json()),
      fetch('/api/supervisor/report?supervisor=me').then((r) => r.json()),
      fetch('/api/supervisor/payout').then((r) => r.json()),
    ])
      .then(([sessionsData, reportsData, payoutData]) => {
        if (sessionsData.summary) setStats(sessionsData.summary)
        if (sessionsData.sessions) setRecentSessions(sessionsData.sessions.slice(0, 5))
        if (reportsData.reports) setReports(reportsData.reports)
        if (payoutData.balance) setFinance({ balanceEGP: payoutData.balance.balanceEGP, credits: payoutData.credits })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="مرحباً أيها المشرف التربوي 👋"
        description="تابع الحصص كزائر وأصدر تقارير تربوية بضغطة زر"
        action={
          <Link href="/supervisor/sessions">
            <Button className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night">
              <ClipboardCheck className="h-4 w-4" />
              الحصص والتقارير
            </Button>
          </Link>
        }
      />

      {finance && (
        <Link href="/supervisor/finances" className="block mb-6">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-gold/25 bg-gradient-to-l from-gold/15 via-gold/5 to-transparent p-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Wallet className="h-4 w-4 text-gold" />
              رصيدي: {fmtEgp(finance.balanceEGP ?? 0)}
              <span className="inline-flex items-center gap-1 rounded-full bg-violet/10 px-2.5 py-0.5 text-xs font-bold text-violet">
                <Sparkles className="h-3 w-3" />
                كراد: {finance.credits ?? 0}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-gold">
              التفاصيل <ChevronLeft className="h-3 w-3" />
            </span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard icon={CalendarClock} label="إجمالي الحصص" value={stats.total ?? 0} color="var(--azure)" />
        <StatCard icon={CalendarClock} label="مكتملة" value={stats.completed ?? 0} color="var(--emerald-egypt)" />
        <StatCard icon={CalendarClock} label="جارِية الآن" value={stats.inProgress ?? 0} color="var(--gold)" />
        <StatCard icon={FileText} label="تقاريري" value={reports.length} color="var(--kids-teal)" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent sessions */}
        <Card className="p-5 glass border-gold/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">أحدث الحصص</h3>
            <Link href="/supervisor/sessions" className="text-xs text-gold font-bold hover:underline">
              عرض الكل
            </Link>
          </div>
          {recentSessions.length === 0 ? (
            <EmptyState icon={CalendarClock} title="لا توجد حصص" />
          ) : (
            <ul className="space-y-2">
              {recentSessions.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.teacherName} • {new Date(s.startTime).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <TrackBadge track={s.track} />
                    <Link href={`/classroom/${s.id}`} target="_blank" className="text-xs text-gold font-bold hover:underline flex items-center gap-1">
                      متابعة <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* My reports */}
        <Card className="p-5 glass border-gold/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">أحدث تقاريري</h3>
            <Link href="/supervisor/reports" className="text-xs text-gold font-bold hover:underline">
              عرض الكل
            </Link>
          </div>
          {reports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="لا توجد تقارير بعد"
              description="اختر حصة من صفحة الحصص وأنشئ تقريرك الأول بضغطة زر"
            />
          ) : (
            <ul className="space-y-2">
              {reports.slice(0, 5).map((r) => (
                <li key={r.id} className="rounded-lg bg-muted/30 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold truncate">{r.sessionTitle}</p>
                    <span className="text-xs font-bold text-gold shrink-0">{'★'.repeat(r.rating)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3 rotate-180" />
                    {new Date(r.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                    {' • '}
                    {r.chatCount} رسالة • {r.studentCount} طالب
                    {r.avgFocusScore ? ` • تركيز ${r.avgFocusScore}%` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
