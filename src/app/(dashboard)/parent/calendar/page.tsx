'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, ChevronLeft, Loader2, Video } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, TrackBadge, StatusBadge } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMode } from '@/components/use-mode'

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]
const DAYS_AR = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']

const TRACK_COLORS: Record<string, string> = {
  PROGRAMMING: '#4ECDC4',
  ROBOTICS: '#FF6B6B',
  MENTAL_MATH: '#FFE66D',
}

interface DaySession {
  id: string
  title: string
  track: string
  status: string
  bookingStatus: string
  startTime: string
  endTime: string
  teacherName: string | null
  studentName: string
}

export default function ParentCalendarPage() {
  return (
    <DashboardShell role="PARENT">
      <CalendarView />
    </DashboardShell>
  )
}

function CalendarView() {
  const { isKids } = useMode()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [days, setDays] = useState<Record<string, DaySession[]>>({})
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  useEffect(() => {
    fetch('/api/dashboard/parent/students')
      .then((r) => r.json())
      .then((d) => {
        if (d.students) setStudents(d.students)
      })
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const url = `/api/dashboard/parent/calendar?month=${monthStr}${selectedStudent ? `&student=${selectedStudent}` : ''}`
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.days) setDays(d.days)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [monthStr, selectedStudent])

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month, 1))
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month

  return (
    <>
      <PageHeader
        title={isKids ? '📅 تقويمي' : 'تقويم الحصص'}
        description="استعرض حصص أبنائك في كل شهر"
      />

      {/* Student filter */}
      {students.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">الطالب:</span>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="الكل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">الكل</SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={prevMonth} className="gap-1">
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>
        <h2 className="font-display text-xl font-bold">
          {MONTHS_AR[month - 1]} {year}
        </h2>
        <Button variant="ghost" size="sm" onClick={nextMonth} className="gap-1">
          التالي
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <Card className={`p-4 ${isKids ? 'kids-card' : 'glass border-gold/15'}`}>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_AR.map((day) => (
            <div key={day} className="text-center text-xs font-bold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1
            const sessions = days[dayNum.toString()] ?? []
            const hasSessions = sessions.length > 0
            const isToday = isCurrentMonth && today.getDate() === dayNum
            const isSelected = selectedDay === dayNum.toString()

            return (
              <button
                key={dayNum}
                onClick={() => hasSessions && setSelectedDay(isSelected ? null : dayNum.toString())}
                className={`relative aspect-square rounded-xl p-1 text-center transition-all ${
                  isToday
                    ? 'bg-gold/20 border-2 border-gold'
                    : isSelected
                      ? 'bg-azure/10 border-2 border-azure'
                      : hasSessions
                        ? 'bg-muted/40 hover:bg-muted/60 cursor-pointer'
                        : 'hover:bg-muted/30'
                }`}
              >
                <span className={`text-xs font-bold ${isToday ? 'text-gold' : ''}`}>
                  {dayNum}
                </span>
                {hasSessions && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {sessions.slice(0, 3).map((s, idx) => (
                      <div
                        key={idx}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: TRACK_COLORS[s.track] ?? '#999' }}
                      />
                    ))}
                  </div>
                )}
                {hasSessions && sessions.length > 3 && (
                  <span className="absolute top-0.5 right-0.5 text-[0.5rem] font-bold text-muted-foreground">
                    +{sessions.length - 3}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Selected day sessions */}
      {selectedDay && days[selectedDay] && (
        <div className="mt-4">
          <h3 className="font-display font-bold mb-2">
            حصص يوم {selectedDay} {MONTHS_AR[month - 1]}
          </h3>
          <div className="space-y-2">
            {days[selectedDay].map((s) => (
              <Card key={s.id} className={`p-3 flex items-center gap-3 ${isKids ? 'kids-card' : 'glass border-gold/15'}`}>
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: (TRACK_COLORS[s.track] ?? '#999') + '33' }}
                >
                  {s.track === 'PROGRAMMING' ? '💻' : s.track === 'ROBOTICS' ? '🤖' : '🧮'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.studentName} • {s.teacherName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <TrackBadge track={s.track} />
                    <StatusBadge status={s.bookingStatus} />
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-xs font-bold" dir="ltr">
                    {new Date(s.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
        <span className="flex items-center gap-1 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: TRACK_COLORS.PROGRAMMING }} />
          برمجة
        </span>
        <span className="flex items-center gap-1 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: TRACK_COLORS.ROBOTICS }} />
          روبوتيكس
        </span>
        <span className="flex items-center gap-1 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: TRACK_COLORS.MENTAL_MATH }} />
          حساب ذهني
        </span>
      </div>
    </>
  )
}
