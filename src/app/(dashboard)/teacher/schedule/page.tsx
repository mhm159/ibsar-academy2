'use client'
import { formatTime } from '@/lib/datetime'

import { useEffect, useState } from 'react'
import { CalendarDays, Video, Clock, Users, CheckCircle2, Loader2 } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, TrackBadge, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { notify } from '@/lib/notify'

interface Session {
  id: string
  title: string
  track: string
  startTime: string
  endTime: string
  durationMins: number
  status: string
  isTrial?: boolean
  meetingUrl: string | null
  recordingUrl?: string | null
  students: Array<{ id: string; name: string }>
}

interface ScheduleData {
  upcoming: Session[]
  past: Session[]
}

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export default function TeacherSchedulePage() {
  return (
    <DashboardShell role="TEACHER">
      <ScheduleView />
    </DashboardShell>
  )
}

function ScheduleView() {
  const [data, setData] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/teacher/schedule')
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
          <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) return <p className="text-muted-foreground">تعذّر التحميل</p>

  // Group upcoming by day
  const byDay = new Map<string, Session[]>()
  data.upcoming.forEach((s) => {
    const dayKey = new Date(s.startTime).toDateString()
    if (!byDay.has(dayKey)) byDay.set(dayKey, [])
    byDay.get(dayKey)!.push(s)
  })

  return (
    <>
      <PageHeader
        title="جدول الحصص"
        description="استعراض ومتابعة جدول حصصك القادمة والسابقة"
      />

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass border border-gold/20 max-w-xs">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-gold data-[state=active]:text-night">
            القادمة ({data.upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:bg-gold data-[state=active]:text-night">
            السابقة ({data.past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {data.upcoming.length === 0 ? (
            <Card className="glass border-gold/15">
              <EmptyState
                icon={CalendarDays}
                title="لا توجد حصص قادمة"
                description="حدّد مواعيد التوفر في ملفك ليتمكن الطلاب من الحجز"
              />
            </Card>
          ) : (
            Array.from(byDay.entries()).map(([dayKey, sessions]) => {
              const date = new Date(dayKey)
              return (
                <div key={dayKey}>
                  <h3 className="font-display font-bold text-sm mb-2 text-muted-foreground sticky top-16 bg-background/80 backdrop-blur-sm py-1 z-10">
                    {DAYS_AR[date.getDay()]}، {date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                  </h3>
                  <div className="space-y-2">
                    {sessions.map((s) => (
                      <SessionRow key={s.id} session={s} />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-2">
          {data.past.length === 0 ? (
            <Card className="glass border-gold/15">
              <EmptyState
                icon={CalendarDays}
                title="لا توجد حصص سابقة"
                description="ستظهر الحصص المكتملة هنا"
              />
            </Card>
          ) : (
            data.past.map((s) => <SessionRow key={s.id} session={s} />)
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}

function SessionRow({ session }: { session: Session }) {
  const fmtTime = (iso: string) => formatTime(iso)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(session.status === 'COMPLETED')

  const isLive = session.status === 'IN_PROGRESS' || (session.meetingUrl && new Date() >= new Date(session.startTime))

  const handleComplete = async () => {
    if (!(await notify.confirm('تأكيد إكمال الحصة؟ سيتم تحرير المدفوعات للمعلم وخصم عمولة الأكاديمية.'))) return
    setCompleting(true)
    try {
      const res = await fetch('/api/dashboard/teacher/complete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      })
      const d = await res.json()
      if (!res.ok) {
        notify.error(d.error || 'فشل')
        return
      }
      notify.success(d.message)
      setCompleted(true)
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setCompleting(false)
    }
  }

  return (
    <Card className="p-4 glass border-gold/15">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-gold/20 to-azure/20 shrink-0">
          <Clock className="h-4 w-4 text-gold mb-0.5" />
          <span className="text-xs font-bold" dir="ltr">{fmtTime(session.startTime)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <TrackBadge track={session.track} />
            <StatusBadge status={completed ? 'COMPLETED' : session.status} />
            {session.isTrial && (
              <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                حصة تجريبية
              </span>
            )}
          </div>
          <p className="text-sm font-bold">{session.title}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {session.students.length} طالب
            </span>
            <span dir="ltr">{session.durationMins} دقيقة</span>
          </div>
          {session.students.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {session.students.map((s) => s.name).join('، ')}
            </p>
          )}
          {/* Financial status */}
          {session.students.length > 0 && (
            <div className="mt-1 text-xs">
              <span className="text-muted-foreground">💰 الحالة المالية: </span>
              <span className={completed ? 'text-emerald-egypt font-bold' : 'text-gold font-bold'}>
                {completed ? 'تم التحرير للمعلم' : 'بانتظار إكمال الحصة'}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          {/* Enter classroom */}
          {!completed && (session.status === 'SCHEDULED' || session.status === 'IN_PROGRESS') && (
            <a href={`/classroom/${session.id}`}>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                isLive ? 'bg-emerald-egypt text-white animate-pulse' : 'bg-gradient-to-l from-gold to-[#E8D488] text-night'
              }`}>
                <Video className="h-3.5 w-3.5" />
                {isLive ? 'دخول (مباشر)' : 'دخول الغرفة'}
              </span>
            </a>
          )}

          {/* Complete session button */}
          {!completed && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-egypt text-white hover:bg-emerald-egypt/90 disabled:opacity-50"
            >
              {completing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              إكمال الحصة
            </button>
          )}

          {/* Recording link */}
          {session.recordingUrl && (
            <a href={session.recordingUrl} target="_blank" rel="noopener noreferrer">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-azure text-white text-xs font-bold">
                <Video className="h-3.5 w-3.5" />
                التسجيل
              </span>
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}
