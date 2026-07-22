'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  CalendarClock,
  Wallet,
  CheckCircle2,
  ArrowLeft,
  Star,
  TrendingUp,
} from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { StatCard, PageHeader, TrackBadge, StarRating, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface OverviewData {
  stats: {
    studentsCount: number
    upcomingSessions: number
    completedSessions: number
    pendingPayments: number
    totalSpentEGP: number
    totalSpentUSD: number
  }
  students: Array<{ id: string; name: string; birthDate: string | null; gender: string | null; grade: string | null }>
  upcomingSessions: Array<{
    id: string
    sessionId: string
    title: string
    track: string
    startTime: string
    endTime: string
    durationMins: number
    status: string
    teacherName: string | null
    studentName: string
    meetingUrl: string | null
  }>
  recentReports: Array<{
    id: string
    score: number
    engagement: number
    understanding: number
    homework: number
    notes: string | null
    attendance: string
    sessionTitle: string
    track: string
    sessionDate: string
    studentName: string
    teacherName: string | null
  }>
}

export default function ParentOverviewPage() {
  return (
    <DashboardShell role="PARENT">
      <ParentOverviewContent />
    </DashboardShell>
  )
}

function ParentOverviewContent() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/parent/overview')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d)
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

  if (!data) {
    return <p className="text-muted-foreground">تعذّر تحميل البيانات</p>
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <PageHeader
        title="مرحباً بك 👋"
        description="نظرة عامة على نشاط أبنائك في أكاديمية إبصار"
        action={
          <Link href="/parent/sessions">
            <Button className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night">
              احجز حصة جديدة
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard icon={Users} label="عدد الأبناء" value={data.stats.studentsCount} color="var(--azure)" />
        <StatCard icon={CalendarClock} label="حصص قادمة" value={data.stats.upcomingSessions} color="var(--gold)" />
        <StatCard icon={CheckCircle2} label="حصص مكتملة" value={data.stats.completedSessions} color="var(--emerald-egypt)" />
        <StatCard
          icon={Wallet}
          label="إجمالي المدفوع"
          value={`${data.stats.totalSpentEGP} ج.م`}
          hint={`$${data.stats.totalSpentUSD}`}
          color="var(--kids-red)"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming sessions */}
        <Card className="p-5 glass border-gold/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">الحصص القادمة</h3>
            <Link href="/parent/sessions" className="text-xs text-gold font-bold hover:underline">
              عرض الكل
            </Link>
          </div>
          {data.upcomingSessions.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="لا توجد حصص قادمة"
              description="احجز أول حصة لطفلك من صفحة الحصص"
              action={
                <Link href="/parent/sessions">
                  <Button size="sm" className="bg-gradient-to-l from-gold to-[#E8D488] text-night">
                    احجز الآن
                  </Button>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {data.upcomingSessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-gold/20 to-azure/20 shrink-0">
                    <span className="text-xs font-bold text-gold">{fmtDate(s.startTime).split(' ')[0]}</span>
                    <span className="text-lg font-extrabold leading-none">
                      {new Date(s.startTime).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <TrackBadge track={s.track} />
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-sm font-bold truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.studentName} • {s.teacherName} • {fmtTime(s.startTime)} - {fmtTime(s.endTime)}
                    </p>
                  </div>
                  {s.meetingUrl && (
                    <a
                      href={s.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-azure hover:underline shrink-0"
                    >
                      دخول
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent reports */}
        <Card className="p-5 glass border-gold/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">أحدث تقارير التقدّم</h3>
            <Link href="/parent/reports" className="text-xs text-gold font-bold hover:underline">
              عرض الكل
            </Link>
          </div>
          {data.recentReports.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="لا توجد تقارير بعد"
              description="ستظهر تقارير تقدّم أبنائك بعد إكمال الحصص"
            />
          ) : (
            <ul className="space-y-3">
              {data.recentReports.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <TrackBadge track={r.track} />
                      <span className="text-xs text-muted-foreground">{r.studentName}</span>
                    </div>
                    <span className="text-lg font-extrabold text-gradient-gold">{r.score}%</span>
                  </div>
                  <p className="text-sm font-bold mb-1">{r.sessionTitle}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      تفاعل: {r.engagement}/5
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      فهم: {r.understanding}/5
                    </span>
                  </div>
                  {r.notes && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{r.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Children quick view */}
      {data.students.length > 0 && (
        <Card className="p-5 glass border-gold/15 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">أبنائي</h3>
            <Link href="/parent/students" className="text-xs text-gold font-bold hover:underline">
              إدارة الأبناء
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.students.map((s) => (
              <div key={s.id} className="rounded-xl bg-muted/30 p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-base font-bold shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.grade ?? 'بدون صف دراسي'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
