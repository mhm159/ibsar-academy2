'use client'
import { formatTime } from '@/lib/datetime'

import Link from 'next/link'
import {
  Users,
  CalendarClock,
  Wallet,
  CheckCircle2,
  ArrowLeft,
  Star,
  TrendingUp,
  Sparkles,
  Gift,
} from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { StatCard, PageHeader, TrackBadge, StarRating, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMode } from '@/components/use-mode'
import { Mascot, triggerConfetti } from '@/components/site/kids-effects'
import { SeasonalBanner } from '@/components/site/seasonal-banner'
import { BookTrialModal } from '@/components/dashboard/book-trial-modal'
import { useSyncedData } from '@/hooks/use-synced-data'

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
    isTrial?: boolean
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
  const { isKids } = useMode()
  const { data, loading } = useSyncedData<OverviewData>({
    key: 'ibsar:parent-overview',
    fetcher: async () => {
      const r = await fetch('/api/dashboard/parent/overview')
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      return d as OverviewData
    },
  })

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

  // Render kids version if kids mode
  if (isKids) {
    return <KidsOverview data={data} />
  }

  // Professional version (original)
  return <ProOverview data={data} />
}

/* ============================================================
   PRO MODE — elegant professional layout
   ============================================================ */
function ProOverview({ data }: { data: OverviewData }) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })
  const fmtTime = (iso: string) =>
    formatTime(iso)

  return (
    <>
      <SeasonalBanner />
      <PageHeader
        title="مرحباً بك 👋"
        description="نظرة عامة على نشاط أبنائك في منصة منهل"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <BookTrialModal students={data.students} />
            <Link href="/parent/sessions">
              <Button className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night">
                احجز حصة جديدة
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

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

      {data.upcomingSessions.filter((s) => s.isTrial).length > 0 && (
        <Card className="p-4 glass border-gold/25 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-display font-bold text-gradient-gold flex items-center gap-2">
                <Gift className="h-5 w-5 text-gold" /> حصتك التجريبية المجانية
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                تم حجزها تلقائياً مع المعلم. تابع حالة الحجز هنا، وسيتواصل معك فريقنا للتأكيد.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              {data.upcomingSessions
                .filter((s) => s.isTrial)
                .map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{s.studentName}</span>
                    <span className="text-xs text-muted-foreground">
                      • {new Date(s.startTime).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
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
                <li key={s.id} className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-gold/20 to-azure/20 shrink-0">
                    <span className="text-xs font-bold text-gold">{fmtDate(s.startTime).split(' ')[0]}</span>
                    <span className="text-lg font-extrabold leading-none">
                      {new Date(s.startTime).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <TrackBadge track={s.track} />
                      {s.isTrial && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-l from-gold/20 to-amber-400/20 text-amber-500 border border-gold/30">
                          🎁 تجريبية
                        </span>
                      )}
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-sm font-bold truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.studentName} • {s.teacherName} • {fmtTime(s.startTime)} - {fmtTime(s.endTime)}
                    </p>
                  </div>
                  {s.meetingUrl && (
                    <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-azure hover:underline shrink-0">
                      دخول
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 glass border-gold/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">أحدث تقارير التقدّم</h3>
            <Link href="/parent/reports" className="text-xs text-gold font-bold hover:underline">
              عرض الكل
            </Link>
          </div>
          {data.recentReports.length === 0 ? (
            <EmptyState icon={TrendingUp} title="لا توجد تقارير بعد" description="ستظهر تقارير تقدّم أبنائك بعد إكمال الحصص" />
          ) : (
            <ul className="space-y-3">
              {data.recentReports.map((r) => (
                <li key={r.id} className="rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
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
                  {r.notes && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{r.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

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

/* ============================================================
   KIDS MODE — vibrant playful layout for children
   ============================================================ */
function KidsOverview({ data }: { data: OverviewData }) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })
  const fmtTime = (iso: string) =>
    formatTime(iso)

  const handleCelebrate = () => {
    triggerConfetti(60, 4000)
  }

  return (
    <div className="space-y-6">
      <SeasonalBanner />
      {/* Hero banner with mascot */}
      <div className="relative rounded-3xl overflow-hidden kids-bg-sky p-6 lg:p-8">
        {/* Floating decorations */}
        <div className="absolute top-4 left-4 text-4xl kids-float-1 opacity-70">☁️</div>
        <div className="absolute top-8 right-12 text-3xl kids-float-2 opacity-70">⭐</div>
        <div className="absolute bottom-4 left-8 text-3xl kids-float-3 opacity-70">🌈</div>

        <div className="relative flex items-center gap-4 flex-wrap">
          <Mascot mood="waving" size={90} className="shrink-0 kids-bounce" />
          <div className="flex-1 min-w-0">
            <h1 className="kids-title text-3xl lg:text-4xl font-extrabold mb-1">
              أهلاً يا أبطال! 🎉
            </h1>
            <p className="text-[#2D1B4E]/80 text-sm lg:text-base font-bold">
              يلا نتعلم ونلعب ونستمتع! عندك {data.stats.upcomingSessions} حصص قادمة
            </p>
          </div>
          <button
            onClick={handleCelebrate}
            className="kids-btn kids-btn-accent kids-wiggle"
          >
            🎉 احتفل!
          </button>
          <BookTrialModal students={data.students} />
        </div>
      </div>

      {/* Stats — colorful cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KidsStatCard
          emoji="👶"
          value={data.stats.studentsCount}
          label="أبنائك"
          bgClass="bg-gradient-to-br from-[#FFB6C1] to-[#FFC0CB]"
        />
        <KidsStatCard
          emoji="📅"
          value={data.stats.upcomingSessions}
          label="حصص قادمة"
          bgClass="bg-gradient-to-br from-[#FFE66D] to-[#FFC93C]"
        />
        <KidsStatCard
          emoji="🏆"
          value={data.stats.completedSessions}
          label="حصص مكتملة"
          bgClass="bg-gradient-to-br from-[#4ECDC4] to-[#44A8B3]"
          onClick={() => triggerConfetti(40)}
        />
        <KidsStatCard
          emoji="💰"
          value={data.stats.totalSpentEGP}
          label="ج.م مدفوع"
          bgClass="bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE]"
        />
      </div>

      {/* Upcoming sessions — playful cards */}
      <div>
        <h2 className="kids-title text-2xl font-extrabold mb-3 flex items-center gap-2">
          <span className="kids-bounce">📚</span>
          حصصك القادمة
        </h2>
        {data.upcomingSessions.length === 0 ? (
          <div className="kids-card p-8 text-center">
            <div className="text-6xl mb-3 kids-bounce">🎯</div>
            <p className="text-lg font-bold text-[#2D1B4E] mb-2">مفيش حصص قادمة دلوقتي</p>
            <p className="text-sm text-[#8B6F47] mb-4">احجز أول حصة وابدأ المغامرة!</p>
            <Link href="/parent/sessions">
              <button className="kids-btn kids-btn-primary">
                🚀 احجز حصة
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {data.upcomingSessions.map((s, i) => {
              const trackEmoji = s.track === 'PROGRAMMING' ? '💻' : s.track === 'ROBOTICS' ? '🤖' : '🧮'
              const trackColor = s.track === 'PROGRAMMING' ? 'from-[#4ECDC4] to-[#44A8B3]'
                : s.track === 'ROBOTICS' ? 'from-[#FF6B6B] to-[#FF8E53]'
                : 'from-[#FFE66D] to-[#FFC93C]'
              return (
                <div
                  key={s.id}
                  className={`kids-card p-4 bg-gradient-to-br ${trackColor} text-white kids-pop-in`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-4xl kids-bounce">{trackEmoji}</div>
                    <div className="flex-1">
                      <p className="font-extrabold text-lg leading-tight">{s.title}</p>
                      <p className="text-xs opacity-90">
                        {s.studentName} • {s.teacherName}
                        {s.isTrial && <span className="mx-1 rounded-full bg-white/25 px-2 py-0.5">🎁 تجريبية</span>}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/20 rounded-xl p-2 text-sm font-bold">
                    📅 {fmtDate(s.startTime)}
                  </div>
                  <div className="bg-white/20 rounded-xl p-2 text-sm font-bold mt-1">
                    🕐 {fmtTime(s.startTime)} - {fmtTime(s.endTime)}
                  </div>
                  {s.meetingUrl && (
                    <a
                      href={s.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="kids-btn kids-btn-accent w-full mt-3 text-center block text-sm"
                    >
                      🎥 ادخل الحصة
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent achievements — star cards */}
      {data.recentReports.length > 0 && (
        <div>
          <h2 className="kids-title text-2xl font-extrabold mb-3 flex items-center gap-2">
            <span className="kids-bounce">🏆</span>
            أحدث إنجازاتك
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recentReports.map((r, i) => {
              const isHighScore = r.score >= 80
              return (
                <div
                  key={r.id}
                  className={`kids-card p-4 ${isHighScore ? 'bg-gradient-to-br from-[#FFE66D] to-[#FFC93C]' : 'bg-white'} kids-pop-in`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {isHighScore && <div className="kids-ribbon">⭐ ممتاز!</div>}
                  <div className="text-center">
                    <div className="text-5xl mb-2 kids-bounce">
                      {r.score >= 90 ? '🌟' : r.score >= 80 ? '⭐' : r.score >= 60 ? '👍' : '💪'}
                    </div>
                    <p className="text-3xl font-extrabold text-[#2D1B4E]">{r.score}%</p>
                    <p className="text-sm font-bold text-[#2D1B4E]/70 mt-1">{r.sessionTitle}</p>
                    <p className="text-xs text-[#8B6F47] mt-1">{r.studentName}</p>
                    <div className="flex justify-center gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx} className="text-lg">
                          {idx < Math.round(r.engagement) ? '⭐' : '☆'}
                        </span>
                      ))}
                    </div>
                    {r.notes && (
                      <p className="text-xs text-[#8B6F47] mt-2 bg-white/50 rounded-lg p-2 line-clamp-2">
                        💬 {r.notes}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Children cards */}
      {data.students.length > 0 && (
        <div>
          <h2 className="kids-title text-2xl font-extrabold mb-3 flex items-center gap-2">
            <span className="kids-bounce">👨‍👩‍👧‍👦</span>
            أبنائك
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.students.map((s, i) => {
              const emoji = s.gender === 'FEMALE' ? '👧' : '👦'
              return (
                <div
                  key={s.id}
                  className="kids-card p-4 bg-gradient-to-br from-[#A29BFE] to-[#6C5CE7] text-white kids-pop-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-5xl kids-bounce">{emoji}</div>
                    <div>
                      <p className="font-extrabold text-lg">{s.name}</p>
                      <p className="text-xs opacity-90">{s.grade ?? 'طالب'}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function KidsStatCard({
  emoji,
  value,
  label,
  bgClass,
  onClick,
}: {
  emoji: string
  value: number | string
  label: string
  bgClass: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`kids-stat ${bgClass} text-white ${onClick ? 'cursor-pointer kids-wiggle' : ''}`}
    >
      <div className="text-4xl mb-1 kids-bounce">{emoji}</div>
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="text-xs font-bold opacity-90">{label}</div>
    </div>
  )
}

/* TODO: Add more kids-mode pages (sessions, reports) with playful variants. */
