'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, Clock, RotateCcw, CreditCard } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, StatusBadge, TrackBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PaymentsData {
  summary: {
    totalPaidEGP: number
    totalPaidUSD: number
    pendingCount: number
    refundedCount: number
  }
  transactions: Array<{
    id: string
    type: string
    amountEGP: number
    amountUSD: number
    currency: string
    status: string
    provider: string
    description: string | null
    createdAt: string
    booking: {
      bookingId: string
      sessionTitle: string
      track: string
      sessionDate: string
      studentName: string
    } | null
  }>
}

export default function ParentPaymentsPage() {
  return (
    <DashboardShell role="PARENT">
      <PaymentsView />
    </DashboardShell>
  )
}

function PaymentsView() {
  const [data, setData] = useState<PaymentsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/parent/payments')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) return <p className="text-muted-foreground">تعذّر التحميل</p>

  return (
    <>
      <PageHeader
        title="المدفوعات"
        description="سجل معاملاتك المالية في الأكاديمية"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard
          icon={Wallet}
          label="إجمالي المدفوع"
          value={`${data.summary.totalPaidEGP} ج.م`}
          hint={`$${data.summary.totalPaidUSD}`}
          color="var(--emerald-egypt)"
        />
        <StatCard icon={Clock} label="مدفوعات معلّقة" value={data.summary.pendingCount} color="var(--gold)" />
        <StatCard icon={RotateCcw} label="مبالغ مسترجعة" value={data.summary.refundedCount} color="var(--kids-teal)" />
        <StatCard icon={TrendingUp} label="عدد المعاملات" value={data.transactions.length} color="var(--azure)" />
      </div>

      {data.transactions.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState
            icon={Wallet}
            title="لا توجد معاملات"
            description="ستظهر معاملاتك هنا بعد حجز أول حصة"
          />
        </Card>
      ) : (
        <Card className="glass border-gold/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/50">
                <tr className="text-right">
                  <th className="px-4 py-3 font-bold text-muted-foreground">الوصف</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground">الطالب</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground hidden sm:table-cell">المسار</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground">المبلغ</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground">الحالة</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground hidden sm:table-cell">التاريخ</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {data.transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gold/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold">{t.description ?? t.type}</p>
                      <p className="text-xs text-muted-foreground">{t.provider}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.booking?.studentName ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {t.booking ? <TrackBadge track={t.booking.track} /> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-gradient-gold">{t.amountEGP} ج.م</p>
                      <p className="text-xs text-muted-foreground">${t.amountUSD}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {new Date(t.createdAt).toLocaleDateString('ar-EG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {(t.status === 'PENDING' || t.status === 'FAILED') && t.booking && (
                        <Link href={`/checkout?booking=${t.booking.bookingId ?? ''}`}>
                          <Button
                            size="sm"
                            className="gap-1 bg-gradient-to-l from-gold to-[#E8D488] text-night h-8"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            ادفع
                          </Button>
                        </Link>
                      )}
                      {t.status === 'PAID' && (
                        <Link href="/parent/refunds">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10 h-8"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            استرجاع
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
