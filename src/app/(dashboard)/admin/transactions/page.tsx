'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, Clock, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, StatusBadge, TrackBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'

interface TransactionsData {
  summary: {
    totalRevenueEGP: number
    totalRevenueUSD: number
    pendingCount: number
    paidCount: number
    refundedCount: number
    failedCount: number
  }
  transactions: Array<{
    id: string
    type: string
    amountEGP: number
    amountUSD: number
    currency: string
    status: string
    provider: string
    providerRef: string | null
    description: string | null
    createdAt: string
    parentName: string | null
    parentPhone: string | null
    parentCountry: string | null
    booking: {
      sessionTitle: string
      track: string
      studentName: string
    } | null
  }>
}

export default function AdminTransactionsPage() {
  return (
    <DashboardShell role="ADMIN">
      <TransactionsView />
    </DashboardShell>
  )
}

function TransactionsView() {
  const [data, setData] = useState<TransactionsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/admin/transactions')
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
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) return <p className="text-muted-foreground">تعذّر التحميل</p>

  return (
    <>
      <PageHeader
        title="المعاملات المالية"
        description="جميع معاملات المنصة"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard
          icon={Wallet}
          label="إجمالي الإيرادات"
          value={`${data.summary.totalRevenueEGP} ج.م`}
          hint={`$${data.summary.totalRevenueUSD}`}
          color="var(--emerald-egypt)"
        />
        <StatCard icon={CheckCircle2} label="مدفوعة" value={data.summary.paidCount} color="var(--azure)" />
        <StatCard icon={Clock} label="معلّقة" value={data.summary.pendingCount} color="var(--gold)" />
        <StatCard icon={RotateCcw} label="مسترجعة" value={data.summary.refundedCount} color="var(--kids-teal)" />
      </div>

      {data.transactions.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState icon={Wallet} title="لا توجد معاملات" description="ستظهر المعاملات هنا عند بدء الحجوزات" />
        </Card>
      ) : (
        <Card className="glass border-gold/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/50">
                <tr className="text-right">
                  <th className="px-4 py-3 font-bold text-muted-foreground">الوصف</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground">ولي الأمر</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground hidden md:table-cell">الطالب</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground hidden lg:table-cell">المسار</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground">المبلغ</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground">الحالة</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground hidden sm:table-cell">المزوّد</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground hidden md:table-cell">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {data.transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gold/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold">{t.description ?? t.type}</p>
                      {t.providerRef && (
                        <p className="text-xs text-muted-foreground" dir="ltr">{t.providerRef}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold">{t.parentName}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{t.parentPhone}</p>
                      <p className="text-xs text-muted-foreground">{t.parentCountry}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {t.booking?.studentName ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {t.booking ? <TrackBadge track={t.booking.track} /> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-gradient-gold">{t.amountEGP} ج.م</p>
                      <p className="text-xs text-muted-foreground">${t.amountUSD}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted">
                        {t.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {new Date(t.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
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
