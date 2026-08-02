'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Clock, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, StatusBadge, TrackBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { notify } from '@/lib/notify'

interface Escrow {
  id: string
  status: string
  amountEGP: number
  amountUSD: number
  platformFeeEGP: number
  platformFeeUSD: number
  teacherShareEGP: number
  teacherShareUSD: number
  createdAt: string
  releasedAt: string | null
  teacherName: string | null
  sessionTitle: string | null
  sessionEndTime: string | null
  sessionStatus: string | null
  studentName: string | null
  transaction: {
    description: string | null
    paymentMethod: string | null
    provider: string
    createdAt: string
  }
}

interface Data {
  summary: {
    heldCount: number
    heldEGP: number
    heldUSD: number
    releasedCount: number
    releasedEGP: number
    releasedUSD: number
    refundedCount: number
    refundedEGP: number
    platformFeeEGP: number
    platformFeeUSD: number
  }
  escrows: Escrow[]
}

export default function AdminEscrowPage() {
  return (
    <DashboardShell role="ADMIN">
      <EscrowAdmin />
    </DashboardShell>
  )
}

function EscrowAdmin() {
  const [data, setData] = useState<Data | null>(null)
  const [statusFilter, setStatusFilter] = useState('HELD')
  const [acting, setActing] = useState<string | null>(null)
  const loading = data === null

  const load = () => {
    fetch(`/api/dashboard/admin/escrow?status=${statusFilter}`)
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
    load()
      
  }, [statusFilter])

  const handleAction = async (escrowId: string, action: 'RELEASE' | 'REFUND') => {
    if (action === 'REFUND') {
      const reason = await notify.prompt('سبب الاسترجاع؟', { placeholder: 'اكتب السبب...' })
      if (!reason) return
      setActing(escrowId)
      try {
        const res = await fetch('/api/dashboard/admin/escrow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ escrowId, action, reason }),
        })
        const d = await res.json()
        if (!res.ok) {
          notify.error(d.error || 'فشل')
          return
        }
        notify.success(d.message)
        load()
      } finally {
        setActing(null)
      }
    } else {
      if (!(await notify.confirm('تأكيد تحرير الأموال للمعلم؟'))) return
      setActing(escrowId)
      try {
        const res = await fetch('/api/dashboard/admin/escrow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ escrowId, action }),
        })
        const d = await res.json()
        if (!res.ok) {
          notify.error(d.error || 'فشل')
          return
        }
        notify.success(d.message)
        load()
      } finally {
        setActing(null)
      }
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

  const fmtEGP = (piasters: number) => `${(piasters / 100).toFixed(0)} ج.م`
  const fmtUSD = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <>
      <PageHeader
        title="الضمان المالي (Escrow)"
        description="الأموال المحتجزة حتى إتمام الحصص + تحريرها للمعلمين"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Clock}
          label="محتجز (HELD)"
          value={fmtEGP(data.summary.heldEGP)}
          hint={`${data.summary.heldCount} معاملة`}
          color="var(--gold)"
        />
        <StatCard
          icon={CheckCircle2}
          label="محرر للمعلمين"
          value={fmtEGP(data.summary.releasedEGP)}
          hint={`${data.summary.releasedCount} معاملة`}
          color="var(--emerald-egypt)"
        />
        <StatCard
          icon={RotateCcw}
          label="مسترجع"
          value={fmtEGP(data.summary.refundedEGP)}
          hint={`${data.summary.refundedCount} معاملة`}
          color="var(--kids-teal)"
        />
        <StatCard
          icon={ShieldCheck}
          label="عمولة المنصة"
          value={fmtEGP(data.summary.platformFeeEGP)}
          hint={fmtUSD(data.summary.platformFeeUSD)}
          color="var(--azure)"
        />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground">تصفية:</span>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setData(null)
            setStatusFilter(v)
          }}
        >
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="HELD">محتجز</SelectItem>
            <SelectItem value="RELEASED">محرر</SelectItem>
            <SelectItem value="REFUNDED">مسترجع</SelectItem>
            <SelectItem value="">الكل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.escrows.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState icon={ShieldCheck} title="لا توجد عمليات ضمان" />
        </Card>
      ) : (
        <div className="space-y-3">
          {data.escrows.map((e) => (
            <Card key={e.id} className="p-5 glass border-gold/15">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <StatusBadge status={e.status} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="font-bold mb-1">{e.sessionTitle ?? e.transaction.description}</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    المعلم: {e.teacherName} • الطالب: {e.studentName}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/30 p-2">
                      <p className="text-muted-foreground">الإجمالي</p>
                      <p className="font-bold">{fmtEGP(e.amountEGP)}</p>
                    </div>
                    <div className="rounded-lg bg-azure/10 p-2">
                      <p className="text-muted-foreground">عمولة المنصة (15%)</p>
                      <p className="font-bold text-azure">{fmtEGP(e.platformFeeEGP)}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-egypt/10 p-2">
                      <p className="text-muted-foreground">نصيب المعلم</p>
                      <p className="font-bold text-emerald-egypt">{fmtEGP(e.teacherShareEGP)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2">
                      <p className="text-muted-foreground">طريقة الدفع</p>
                      <p className="font-bold">{e.transaction.paymentMethod ?? e.transaction.provider}</p>
                    </div>
                  </div>

                  {e.sessionEndTime && (
                    <p className="text-xs text-muted-foreground mt-2">
                      نهاية الحصة: {new Date(e.sessionEndTime).toLocaleDateString('ar-EG')}
                      {e.sessionStatus === 'COMPLETED' && (
                        <span className="text-emerald-egypt font-bold mr-2">✓ مكتملة</span>
                      )}
                    </p>
                  )}
                  {e.releasedAt && (
                    <p className="text-xs text-emerald-egypt mt-2">
                      تم التحرير: {new Date(e.releasedAt).toLocaleDateString('ar-EG')}
                    </p>
                  )}
                </div>

                {e.status === 'HELD' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      onClick={() => handleAction(e.id, 'RELEASE')}
                      disabled={acting === e.id}
                      size="sm"
                      className="gap-1.5 bg-emerald-egypt text-white hover:bg-emerald-egypt/90"
                    >
                      {acting === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      تحرير للمعلم
                    </Button>
                    <Button
                      onClick={() => handleAction(e.id, 'REFUND')}
                      disabled={acting === e.id}
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <RotateCcw className="h-4 w-4" />
                      استرجاع لولي الأمر
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
