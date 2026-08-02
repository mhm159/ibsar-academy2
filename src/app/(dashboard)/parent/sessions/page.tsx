'use client'
import { formatTime } from '@/lib/datetime'

import { useEffect, useState } from 'react'
import { CalendarDays, Loader2, CheckCircle2, Video, Star, Clock } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, TrackBadge, StatusBadge, StarRating, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { notify } from '@/lib/notify'

interface SessionData {
  courses: Array<{
    id: string
    title: string
    description: string | null
    track: string
    level: string
    priceEGP: number
    priceUSD: number
    teacherName: string | null
    teacherRating: number
    totalSessions: number
  }>
  availableSessions: Array<{
    id: string
    title: string
    track: string
    startTime: string
    endTime: string
    durationMins: number
    teacherName: string | null
    teacherRating: number
    bookedCount: number
    priceEGP: number
    priceUSD: number
  }>
  myBookings: Array<{
    id: string
    status: string
    priceEGP: number
    priceUSD: number
    session: {
      id: string
      title: string
      track: string
      startTime: string
      endTime: string
      status: string
      meetingUrl: string | null
      teacherName: string | null
    }
    studentName: string
    paymentStatus: string
  }>
  myStudents: Array<{ id: string; name: string }>
}

export default function ParentSessionsPage() {
  return (
    <DashboardShell role="PARENT">
      <SessionsBrowser />
    </DashboardShell>
  )
}

