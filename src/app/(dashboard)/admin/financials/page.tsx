'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Wallet, Clock, RotateCcw, ShieldCheck, Coins } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, StatusBadge } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface Financials {
  summary: {
    totalRevenueEGP: number
    totalRevenueUSD: number
    totalDiscountsEGP: number
    totalDiscountsUSD: number
    totalPlatformFeeEGP: number
    totalPlatformFeeUSD: number
    totalPaidOutEGP: number
    totalPaidOutUSD: number
    pendingPayoutsEGP: number
    pendingPayoutsCount: number
    totalRefundedEGP: number
    totalRefundedCount: number
    heldEscrowEGP: number
    heldEscrowCount: number
    releasedEscrowEGP: number
    releasedEscrowCount: number
    netProfitEGP: number
    transactionsCount: number
  }
  byCountry: Record<string, { count: number; egp: number; usd: number }>
  byProvider: Record<string, { count: number; egp: number; usd: number }>
  byMethod: Record<string, { count: number; egp: number }>
  recentTransactions: Array<{
    id: string
    amountEGP: number
    amountUSD: number
    currency: string
    status: string
    provider: string
    paymentMethod: string | null
    buyerCountry: string | null
    description: string | null
    createdAt: string
    couponCode: string | null
  }>
}

const COUNTRY_FLAGS: Record<string, string> = {
  EG: '🇪🇬', SA: '🇸🇦', AE: '🇦🇪', KW: '🇰🇼', QA: '🇶🇦', BH: '🇧🇭', OM: '🇴🇲', JO: '🇯🇴',
}

const PROVIDER_LABELS: Record<string, string> = {
  PAYMOB: 'PayMob (مصر)',
  STRIPE: 'Stripe (خليج)',
  MANUAL: 'يدوي',
}

const METHOD_LABELS: Record<string, string> = {
  CARD: '💳 بطاقة',
  FAWRY: '🏪 فوري',
  VODAFONE_CASH: '📱 فودافون كاش',
  ETISALAT_CASH: '📱 اتصالات كاش',
  ORANGE_CASH: '📱 أورانج كاش',
  WE_PAY: '📱 وي',
  MEZA: '💳 ميزة',
  APPLE_PAY: '🍎 Apple Pay',
  MADA: '💳 مدى',
  STC_PAY: '📱 STC Pay',
}

export default function AdminFinancialsPage() {
  return (
    <DashboardShell role="ADMIN">
      <FinancialsView />
    </DashboardShell>
  )
}

