'use client'

import { useEffect, useState } from 'react'
import { RotateCcw, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface Refund {
  id: string
  reason: string
  details: string | null
  status: string
  amountEGP: number
  amountUSD: number
  adminNotes: string | null
  createdAt: string
  processedAt: string | null
  transaction: {
    description: string | null
    amountEGP: number
    currency: string
    sessionTitle: string | null
    studentName: string | null
  }
}

const REASON_LABELS: Record<string, string> = {
  CHILD_SICK: 'مرض الطفل',
  SCHEDULING_CONFLICT: 'تعارض مواعيد',
  TEACHER_ISSUE: 'مشكلة مع المعلم',
  NOT_SATISFIED: 'عدم رضا عن الحصة',
  OTHER: 'سبب آخر',
}

export default function ParentRefundsPage() {
  return (
    <DashboardShell role="PARENT">
      <RefundsView />
    </DashboardShell>
  )
}

function RefundsView() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/parent/refunds')
      .then((r) => r.json())
      .then((d) => {
        if (d.refunds) setRefunds(d.refunds)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="طلبات الاسترجاع"
        description="تتبع طلبات استرجاع المبالغ"
      />

      {refunds.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState
            icon={RotateCcw}
            title="لا توجد طلبات استرجاع"
            description="يمكنك طلب استرجاع المبلغ من صفحة المدفوعات خلال أول حصتين"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {refunds.map((r) => (
            <Card key={r.id} className="p-5 glass border-gold/15">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="font-bold mb-1">{r.transaction.sessionTitle ?? r.transaction.description}</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {r.transaction.studentName}
                  </p>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="font-bold text-gradient-gold">{(r.amountEGP / 100).toFixed(0)} ج.م</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">السبب: {REASON_LABELS[r.reason] ?? r.reason}</span>
                  </div>
                  {r.details && (
                    <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 mb-2">
                      التفاصيل: {r.details}
                    </p>
                  )}
                  {r.adminNotes && (
                    <p className="text-xs bg-gold/10 text-gold rounded-lg p-2">
                      ملاحظات الإدارة: {r.adminNotes}
                    </p>
                  )}
                  {r.processedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      تم المعالجة: {new Date(r.processedAt).toLocaleDateString('ar-EG')}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {r.status === 'PENDING' && <Clock className="h-6 w-6 text-gold" />}
                  {r.status === 'PROCESSED' && <CheckCircle2 className="h-6 w-6 text-emerald-egypt" />}
                  {r.status === 'REJECTED' && <XCircle className="h-6 w-6 text-destructive" />}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
