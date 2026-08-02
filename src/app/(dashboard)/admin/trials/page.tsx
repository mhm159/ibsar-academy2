'use client'
import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, TrackBadge, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Phone, User, Calendar, Loader2, PlayCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { formatDateTime } from '@/lib/datetime'
import { notify } from '@/lib/notify'

interface Trial {
  id: string
  title: string
  track: string
  startTime: string
  status: string
  teacherName: string
  studentName: string
  parentName: string
  parentPhone: string
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'مجدولة',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
}

const FILTERS = [
  { key: 'ALL', label: 'الكل' },
  { key: 'SCHEDULED', label: 'مجدولة' },
  { key: 'IN_PROGRESS', label: 'قيد التنفيذ' },
  { key: 'COMPLETED', label: 'مكتملة' },
  { key: 'CANCELLED', label: 'ملغاة' },
]

export default function AdminTrialsPage() {
  return (
    <DashboardShell role="ADMIN">
      <AdminTrialsContent />
    </DashboardShell>
  )
}

function AdminTrialsContent() {
  const [trials, setTrials] = useState<Trial[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/admin/trials')
      .then((r) => r.json())
      .then((d) => { if (d.trials) setTrials(d.trials) })
      .catch(() => notify.error('تعذّر تحميل الطلبات'))
      .finally(() => setLoading(false))
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/dashboard/admin/trials')
      const d = await r.json()
      if (d.trials) setTrials(d.trials)
    } catch {
      notify.error('تعذّر تحميل الطلبات')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (trialId: string, status: string, label: string) => {
    if (status === 'CANCELLED') {
      const ok = await notify.confirm(`هل تريد إلغاء هذه الحصة التجريبية؟`, {
        title: 'إلغاء الحصة',
        confirmLabel: 'نعم، إلغاء',
        danger: true,
      })
      if (!ok) return
    }
    setActing(trialId)
    try {
      const res = await fetch('/api/dashboard/admin/trials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: trialId, status }),
      })
      const d = await res.json()
      if (!res.ok) {
        notify.error(d.error || 'فشل التحديث')
        return
      }
      notify.success(`تم تحديث الحالة إلى «${label}»`)
      load()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setActing(null)
    }
  }

  const filtered = trials.filter((t) => filter === 'ALL' || t.status === filter)
  const counts = FILTERS.map((f) => ({
    ...f,
    count: f.key === 'ALL' ? trials.length : trials.filter((t) => t.status === f.key).length,
  }))

  return (
    <>
      <PageHeader
        title="الحصص التجريبية المجانية"
        description="متابعة الحصص التجريبية المحجوزة تلقائياً في جدول المعلمين، وإدارة حالتها لرفع معدلات التحويل."
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-gold/30 bg-gold/10 text-gold font-bold text-sm hover:bg-gold/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> تحديث
          </button>
        }
      />

      {/* Summary + filters */}
      <div className="flex flex-wrap gap-2 mt-6">
        {counts.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
              filter === f.key
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="grid gap-4 mt-4">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
        ) : filtered.length === 0 ? (
          <Card className="glass border-gold/15">
            <EmptyState
              icon={Calendar}
              title="لا توجد حصص تجريبية"
              description="لم يقم أي ولي أمر بحجز حصة تجريبية بعد."
            />
          </Card>
        ) : (
          filtered.map(trial => (
            <Card key={trial.id} className="p-5 glass border-gold/15 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <div className="flex gap-2 items-center mb-2 flex-wrap">
                  <TrackBadge track={trial.track} />
                  <StatusBadge status={trial.status} label={STATUS_LABELS[trial.status] ?? trial.status} />
                  {trial.title.includes('تجريبية') && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-l from-gold/20 to-amber-400/20 text-amber-500 border border-gold/30">
                      🎁 مجانية
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg">{trial.studentName}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" />
                  {formatDateTime(trial.startTime)}
                </p>
              </div>

              <div className="flex flex-col gap-2 text-sm bg-background/50 p-3 rounded-xl border border-border/50 min-w-[240px]">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-azure" />
                  <span className="font-semibold text-muted-foreground w-24">ولي الأمر:</span>
                  <span className="font-bold">{trial.parentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-egypt" />
                  <span className="font-semibold text-muted-foreground w-24">الهاتف:</span>
                  <a href={`https://wa.me/${trial.parentPhone.replace(/\+/g, '')}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-bold" dir="ltr">
                    {trial.parentPhone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gold" />
                  <span className="font-semibold text-muted-foreground w-24">المعلم:</span>
                  <span className="font-bold">{trial.teacherName}</span>
                </div>
              </div>

              {/* Status management */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-muted-foreground">تحديث الحالة:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => updateStatus(trial.id, 'IN_PROGRESS', 'قيد التنفيذ')}
                    disabled={acting === trial.id || trial.status === 'IN_PROGRESS' || trial.status === 'COMPLETED' || trial.status === 'CANCELLED'}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold border border-azure/30 bg-azure/10 text-azure disabled:opacity-40 disabled:cursor-not-allowed hover:bg-azure/20 transition-colors"
                  >
                    <PlayCircle className="w-3.5 h-3.5" /> بدء
                  </button>
                  <button
                    onClick={() => updateStatus(trial.id, 'COMPLETED', 'مكتملة')}
                    disabled={acting === trial.id || trial.status === 'COMPLETED' || trial.status === 'CANCELLED'}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-egypt disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-500/20 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> إكمال
                  </button>
                  <button
                    onClick={() => updateStatus(trial.id, 'CANCELLED', 'ملغاة')}
                    disabled={acting === trial.id || trial.status === 'COMPLETED' || trial.status === 'CANCELLED'}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold border border-destructive/30 bg-destructive/10 text-destructive disabled:opacity-40 disabled:cursor-not-allowed hover:bg-destructive/20 transition-colors"
                  >
                    {acting === trial.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} إلغاء
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  )
}
