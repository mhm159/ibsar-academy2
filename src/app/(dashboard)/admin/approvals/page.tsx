'use client'

import { useEffect, useState } from 'react'
import { UserCheck, Check, X, Clock, Loader2, Star } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, TrackBadge, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { notify } from '@/lib/notify'

interface PendingTeacher {
  id: string
  userId: string
  name: string | null
  phone: string | null
  email: string | null
  country: string | null
  city: string | null
  bio: string | null
  tracks: string[]
  experienceYears: number
  hourlyRateEGP: number
  createdAt: string
}

interface RecentTeacher {
  id: string
  name: string | null
  phone: string | null
  status: string
  tracks: string[]
  updatedAt: string
}

interface ApprovalsData {
  pending: PendingTeacher[]
  recent: RecentTeacher[]
}

export default function AdminApprovalsPage() {
  return (
    <DashboardShell role="ADMIN">
      <ApprovalsView />
    </DashboardShell>
  )
}

function ApprovalsView() {
  const [data, setData] = useState<ApprovalsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const load = () => {
    fetch('/api/dashboard/admin/approvals')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleAction = async (teacherId: string, action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !(await notify.confirm('هل أنت متأكد من رفض هذا المعلم؟'))) return
    setActing(teacherId)
    try {
      const res = await fetch('/api/dashboard/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, action }),
      })
      const d = await res.json()
      if (!res.ok) {
        notify.error(d.error || 'فشل الإجراء')
        return
      }
      notify.success(d.message)
      load()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setActing(null)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) return <p className="text-muted-foreground">تعذّر التحميل</p>

  return (
    <>
      <PageHeader
        title="اعتماد المعلمين"
        description={`${data.pending.length} طلب بانتظار المراجعة`}
      />

      {data.pending.length === 0 ? (
        <Card className="glass border-gold/15 mb-6">
          <EmptyState
            icon={UserCheck}
            title="لا توجد طلبات معلّقة"
            description="جميع طلبات الانضمام تمت مراجعتها"
          />
        </Card>
      ) : (
        <div className="space-y-4 mb-6">
          {data.pending.map((t) => (
            <Card key={t.id} className="p-5 glass border-gold/30 bg-gold/5">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-2xl shrink-0">
                  👩‍🏫
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display font-bold text-lg">{t.name}</h3>
                    <StatusBadge status="PENDING" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2" dir="ltr">
                    {t.phone} {t.email ? `• ${t.email}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t.country} {t.city ? `• ${t.city}` : ''} • {t.experienceYears} سنوات خبرة
                  </p>

                  {t.bio && (
                    <p className="text-sm bg-muted/30 rounded-lg p-3 mb-3">{t.bio}</p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {t.tracks.map((track) => (
                      <TrackBadge key={track} track={track} />
                    ))}
                    <span className="text-xs text-muted-foreground">
                      السعر المقترح: <span className="font-bold">{t.hourlyRateEGP} ج.م</span> / ساعة
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    <Clock className="h-3 w-3 inline ml-1" />
                    تقدم بالطلب: {new Date(t.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    onClick={() => handleAction(t.id, 'APPROVE')}
                    disabled={acting === t.id}
                    className="gap-1.5 bg-emerald-egypt text-white hover:bg-emerald-egypt/90"
                  >
                    {acting === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    اعتماد
                  </Button>
                  <Button
                    onClick={() => handleAction(t.id, 'REJECT')}
                    disabled={acting === t.id}
                    variant="outline"
                    className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                    رفض
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recent decisions */}
      {data.recent.length > 0 && (
        <>
          <h3 className="font-display font-bold mb-3">قرارات حديثة</h3>
          <Card className="glass border-gold/15 overflow-hidden">
            <ul className="divide-y divide-border/30">
              {data.recent.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-sm font-bold shrink-0">
                    {t.name?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{t.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.tracks.map((track) => (
                      <TrackBadge key={track} track={track} />
                    ))}
                    <StatusBadge status={t.status} />
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {new Date(t.updatedAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </>
  )
}