function SessionsBrowser() {
  const [data, setData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingSession, setBookingSession] = useState<string | null>(null)

  const load = () => {
    fetch('/api/dashboard/parent/sessions')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
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

  const now = new Date()
  const upcomingBookings = data.myBookings.filter((b) => new Date(b.session.startTime) > now)
  const pastBookings = data.myBookings.filter((b) => new Date(b.session.startTime) <= now)

  return (
    <>
      <PageHeader
        title="الحصص والحجوزات"
        description="تصفّح الكورسات المتاحة واحجز الحصص لأبنائك"
      />

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass border border-gold/20 max-w-md">
          <TabsTrigger value="available" className="data-[state=active]:bg-gold data-[state=active]:text-night text-xs">
            الحصص المتاحة ({data.availableSessions.length})
          </TabsTrigger>
          <TabsTrigger value="courses" className="data-[state=active]:bg-gold data-[state=active]:text-night text-xs">
            الكورسات ({data.courses.length})
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-gold data-[state=active]:text-night text-xs">
            حجوزاتي ({data.myBookings.length})
          </TabsTrigger>
        </TabsList>

        {/* Available sessions */}
        <TabsContent value="available" className="mt-4 space-y-3">
          {data.availableSessions.length === 0 ? (
            <Card className="glass border-gold/15">
              <EmptyState icon={CalendarDays} title="لا توجد حصص متاحة حالياً" description="تحقق لاحقاً لإيجاد حصص جديدة" />
            </Card>
          ) : (
            data.availableSessions.map((s) => (
              <Card key={s.id} className="p-4 glass border-gold/15 flex items-center gap-4 flex-wrap">
                <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-gold/20 to-azure/20 shrink-0">
                  <span className="text-xs font-bold text-gold">
                    {new Date(s.startTime).toLocaleDateString('ar-EG', { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-extrabold leading-none">{new Date(s.startTime).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <TrackBadge track={s.track} />
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(s.startTime)}
                      {' - '}
                      {formatTime(s.endTime)}
                    </span>
                  </div>
                  <p className="text-sm font-bold truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.teacherName} • <StarRating value={s.teacherRating} /> • {s.bookedCount} مسجّل
                  </p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-lg font-extrabold text-gradient-gold">{s.priceEGP} ج.م</p>
                  <p className="text-xs text-muted-foreground">${s.priceUSD}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setBookingSession(s.id)}
                  className="bg-gradient-to-l from-gold to-[#E8D488] text-night"
                >
                  احجز
                </Button>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Courses */}
        <TabsContent value="courses" className="mt-4 grid sm:grid-cols-2 gap-3">
          {data.courses.map((c) => (
            <Card key={c.id} className="p-4 glass border-gold/15">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <TrackBadge track={c.track} />
                <StatusBadge status={c.level} />
              </div>
              <h3 className="font-display font-bold text-base mb-1">{c.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>{c.teacherName}</span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-gold text-gold" />
                  {c.teacherRating} ({c.totalSessions} حصص)
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div>
                  <span className="text-lg font-extrabold text-gradient-gold">{c.priceEGP} ج.م</span>
                  <span className="text-xs text-muted-foreground ml-1">${c.priceUSD}</span>
                </div>
                <Button size="sm" variant="outline" className="glass border-gold/30 hover:bg-gold/10">
                  عرض التفاصيل
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* My bookings */}
        <TabsContent value="bookings" className="mt-4 space-y-3">
          {data.myBookings.length === 0 ? (
            <Card className="glass border-gold/15">
              <EmptyState icon={CalendarDays} title="لا توجد حجوزات" description="احجز أول حصة من تبويب الحصص المتاحة" />
            </Card>
          ) : (
            <>
              {upcomingBookings.length > 0 && (
                <div>
                  <h3 className="font-display font-bold text-sm mb-2 text-muted-foreground">القادمة ({upcomingBookings.length})</h3>
                  {upcomingBookings.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              )}
              {pastBookings.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-display font-bold text-sm mb-2 text-muted-foreground">السابقة ({pastBookings.length})</h3>
                  {pastBookings.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking dialog */}
      <Dialog open={!!bookingSession} onOpenChange={(o) => !o && setBookingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>احجز هذه الحصة</DialogTitle>
          </DialogHeader>
          <BookingForm
            sessionId={bookingSession!}
            students={data.myStudents}
            onBooked={() => {
              setBookingSession(null)
              load()
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

function BookingCard({ booking }: { booking: SessionData['myBookings'][number] }) {
  return (
    <Card className="p-4 glass border-gold/15 mb-2 flex items-center gap-3 flex-wrap">
      <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-gold/20 to-azure/20 shrink-0">
        <span className="text-xs font-bold text-gold">
          {new Date(booking.session.startTime).toLocaleDateString('ar-EG', { weekday: 'short' })}
        </span>
        <span className="text-base font-extrabold leading-none">{new Date(booking.session.startTime).getDate()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <TrackBadge track={booking.session.track} />
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.paymentStatus} label={booking.paymentStatus === 'PAID' ? 'مدفوع' : 'معلّق'} />
        </div>
        <p className="text-sm font-bold truncate">{booking.session.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {booking.studentName} • {booking.session.teacherName}
        </p>
      </div>
      {(booking.session.status === 'SCHEDULED' || booking.session.status === 'IN_PROGRESS') && (
        <a href={`/classroom/${booking.session.id}`}>
          <Button size="sm" className="gap-1.5 bg-emerald-egypt text-white">
            <Video className="h-4 w-4" />
            دخول الحصة
          </Button>
        </a>
      )}
    </Card>
  )
}

function BookingForm({
  sessionId,
  students,
  onBooked,
}: {
  sessionId: string
  students: Array<{ id: string; name: string }>
  onBooked: () => void
}) {
  const [studentId, setStudentId] = useState('')
  const [booking, setBooking] = useState(false)

  const handleBook = async () => {
    if (!studentId) {
      notify.error('اختر الطفل أولاً')
      return
    }
    setBooking(true)
    try {
      const res = await fetch('/api/dashboard/parent/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, studentId }),
      })
      const data = await res.json()
      if (!res.ok) {
        notify.error(data.error || 'فشل الحجز')
        return
      }
      notify.success('تم حجز الحصة بنجاح! 🎉')
      onBooked()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setBooking(false)
    }
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground mb-4">
          يجب إضافة طفل أولاً قبل الحجز
        </p>
        <Button asChild className="bg-gradient-to-l from-gold to-[#E8D488] text-night">
          <a href="/parent/students">إضافة طفل</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold">اختر الطفل</label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="اختر الطفل..." />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl bg-gold/10 border border-gold/20 p-3 text-xs text-muted-foreground">
        💡 سيتم تأكيد الحجز فوراً (وضع تجريبي). في الإنتاج، سيتم تحويلك لصفحة الدفع (PayMob/Stripe).
      </div>
      <Button
        onClick={handleBook}
        disabled={booking || !studentId}
        className="w-full h-12 gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night"
      >
        {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        تأكيد الحجز
      </Button>
    </div>
  )
}
