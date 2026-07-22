'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, CalendarClock, Wallet, Star, Clock, CheckCircle2, ArrowLeft } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { StatCard, PageHeader, TrackBadge, StarRating, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TeacherOverview {
  teacher: {
    id: string
    name: string | null
    bio: string | null
    tracks: string[]
    status: string
    rating: number
    reviewsCount: number
    experienceYears: number
    hourlyRateEGP: number
    hourlyRateUSD: number
    isFeatured: boolean
  }
  stats: {
    totalStudents: number
    sessionsThisWeek: number
    completedSessions: number
    upcomingSessions: number
    totalEarningsEGP: number
    totalEarningsUSD: number
    pendingEarningsEGP: number
  }
  upcomingSessions: Array<{
    id: string
    title: string
    track: string
    startTime: string
    endTime: string
    durationMins: number
    status: string
    meetingUrl: string | null
    students: string[]
    bookedCount: number
  }>
  availability: Array<{ id: string; dayOfWeek: number; startHour: number; endHour: number }>
}

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export default function TeacherOverviewPage() {
  return (
    <DashboardShell role="TEACHER">
      <TeacherOverviewContent />
    </DashboardShell>
  )
}

function TeacherOverviewContent() {
  const [data, setData] = useState<TeacherOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/teacher/overview')
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

  if (!data) return <p className="text-muted-foreground">تعذّر التحميل</p>

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <>
      {/* Pending banner */}
      {data.teacher.status === 'PENDING' && (
        <Card className="p-4 mb-6 glass border-gold/30 bg-gold/5">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-gold shrink-0" />
            <p className="text-sm">
              <span className="font-bold">حسابك قيد المراجعة.</span>{' '}
              ستتم الموافقة عليه من الإدارة خلال 24 ساعة. تحقق من إشعاراتك.
            </p>
          </div>
        </Card>
      )}

      <PageHeader
        title={`أهلاً ${data.teacher.name} 👋`}
        description={data.teacher.bio ?? 'لوحة تحكم المعلم'}
        action={
          <Link href="/teacher/profile">
            <Button variant="outline" className="gap-1.5 glass border-gold/30 hover:bg-gold/10">
              تعديل الملف
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      {/* Teacher highlight card */}
      <Card className="p-5 glass border-gold/15 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-2xl shrink-0">
              👩‍🏫
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">{data.teacher.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <StarRating value={data.teacher.rating} size="md" />
                <span className="text-sm font-bold">{data.teacher.rating}</span>
                <span className="text-xs text-muted-foreground">({data.teacher.reviewsCount} تقييم)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mr-auto">
            {data.teacher.tracks.map((t) => (
              <TrackBadge key={t} track={t} />
            ))}
            {data.teacher.isFeatured && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold text-night">
                ⭐ مميّز
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard icon={Users} label="إجمالي الطلاب" value={data.stats.totalStudents} color="var(--azure)" />
        <StatCard icon={CalendarClock} label="حصص هذا الأسبوع" value={data.stats.sessionsThisWeek} color="var(--gold)" />
        <StatCard icon={CheckCircle2} label="حصص مكتملة" value={data.stats.completedSessions} color="var(--emerald-egypt)" />
        <StatCard
          icon={Wallet}
          label="إجمالي الأرباح"
          value={`${data.stats.totalEarningsEGP} ج.م`}
          hint={`$${data.stats.totalEarningsUSD}`}
          color="var(--kids-red)"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming sessions */}
        <Card className="p-5 glass border-gold/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">الحصص القادمة</h3>
            <Link href="/teacher/schedule" className="text-xs text-gold font-bold hover:underline">
              عرض الجدول الكامل
            </Link>
          </div>
          {data.upcomingSessions.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="لا توجد حصص قادمة"
              description="سيظهر جدولك هنا عند حجز الطلاب"
            />
          ) : (
            <ul className="space-y-3">
              {data.upcomingSessions.map((s) => (
                <li key={s.id} className="rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-gold/20 to-azure/20 shrink-0">
                      <span className="text-xs font-bold text-gold">{fmtDate(s.startTime).split(' ')[0]}</span>
                      <span className="text-lg font-extrabold leading-none">{new Date(s.startTime).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <TrackBadge track={s.track} />
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="text-sm font-bold truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fmtTime(s.startTime)} - {fmtTime(s.endTime)} • {s.bookedCount} طالب
                      </p>
                      {s.students.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {s.students.join('، ')}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Availability */}
        <Card className="p-5 glass border-gold/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">مواعيد التوفر</h3>
            <Link href="/teacher/profile" className="text-xs text-gold font-bold hover:underline">
              تعديل
            </Link>
          </div>
          {data.availability.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="لم تحدد مواعيد التوفر"
              description="حدّد مواعيد توافرك ليتمكن الطلاب من حجز حصصك"
              action={
                <Link href="/teacher/profile">
                  <Button size="sm" className="bg-gradient-to-l from-gold to-[#E8D488] text-night">
                    تحديد المواعيد
                  </Button>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {data.availability.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                >
                  <span className="text-sm font-bold">{DAYS_AR[a.dayOfWeek]}</span>
                  <span className="text-sm text-muted-foreground" dir="ltr">
                    {a.startHour}:00 - {a.endHour}:00
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
