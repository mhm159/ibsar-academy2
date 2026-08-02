'use client'

import { useEffect, useState } from 'react'
import { Star, Flag, Check, Trash2, Loader2, MessageSquare } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, StarRating, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { notify } from '@/lib/notify'

interface Review {
  id: string
  sessionId: string
  reviewedId: string
  reviewedRole: string
  reviewerId: string
  reviewerRole: string
  reviewerName: string
  rating: number
  comment: string | null
  tags: string
  isApproved: boolean
  isFlagged: boolean
  flagReason: string | null
  createdAt: string
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })

export default function AdminReviewsPage() {
  return (
    <DashboardShell role="ADMIN">
      <ReviewsAdmin />
    </DashboardShell>
  )
}

function ReviewsAdmin() {
  const [data, setData] = useState<{ reviews: Review[]; summary: any } | null>(null)
  const [tab, setTab] = useState('all')
  const [acting, setActing] = useState<string | null>(null)
  const loading = data === null

  const load = (flaggedOnly = false) => {
    fetch(`/api/dashboard/admin/reviews${flaggedOnly ? '?flagged=true' : ''}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setData(null)
          return
        }
        setData(d)
      })
      .catch(() => setData(null))
  }

  useEffect(() => {
    load(tab === 'flagged')
  }, [tab])

  const handleAction = async (reviewId: string, action: 'APPROVE' | 'FLAG' | 'UNFLAG' | 'DELETE') => {
    if (action === 'DELETE' && !(await notify.confirm('حذف هذا التقييم نهائياً؟', { danger: true }))) return
    if (action === 'FLAG') {
      const reason = await notify.prompt('سبب الإبلاغ؟', { placeholder: 'اكتب السبب...' })
      if (!reason) return
      setActing(reviewId)
      try {
        await fetch('/api/dashboard/admin/reviews', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewId, action, reason }),
        })
        notify.success('تم الإبلاغ')
        load(tab === 'flagged')
      } finally {
        setActing(null)
      }
      return
    }
    setActing(reviewId)
    try {
      const res = await fetch('/api/dashboard/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action }),
      })
      const d = await res.json()
      if (d.ok) {
        notify.success(d.message ?? 'تم')
        load(tab === 'flagged')
      }
    } finally {
      setActing(null)
    }
  }

  if (loading || !data) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="إدارة التقييمات"
        description="مراجعة ومعالجة تقييمات المستخدمين"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={MessageSquare} label="إجمالي التقييمات" value={data.summary.total} color="var(--azure)" />
        <StatCard icon={Star} label="متوسط التقييم" value={data.summary.avgRating || '—'} color="var(--gold)" />
        <StatCard icon={Flag} label="مبلّغ عنها" value={data.summary.flagged} color="var(--kids-red)" />
        <StatCard icon={Check} label="معتمدة" value={data.reviews.filter((r) => r.isApproved && !r.isFlagged).length} color="var(--emerald-egypt)" />
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setData(null)
          setTab(v)
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 glass border border-gold/20 max-w-md">
          <TabsTrigger value="all" className="data-[state=active]:bg-gold data-[state=active]:text-night">
            الكل ({data.summary.total})
          </TabsTrigger>
          <TabsTrigger value="flagged" className="data-[state=active]:bg-gold data-[state=active]:text-night">
            مبلّغ عنها ({data.summary.flagged})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {data.reviews.length === 0 ? (
            <Card className="glass border-gold/15">
              <EmptyState icon={MessageSquare} title="لا توجد تقييمات" />
            </Card>
          ) : (
            data.reviews.map((r) => (
              <Card key={r.id} className={`p-4 glass border-gold/15 ${r.isFlagged ? 'border-kids-red/40 bg-kids-red/5' : ''}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <StarRating value={r.rating} />
                      <span className="text-xs text-muted-foreground">
                        {r.reviewerName} ({r.reviewerRole}) → {r.reviewedRole}
                      </span>
                      {r.isFlagged && <StatusBadge status="REJECTED" label="مبلّغ" />}
                      {!r.isApproved && !r.isFlagged && <StatusBadge status="PENDING" label="معلّق" />}
                    </div>
                    {r.comment && (
                      <p className="text-sm bg-muted/30 rounded-lg p-3 mb-2">"{r.comment}"</p>
                    )}
                    {r.flagReason && (
                      <p className="text-xs text-kids-red bg-kids-red/10 rounded-lg p-2">
                        سبب الإبلاغ: {r.flagReason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{fmtDate(r.createdAt)}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    {r.isFlagged && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={acting === r.id}
                        onClick={() => handleAction(r.id, 'UNFLAG')}
                        className="h-7 gap-1 text-xs text-emerald-egypt hover:bg-emerald-egypt/10"
                      >
                        {acting === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        إلغاء البلاغ
                      </Button>
                    )}
                    {!r.isFlagged && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={acting === r.id}
                        onClick={() => handleAction(r.id, 'FLAG')}
                        className="h-7 gap-1 text-xs text-kids-red hover:bg-kids-red/10"
                      >
                        <Flag className="h-3 w-3" />
                        إبلاغ
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={acting === r.id}
                      onClick={() => handleAction(r.id, 'DELETE')}
                      className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                      حذف
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
