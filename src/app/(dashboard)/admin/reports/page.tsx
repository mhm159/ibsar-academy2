'use client'

import { useEffect, useState } from 'react'
import {
  BarChart as BarChartIcon,
  TrendingUp,
  Users,
  MessageSquare,
  GraduationCap,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, EmptyState, TrackBadge } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface Reports {
  sessionsByStatus: Record<string, number>
  sessionsByTrack: Record<string, number>
  sessionsByMonth: { month: string; count: number }[]
  teacherPerformance: { id: string; name: string; totalSessions: number; completedSessions: number; avgRating: number | null; avgFocus: number | null }[]
  chatVolumeByDay: { day: string; count: number }[]
  focusAlertsByDay: { day: string; count: number }[]
  topStudents: { name: string; sessions: number; avgFocus: number | null; track: string }[]
  revenueSummary: { totalEGP: number; totalUSD: number; paidCount: number; byProvider: Record<string, number> }
}

const STATUS_AR: Record<string, string> = {
  SCHEDULED: 'مجدولة',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
  IN_PROGRESS: 'جارِية',
}

export default function AdminReportsPage() {
  return (
    <DashboardShell role="ADMIN">
      <ReportsContent />
    </DashboardShell>
  )
}

function ReportsContent() {
  const [data, setData] = useState<Reports | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetch('/api/dashboard/admin/reports')
      .then((r) => r.json())
      .then((d) => {
        if (d.sessionsByStatus) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) return <EmptyState icon={BarChartIcon} title="تعذّر تحميل التقارير" />

  const totalSessions = Object.values(data.sessionsByStatus).reduce((a, b) => a + b, 0)
  const totalChat = data.chatVolumeByDay.reduce((a, b) => a + b.count, 0)
  const totalAlerts = data.focusAlertsByDay.reduce((a, b) => a + b.count, 0)
  const statusData = Object.entries(data.sessionsByStatus).map(([status, count]) => ({
    name: STATUS_AR[status] ?? status,
    count,
  }))

  return (
    <>
      <PageHeader
        title="التقارير الإدارية"
        description="نظرة تحليلية على أداء الحصص والمعلمين والطلاب والمالية"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={BarChartIcon} label="إجمالي الحصص" value={totalSessions} color="var(--azure)" />
        <StatCard icon={MessageSquare} label="رسائل الشات (١٤ يوم)" value={totalChat} color="var(--kids-teal)" />
        <StatCard icon={AlertTriangle} label="تنبيهات التشتت (١٤ يوم)" value={totalAlerts} color="var(--kids-red)" />
        <StatCard icon={TrendingUp} label="الإيرادات المدفوعة" value={`${data.revenueSummary.totalEGP} ج.م`} hint={`$${data.revenueSummary.totalUSD}`} color="var(--emerald-egypt)" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="teachers">المعلمون</TabsTrigger>
          <TabsTrigger value="chat">الشات والتركيز</TabsTrigger>
          <TabsTrigger value="students">الطلاب</TabsTrigger>
          <TabsTrigger value="finance">المالية</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 grid lg:grid-cols-2 gap-4">
          <Card className="p-5 glass border-gold/15">
            <h3 className="font-display font-bold mb-4">الحصص حسب الحالة</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'currentColor' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'currentColor' }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--gold)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 glass border-gold/15">
            <h3 className="font-display font-bold mb-4">الحصص شهرياً (٦ أشهر)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.sessionsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'currentColor' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'currentColor' }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--azure)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 glass border-gold/15 lg:col-span-2">
            <h3 className="font-display font-bold mb-4">الحصص حسب المسار</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.sessionsByTrack).map(([track, count]) => (
                <div key={track} className="rounded-xl bg-muted/40 px-4 py-2 flex items-center gap-2">
                  <TrackBadge track={track} />
                  <span className="font-extrabold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Teachers */}
        <TabsContent value="teachers" className="mt-4 space-y-4">
          <Card className="p-5 glass border-gold/15">
            <h3 className="font-display font-bold mb-4">أداء المعلمين</h3>
            {data.teacherPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">لا توجد بيانات</p>
            ) : (
              <div className="overflow-x-auto" dir="rtl">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border/50">
                    <tr className="text-right">
                      <th className="px-4 py-3 font-bold text-muted-foreground">المعلم</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground">إجمالي الحصص</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground">المكتملة</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground">متوسط التقييم</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground">متوسط التركيز</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {data.teacherPerformance.map((t) => (
                      <tr key={t.id} className="hover:bg-gold/5">
                        <td className="px-4 py-3 font-bold">{t.name}</td>
                        <td className="px-4 py-3">{t.totalSessions}</td>
                        <td className="px-4 py-3 text-emerald-egypt font-bold">{t.completedSessions}</td>
                        <td className="px-4 py-3">{t.avgRating != null ? `${t.avgRating} / 5` : '—'}</td>
                        <td className="px-4 py-3">{t.avgFocus != null ? `${t.avgFocus}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Chat + focus */}
        <TabsContent value="chat" className="mt-4 grid lg:grid-cols-2 gap-4">
          <Card className="p-5 glass border-gold/15">
            <h3 className="font-display font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gold" />
              رسائل الشات يومياً (١٤ يوم)
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.chatVolumeByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'currentColor' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'currentColor' }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="var(--kids-teal)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 glass border-gold/15">
            <h3 className="font-display font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-kids-red" />
              تنبيهات التشتت يومياً (١٤ يوم)
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.focusAlertsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'currentColor' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'currentColor' }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="var(--kids-red)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Students */}
        <TabsContent value="students" className="mt-4">
          <Card className="p-5 glass border-gold/15">
            <h3 className="font-display font-bold mb-4 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-azure" />
              أكثر الطلاب تفاعلاً
            </h3>
            {data.topStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">لا توجد بيانات</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.topStudents.map((s) => (
                  <div key={s.name} className="rounded-xl bg-muted/40 p-4 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold truncate">{s.name}</p>
                      <TrackBadge track={s.track} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-lg bg-card/60 p-2">
                        <p className="text-lg font-extrabold text-azure">{s.sessions}</p>
                        <p className="text-[0.65rem] text-muted-foreground">حصة</p>
                      </div>
                      <div className="rounded-lg bg-card/60 p-2">
                        <p className="text-lg font-extrabold text-emerald-egypt">{s.avgFocus != null ? `${s.avgFocus}%` : '—'}</p>
                        <p className="text-[0.65rem] text-muted-foreground">تركيز</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Finance */}
        <TabsContent value="finance" className="mt-4 grid lg:grid-cols-2 gap-4">
          <Card className="p-5 glass border-gold/15">
            <h3 className="font-display font-bold mb-4">ملخص الإيرادات</h3>
            <div className="space-y-3">
              <div className="rounded-xl bg-muted/40 p-4 flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground">إجمالي المدفوع (EGP)</span>
                <span className="font-extrabold text-lg">{data.revenueSummary.totalEGP.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="rounded-xl bg-muted/40 p-4 flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground">إجمالي المدفوع (USD)</span>
                <span className="font-extrabold text-lg">${data.revenueSummary.totalUSD.toLocaleString('en-US')}</span>
              </div>
              <div className="rounded-xl bg-muted/40 p-4 flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground">عدد المعاملات المدفوعة</span>
                <span className="font-extrabold text-lg">{data.revenueSummary.paidCount}</span>
              </div>
            </div>
          </Card>
          <Card className="p-5 glass border-gold/15">
            <h3 className="font-display font-bold mb-4">الإيرادات حسب مزود الدفع</h3>
            {Object.keys(data.revenueSummary.byProvider).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">لا توجد بيانات</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(data.revenueSummary.byProvider).map(([provider, amount]) => (
                  <div key={provider} className="rounded-xl bg-muted/40 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-bold">{provider}</span>
                    <span className="font-bold">{amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