function FinancialsView() {
  const [data, setData] = useState<Financials | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/admin/financials')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  const s = data.summary
  const fmtEGP = (p: number) => `${(p / 100).toFixed(0)} ج.م`
  const fmtUSD = (c: number) => `$${(c / 100).toFixed(2)}`

  return (
    <>
      <PageHeader
        title="التقارير المالية"
        description="نظرة شاملة على إيرادات المنصة وأرباحها والتزاماتها"
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          icon={TrendingUp}
          label="إجمالي الإيرادات"
          value={fmtEGP(s.totalRevenueEGP)}
          hint={fmtUSD(s.totalRevenueUSD)}
          color="var(--emerald-egypt)"
        />
        <StatCard
          icon={Coins}
          label="عمولة المنصة (15%)"
          value={fmtEGP(s.totalPlatformFeeEGP)}
          hint={fmtUSD(s.totalPlatformFeeUSD)}
          color="var(--gold)"
        />
        <StatCard
          icon={ShieldCheck}
          label="صافي الربح"
          value={fmtEGP(s.netProfitEGP)}
          hint="بعد الاسترجاعات"
          color="var(--azure)"
        />
        <StatCard
          icon={Wallet}
          label="مسحوب للمعلمين"
          value={fmtEGP(s.totalPaidOutEGP)}
          hint={fmtUSD(s.totalPaidOutUSD)}
          color="var(--kids-teal)"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Clock}
          label="ضمان محتجز"
          value={fmtEGP(s.heldEscrowEGP)}
          hint={`${s.heldEscrowCount} معاملة`}
          color="var(--gold)"
        />
        <StatCard
          icon={Clock}
          label="طلبات سحب معلّقة"
          value={fmtEGP(s.pendingPayoutsEGP)}
          hint={`${s.pendingPayoutsCount} طلب`}
          color="var(--kids-red)"
        />
        <StatCard
          icon={RotateCcw}
          label="مبالغ مسترجعة"
          value={fmtEGP(s.totalRefundedEGP)}
          hint={`${s.totalRefundedCount} معاملة`}
          color="var(--destructive)"
        />
        <StatCard
          icon={TrendingUp}
          label="إجمالي الخصومات"
          value={fmtEGP(s.totalDiscountsEGP)}
          hint={fmtUSD(s.totalDiscountsUSD)}
          color="var(--kids-yellow)"
        />
      </div>

      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass border border-gold/20 max-w-md">
          <TabsTrigger value="breakdown" className="data-[state=active]:bg-gold data-[state=active]:text-night text-xs">
            التوزيع
          </TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-gold data-[state=active]:text-night text-xs">
            أحدث المعاملات
          </TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-gold data-[state=active]:text-night text-xs">
            الملخص
          </TabsTrigger>
        </TabsList>

        {/* Breakdown */}
        <TabsContent value="breakdown" className="mt-4 grid lg:grid-cols-3 gap-4">
          {/* By country */}
          <Card className="p-5 glass border-gold/15">
            <h3 className="font-display font-bold mb-3">حسب الدولة</h3>
            <ul className="space-y-2">
              {Object.entries(data.byCountry).map(([code, info]) => (
                <li key={code} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{COUNTRY_FLAGS[code] ?? '🌍'}</span>
                    <span className="font-bold">{code}</span>
                    <span className="text-xs text-muted-foreground">({info.count})</span>
                  </span>
                  <span className="font-bold text-gradient-gold">{(info.egp / 100).toFixed(0)} ج.م</span>
                </li>
              ))}
              {Object.keys(data.byCountry).length === 0 && (
                <li className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</li>
              )}
            </ul>
          </Card>

          {/* By provider */}
          <Card className="p-5 glass border-gold/15">
            <h3 className="font-display font-bold mb-3">حسب مزوّد الدفع</h3>
            <ul className="space-y-2">
              {Object.entries(data.byProvider).map(([provider, info]) => (
                <li key={provider} className="flex items-center justify-between text-sm">
                  <span className="font-bold">{PROVIDER_LABELS[provider] ?? provider}</span>
                  <span className="font-bold text-gradient-gold">{(info.egp / 100).toFixed(0)} ج.م</span>
                </li>
              ))}
              {Object.keys(data.byProvider).length === 0 && (
                <li className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</li>
              )}
            </ul>
          </Card>

          {/* By method */}
          <Card className="p-5 glass border-gold/15">
            <h3 className="font-display font-bold mb-3">حسب طريقة الدفع</h3>
            <ul className="space-y-2">
              {Object.entries(data.byMethod).map(([method, info]) => (
                <li key={method} className="flex items-center justify-between text-sm">
                  <span>{METHOD_LABELS[method] ?? method}</span>
                  <span className="font-bold">{(info.egp / 100).toFixed(0)} ج.م ({info.count})</span>
                </li>
              ))}
              {Object.keys(data.byMethod).length === 0 && (
                <li className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</li>
              )}
            </ul>
          </Card>
        </TabsContent>

        {/* Recent transactions */}
        <TabsContent value="recent" className="mt-4">
          <Card className="glass border-gold/15 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border/50">
                  <tr className="text-right">
                    <th className="px-4 py-3 font-bold text-muted-foreground">الوصف</th>
                    <th className="px-4 py-3 font-bold text-muted-foreground">الدولة</th>
                    <th className="px-4 py-3 font-bold text-muted-foreground">المزوّد</th>
                    <th className="px-4 py-3 font-bold text-muted-foreground">الطريقة</th>
                    <th className="px-4 py-3 font-bold text-muted-foreground">المبلغ</th>
                    <th className="px-4 py-3 font-bold text-muted-foreground">الحالة</th>
                    <th className="px-4 py-3 font-bold text-muted-foreground hidden sm:table-cell">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {data.recentTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gold/5">
                      <td className="px-4 py-3">
                        <p className="font-bold truncate max-w-[200px]">{t.description}</p>
                        {t.couponCode && (
                          <p className="text-xs text-gold">كوبون: {t.couponCode}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">{COUNTRY_FLAGS[t.buyerCountry ?? ''] ?? '🌍'} {t.buyerCountry}</td>
                      <td className="px-4 py-3 text-xs">{PROVIDER_LABELS[t.provider] ?? t.provider}</td>
                      <td className="px-4 py-3 text-xs">{METHOD_LABELS[t.paymentMethod ?? ''] ?? t.paymentMethod}</td>
                      <td className="px-4 py-3">
                        <p className="font-extrabold text-gradient-gold">{(t.amountEGP / 100).toFixed(0)} ج.م</p>
                        <p className="text-xs text-muted-foreground">${(t.amountUSD / 100).toFixed(2)}</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {new Date(t.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Summary card */}
        <TabsContent value="summary" className="mt-4">
          <Card className="p-6 glass border-gold/15">
            <h3 className="font-display font-bold text-lg mb-4">الملخص المالي الشامل</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <Row label="إجمالي الإيرادات (مدفوع)" value={fmtEGP(s.totalRevenueEGP)} valueClass="text-emerald-egypt" />
                <Row label="إجمالي الخصومات (كوبونات)" value={`- ${fmtEGP(s.totalDiscountsEGP)}`} valueClass="text-kids-red" />
                <Row label="إجمالي الاسترجاعات" value={`- ${fmtEGP(s.totalRefundedEGP)}`} valueClass="text-destructive" />
                <div className="border-t border-border/50 pt-3">
                  <Row label="صافي الإيرادات" value={fmtEGP(s.totalRevenueEGP - s.totalDiscountsEGP - s.totalRefundedEGP)} valueClass="text-azure font-extrabold" />
                </div>
              </div>
              <div className="space-y-3">
                <Row label="عمولة المنصة (15% من كل معاملة)" value={fmtEGP(s.totalPlatformFeeEGP)} valueClass="text-gold" />
                <Row label="مسحوب للمعلمين" value={fmtEGP(s.totalPaidOutEGP)} valueClass="text-kids-teal" />
                <Row label="ضمان محتجز" value={fmtEGP(s.heldEscrowEGP)} valueClass="text-gold" />
                <div className="border-t border-border/50 pt-3">
                  <Row label="صافي ربح المنصة" value={fmtEGP(s.netProfitEGP)} valueClass="text-gradient-gold font-extrabold text-lg" />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}
