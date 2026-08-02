'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CalendarClock,
  FileText,
  Loader2,
  Search,
  ExternalLink,
  CheckCircle2,
  Star,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, StatusBadge, EmptyState, TrackBadge } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { notify } from '@/lib/notify'

interface SessionRow {
  id: string
  title: string
  track: string
  status: string
  startTime: string
  durationMins: number
  teacherName: string | null
  studentsCount: number
  chatCount: number
  activityCount: number
  avgFocusScore: number | null
  reportsCount: number
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'مجدولة',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
  IN_PROGRESS: 'جارِية',
}

export default function SupervisorSessionsPage() {
  return (
    <DashboardShell role="SUPERVISOR">
      <SessionsList />
    </DashboardShell>
  )
}

function SessionsList() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [reportFor, setReportFor] = useState<SessionRow | null>(null)
  const [savedFor, setSavedFor] = useState<string[]>([])

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    fetch(`/api/dashboard/admin/sessions?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.sessions) {
          setSessions(d.sessions)
          setSavedFor(d.sessions.filter((s: SessionRow) => s.reportsCount > 0).map((s: SessionRow) => s.id))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [q])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  return (
    <>
      <PageHeader
        title="الحصص والتقارير"
        description="دخل كزائر لمتابعة أي حصة، ثم ولّد تقريرك بضغطة زر"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={CalendarClock} label="إجمالي الحصص" value={sessions.length} color="var(--azure)" />
        <StatCard icon={FileText} label="حصص لديها تقرير" value={savedFor.length} color="var(--emerald-egypt)" />
        <StatCard icon={CalendarClock} label="مكتملة" value={sessions.filter((s) => s.status === 'COMPLETED').length} color="var(--gold)" />
        <StatCard icon={FileText} label="رسائل الشات" value={sessions.reduce((a, s) => a + s.chatCount, 0)} color="var(--kids-teal)" />
      </div>

      <div className="relative flex-1 max-w-md mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input placeholder="بحث باسم الحصة أو المعلم..." value={q} onChange={(e) => setQ(e.target.value)} className="pr-10 h-11" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState icon={CalendarClock} title="لا توجد حصص" description="ستظهر الحصص هنا لمتابعتها وإصدار تقارير عنها" />
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const hasReport = savedFor.includes(s.id)
            return (
              <Card key={s.id} className="p-4 glass border-gold/15">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-lg shrink-0">
                    {s.track === 'ROBOTICS' ? '🤖' : s.track === 'PROGRAMMING' ? '💻' : s.track === 'MENTAL_MATH' ? '🧮' : '🎨'}
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold truncate">{s.title}</h3>
                      <TrackBadge track={s.track} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.teacherName} • {new Date(s.startTime).toLocaleString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={s.status} label={STATUS_LABELS[s.status] ?? s.status} />
                    {s.avgFocusScore != null && <span className="text-xs font-bold text-azure">تركيز {s.avgFocusScore}%</span>}
                    <span className="text-xs text-muted-foreground">{s.chatCount} رسالة</span>
                    {hasReport && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-egypt">
                        <CheckCircle2 className="h-3.5 w-3.5" /> تقرير
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/classroom/${s.id}`} target="_blank">
                      <Button size="sm" variant="outline" className="h-9 gap-1.5">
                        <ExternalLink className="h-4 w-4" />
                        دخول كزائر
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      className="h-9 gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night"
                      onClick={() => setReportFor(s)}
                    >
                      <FileText className="h-4 w-4" />
                      تقرير
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ReportDialog
        session={reportFor}
        onClose={() => setReportFor(null)}
        onSaved={(id) => {
          setReportFor(null)
          setSavedFor((prev) => (prev.includes(id) ? prev : [...prev, id]))
          load()
        }}
      />
    </>
  )
}

function ReportDialog({
  session,
  onClose,
  onSaved,
}: {
  session: SessionRow | null
  onClose: () => void
  onSaved: (sessionId: string) => void
}) {
  const [rating, setRating] = useState(4)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!session) return
    setSaving(true)
    try {
      const res = await fetch('/api/supervisor/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, notes, rating }),
      })
      const d = await res.json()
      if (!res.ok) return notify.error(d.error || 'فشل إنشاء التقرير')
      notify.success('تم إنشاء التقرير بنجاح')
      onSaved(session.id)
    } catch {
      notify.error('تعذّر إنشاء التقرير')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!session} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تقرير الحصة</DialogTitle>
        </DialogHeader>
        {session && (
          <div className="space-y-4 mt-2">
            <div className="rounded-xl bg-muted/40 p-3 text-sm">
              <p className="font-bold">{session.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {session.teacherName} • {session.studentsCount} طالب • {session.chatCount} رسالة
                {session.avgFocusScore != null ? ` • تركيز ${session.avgFocusScore}%` : ''}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">التقييم</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={n <= rating ? 'text-gold' : 'text-muted-foreground/30'}
                  >
                    <Star className="h-6 w-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">ملاحظات</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظاتك عن سير الحصة ومشاركة الطلاب..."
                rows={4}
              />
            </div>

            <Button onClick={submit} disabled={saving} className="w-full gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              إنشاء التقرير
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
