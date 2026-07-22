'use client'

import { useEffect, useState } from 'react'
import { Users, Phone, MapPin, Clock, CheckCircle2 } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, TrackBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'

interface TeacherStudent {
  id: string
  name: string
  parentName: string
  parentPhone: string
  country: string
  totalSessions: number
  completedSessions: number
  upcomingSessions: number
  lastSessionDate: string | null
  tracks: string[]
  hasReports: number
}

export default function TeacherStudentsPage() {
  return (
    <DashboardShell role="TEACHER">
      <StudentsList />
    </DashboardShell>
  )
}

function StudentsList() {
  const [students, setStudents] = useState<TeacherStudent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/teacher/students')
      .then((r) => r.json())
      .then((d) => {
        if (d.students) setStudents(d.students)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
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
        title="الطلاب"
        description={`يوجد ${students.length} طالب تدرّسهم حالياً`}
      />

      {students.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState
            icon={Users}
            title="لا يوجد طلاب بعد"
            description="سيظهر الطلاب هنا عند حجزهم حصصك"
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => (
            <Card key={s.id} className="p-5 glass border-gold/15">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-lg font-bold shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold truncate">{s.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{s.parentName}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {s.tracks.map((t) => (
                  <TrackBadge key={t} track={t} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-lg font-extrabold text-azure">{s.totalSessions}</p>
                  <p className="text-[0.65rem] text-muted-foreground">إجمالي</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-lg font-extrabold text-emerald-egypt">{s.completedSessions}</p>
                  <p className="text-[0.65rem] text-muted-foreground">مكتملة</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-lg font-extrabold text-gold">{s.upcomingSessions}</p>
                  <p className="text-[0.65rem] text-muted-foreground">قادمة</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/50 pt-3">
                <p className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span dir="ltr">{s.parentPhone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {s.country}
                </p>
                {s.lastSessionDate && (
                  <p className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    آخر حصة: {new Date(s.lastSessionDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                  </p>
                )}
                {s.hasReports > 0 && (
                  <p className="flex items-center gap-2 text-emerald-egypt">
                    <CheckCircle2 className="h-3 w-3" />
                    {s.hasReports} تقرير مُسجّل
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
