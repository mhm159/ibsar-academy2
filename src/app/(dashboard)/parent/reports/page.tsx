'use client'

import { useEffect, useState } from 'react'
import { FileBarChart, TrendingUp, Star, GraduationCap } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, TrackBadge, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface ReportsData {
  perStudent: Array<{
    studentId: string
    studentName: string
    totalSessions: number
    avgScore: number
    avgEngagement: number
    avgUnderstanding: number
    attendanceRate: number
  }>
  reports: Array<{
    id: string
    score: number
    engagement: number
    understanding: number
    homework: number
    attendance: string
    notes: string | null
    sessionTitle: string
    track: string
    sessionDate: string
    studentName: string
    teacherName: string | null
  }>
}

export default function ParentReportsPage() {
  return (
    <DashboardShell role="PARENT">
      <ReportsView />
    </DashboardShell>
  )
}

function ReportsView() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/parent/reports')
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
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) return <p className="text-muted-foreground">تعذّر التحميل</p>

  return (
    <>
      <PageHeader
        title="تقارير التقدّم"
        description="متابعة تطوّر أبنائك في كل مادة"
      />

      {/* Per-student summary */}
      {data.perStudent.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {data.perStudent.map((s) => (
            <Card key={s.studentId} className="p-5 glass border-gold/15">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-lg font-bold shrink-0">
                  {s.studentName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-display font-bold">{s.studentName}</h3>
                  <p className="text-xs text-muted-foreground">{s.totalSessions} حصة مكتملة</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">متوسط الدرجات</span>
                    <span className="font-bold text-gradient-gold">{s.avgScore}%</span>
                  </div>
                  <Progress value={s.avgScore} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="text-muted-foreground">التفاعل</p>
                    <p className="font-bold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      {s.avgEngagement}/5
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="text-muted-foreground">الفهم</p>
                    <p className="font-bold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      {s.avgUnderstanding}/5
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">نسبة الحضور</span>
                    <span className="font-bold">{s.attendanceRate}%</span>
                  </div>
                  <Progress value={s.attendanceRate} className="h-2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed reports */}
      <h3 className="font-display font-bold mb-3">سجل التقارير التفصيلي</h3>
      {data.reports.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState
            icon={FileBarChart}
            title="لا توجد تقارير بعد"
            description="ستظهر تقارير مفصّلة بعد إكمال الحصص"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {data.reports.map((r) => (
            <Card key={r.id} className="p-4 glass border-gold/15">
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <TrackBadge track={r.track} />
                  <StatusBadge status={r.attendance} label={
                    r.attendance === 'PRESENT' ? 'حاضر' : r.attendance === 'LATE' ? 'متأخر' : 'غائب'
                  } />
                  <span className="text-xs text-muted-foreground">{r.studentName}</span>
                </div>
                <span className="text-2xl font-extrabold text-gradient-gold">{r.score}%</span>
              </div>
              <p className="font-bold text-sm mb-1">{r.sessionTitle}</p>
              <p className="text-xs text-muted-foreground mb-3">
                {r.teacherName} • {new Date(r.sessionDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <SkillBar label="التفاعل" value={r.engagement} />
                <SkillBar label="الفهم" value={r.understanding} />
                <SkillBar label="الواجب" value={r.homework} />
              </div>

              {r.notes && (
                <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                  📝 {r.notes}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= value ? 'fill-gold text-gold' : 'text-muted-foreground/30'}`}
          />
        ))}
      </div>
    </div>
  )
}
