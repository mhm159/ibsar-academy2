'use client'
import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, TrackBadge, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Phone, User, Calendar, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/datetime'

interface Trial {
  id: string
  title: string
  track: string
  startTime: string
  status: string
  teacherName: string
  studentName: string
  parentName: string
  parentPhone: string
}

export default function AdminTrialsPage() {
  return (
    <DashboardShell role="ADMIN">
      <AdminTrialsContent />
    </DashboardShell>
  )
}

function AdminTrialsContent() {
  const [trials, setTrials] = useState<Trial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/admin/trials')
      .then(r => r.json())
      .then(d => {
        if (d.trials) setTrials(d.trials)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
  }

  return (
    <>
      <PageHeader 
        title="الحصص التجريبية المجانية" 
        description="متابعة الحصص التجريبية المحجوزة من قبل أولياء الأمور لتتبع معدلات التحويل." 
      />

      <div className="grid gap-4 mt-6">
        {trials.length === 0 ? (
          <Card className="glass border-gold/15">
            <EmptyState
              icon={Calendar}
              title="لا توجد حصص تجريبية"
              description="لم يقم أي ولي أمر بحجز حصة تجريبية بعد."
            />
          </Card>
        ) : (
          trials.map(trial => (
            <Card key={trial.id} className="p-5 glass border-gold/15 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <div className="flex gap-2 items-center mb-2">
                  <TrackBadge track={trial.track} />
                  <StatusBadge status={trial.status} />
                </div>
                <h3 className="font-bold text-lg">{trial.studentName}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" />
                  {formatDateTime(trial.startTime)}
                </p>
              </div>

              <div className="flex flex-col gap-2 text-sm bg-background/50 p-3 rounded-xl border border-border/50">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-azure" />
                  <span className="font-semibold text-muted-foreground w-20">ولي الأمر:</span>
                  <span className="font-bold">{trial.parentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-egypt" />
                  <span className="font-semibold text-muted-foreground w-20">الهاتف:</span>
                  <a href={`https://wa.me/${trial.parentPhone.replace(/\+/g, '')}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-bold" dir="ltr">
                    {trial.parentPhone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gold" />
                  <span className="font-semibold text-muted-foreground w-20">المعلم:</span>
                  <span className="font-bold">{trial.teacherName}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  )
}
