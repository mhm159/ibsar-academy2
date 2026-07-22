'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Clock, Award, Loader2 } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'

interface Alert {
  id: string
  studentId: string
  studentName: string
  parentId: string
  type: string
  severity: string
  description: string
  recommendation: string
  analysisJson: string | null
  status: string
  acknowledgedAt: string | null
  createdAt: string
}

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  LOW_ENGAGEMENT: { label: 'تفاعل منخفض', icon: TrendingDown, color: 'var(--gold)' },
  STRUGGLING: { label: 'يعاني في الفهم', icon: AlertTriangle, color: 'var(--kids-red)' },
  ABSENT: { label: 'غياب متكرر', icon: Clock, color: 'var(--kids-red)' },
  BEHIND: { label: 'متأخر عن المستوى', icon: Clock, color: 'var(--azure)' },
  EXCELLENT_PROGRESS: { label: 'تقدّم ممتاز', icon: Award, color: 'var(--emerald-egypt)' },
}

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'منخفض',
  MEDIUM: 'متوسط',
  HIGH: 'عالي',
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })

export default function AdminAlertsPage() {
  return (
    <DashboardShell role="ADMIN">
      <AlertsAdmin />
    </DashboardShell>
  )
}

function AlertsAdmin() {
  const [data, setData] = useState<{ alerts: Alert[]; summary: any } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/admin/alerts')
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="تنبيهات السلوك (AI)"
        description="تنبيهات الذكاء الاصطناعي عن أداء الطلاب عبر المنصة"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={AlertTriangle} label="إجمالي التنبيهات" value={data.summary.total} color="var(--azure)" />
        <StatCard icon={Clock} label="جديدة" value={data.summary.newCount} color="var(--gold)" />
        <StatCard icon={AlertTriangle} label="خطورة عالية" value={data.summary.highSeverity} color="var(--kids-red)" />
        <StatCard icon={TrendingUp} label="متفوقون" value={data.summary.byType.EXCELLENT_PROGRESS ?? 0} color="var(--emerald-egypt)" />
      </div>

      {/* By type breakdown */}
      <Card className="p-5 glass border-gold/15 mb-6">
        <h3 className="font-display font-bold mb-3">التوزيع حسب النوع</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(data.summary.byType).map(([type, count]) => {
            const meta = TYPE_META[type] ?? { label: type, icon: AlertTriangle, color: 'var(--muted-foreground)' }
            return (
              <div key={type} className="text-center rounded-xl bg-muted/30 p-3">
                <meta.icon className="h-6 w-6 mx-auto mb-1" style={{ color: meta.color }} />
                <p className="text-2xl font-extrabold">{count as number}</p>
                <p className="text-xs text-muted-foreground">{meta.label}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {data.alerts.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState
            icon={AlertTriangle}
            title="لا توجد تنبيهات"
            description="ستظهر تنبيهات AI عن أداء الطلاب هنا عند اكتشافها"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {data.alerts.map((alert) => {
            const meta = TYPE_META[alert.type] ?? { label: alert.type, icon: AlertTriangle, color: 'var(--muted-foreground)' }
            let analysis: any = null
            try {
              analysis = alert.analysisJson ? JSON.parse(alert.analysisJson) : null
            } catch {}

            return (
              <Card
                key={alert.id}
                className={`p-5 glass border-gold/15 ${
                  alert.severity === 'HIGH' && alert.status === 'NEW'
                    ? 'border-kids-red/40 bg-kids-red/5'
                    : alert.type === 'EXCELLENT_PROGRESS'
                      ? 'border-emerald-egypt/30 bg-emerald-egypt/5'
                      : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in srgb, ${meta.color} 15%, transparent)`, color: meta.color }}
                  >
                    <meta.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display font-bold">{alert.studentName}</h3>
                      <StatusBadge status={alert.severity} label={SEVERITY_LABELS[alert.severity] ?? alert.severity} />
                      <span
                        className="text-[0.65rem] px-2 py-0.5 rounded-full font-bold"
                        style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 12%, transparent)` }}
                      >
                        {meta.label}
                      </span>
                      {alert.status === 'NEW' && (
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-gold/15 text-gold font-bold">
                          جديدة
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/90 mb-2">{alert.description}</p>
                    <div className="rounded-lg bg-emerald-egypt/10 border border-emerald-egypt/20 p-2 text-xs text-emerald-egypt mb-2">
                      💡 {alert.recommendation}
                    </div>
                    {analysis && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {analysis.avgScore !== undefined && (
                          <div className="rounded bg-muted/30 p-1.5 text-center">
                            <p className="text-muted-foreground">متوسط الدرجة</p>
                            <p className="font-bold">{analysis.avgScore}%</p>
                          </div>
                        )}
                        {analysis.avgEngagement !== undefined && (
                          <div className="rounded bg-muted/30 p-1.5 text-center">
                            <p className="text-muted-foreground">التفاعل</p>
                            <p className="font-bold">{analysis.avgEngagement}/5</p>
                          </div>
                        )}
                        {analysis.attendanceRate !== undefined && (
                          <div className="rounded bg-muted/30 p-1.5 text-center">
                            <p className="text-muted-foreground">الحضور</p>
                            <p className="font-bold">{analysis.attendanceRate}%</p>
                          </div>
                        )}
                        {analysis.trend && (
                          <div className="rounded bg-muted/30 p-1.5 text-center">
                            <p className="text-muted-foreground">الاتجاه</p>
                            <p className="font-bold">
                              {analysis.trend === 'IMPROVING' ? '↑ تصاعدي' : analysis.trend === 'DECLINING' ? '↓ تنازلي' : '→ ثابت'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{fmtDate(alert.createdAt)}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
