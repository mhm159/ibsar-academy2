'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Loader2, Upload, Check, FileText, Star, Clock } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileUpload } from '@/components/dashboard/file-upload'
import { formatDate } from '@/lib/datetime'
import { toast } from 'sonner'

interface Homework {
  id: string
  title: string
  description: string
  type: string
  status: string
  dueDate: string
  attachmentUrl: string | null
  attachmentName: string | null
  teacherName: string | null
  studentName: string
  studentId: string
  submissionText: string | null
  submissionUrl: string | null
  submissionName: string | null
  submittedAt: string | null
  grade: number | null
  feedback: string | null
  reviewedAt: string | null
}

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'بانتظار التسليم',
  SUBMITTED: 'تم التسليم',
  REVIEWED: 'تم التصحيح',
  LATE: 'متأخر',
  OVERDUE: 'فات الموعد',
}

const TYPE_LABELS: Record<string, string> = {
  PRACTICAL: 'تطبيقي',
  WRITTEN: 'تحريري',
  READING: 'قراءة',
  QUIZ: 'اختبار',
  PROJECT: 'مشروع',
}

export default function ParentHomeworkPage() {
  return (
    <DashboardShell role="PARENT">
      <HomeworkView />
    </DashboardShell>
  )
}

function HomeworkView() {
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [submitDialog, setSubmitDialog] = useState<Homework | null>(null)

  const load = () => {
    fetch('/api/dashboard/parent/homework')
      .then((r) => r.json())
      .then((d) => {
        if (d.homeworks) setHomeworks(d.homeworks)
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
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

  const pending = homeworks.filter((h) => h.status === 'ASSIGNED' || h.status === 'OVERDUE')
  const submitted = homeworks.filter((h) => h.status === 'SUBMITTED' || h.status === 'LATE')
  const reviewed = homeworks.filter((h) => h.status === 'REVIEWED')

  return (
    <>
      <PageHeader
        title="الواجبات"
        description={`${pending.length} بانتظار التسليم • ${submitted.length} تم تسليمها • ${reviewed.length} تم تصحيحها`}
      />

      {/* Pending submission */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gold" />
            بانتظار التسليم ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((h) => (
              <HomeworkCard key={h.id} homework={h} onSubmit={() => setSubmitDialog(h)} />
            ))}
          </div>
        </div>
      )}

      {/* Submitted (waiting review) */}
      {submitted.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold mb-3 flex items-center gap-2">
            <Upload className="h-4 w-4 text-azure" />
            تم تسليمها — بانتظار التصحيح ({submitted.length})
          </h3>
          <div className="space-y-3">
            {submitted.map((h) => (
              <HomeworkCard key={h.id} homework={h} />
            ))}
          </div>
        </div>
      )}

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div>
          <h3 className="font-display font-bold mb-3 flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-egypt" />
            تم تصحيحها ({reviewed.length})
          </h3>
          <div className="space-y-3">
            {reviewed.map((h) => (
              <HomeworkCard key={h.id} homework={h} />
            ))}
          </div>
        </div>
      )}

      {homeworks.length === 0 && (
        <Card className="glass border-gold/15">
          <EmptyState
            icon={BookOpen}
            title="لا توجد واجبات"
            description="سيظهر هنا الواجبات المُكلّف بها أبناؤك"
          />
        </Card>
      )}

      {/* Submit dialog */}
      <Dialog open={!!submitDialog} onOpenChange={(o) => { if (!o) setSubmitDialog(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسليم الواجب</DialogTitle>
          </DialogHeader>
          {submitDialog && (
            <SubmitForm
              homework={submitDialog}
              onDone={() => {
                setSubmitDialog(null)
                load()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function HomeworkCard({ homework, onSubmit }: { homework: Homework; onSubmit?: () => void }) {
  return (
    <Card className="p-4 glass border-gold/15">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-display font-bold">{homework.title}</h4>
            <StatusBadge status={homework.status} label={STATUS_LABELS[homework.status] ?? homework.status} />
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {TYPE_LABELS[homework.type] ?? homework.type}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{homework.description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>👩‍🏫 {homework.teacherName}</span>
            <span>👨‍🎓 {homework.studentName}</span>
            <span>📅 {formatDate(homework.dueDate)}</span>
          </div>

          {/* Teacher attachment */}
          {homework.attachmentUrl && (
            <a
              href={homework.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-gold hover:underline"
            >
              <FileText className="h-3 w-3" />
              {homework.attachmentName ?? 'مرفق المعلم'}
            </a>
          )}

          {/* Grade + feedback */}
          {homework.grade !== null && (
            <div className="mt-2 rounded-lg bg-emerald-egypt/10 p-2 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold">الدرجة:</span>
                <span className="text-lg font-extrabold text-emerald-egypt">{homework.grade}%</span>
              </div>
              {homework.feedback && <p className="text-muted-foreground">💬 {homework.feedback}</p>}
            </div>
          )}
        </div>

        {onSubmit && (homework.status === 'ASSIGNED' || homework.status === 'OVERDUE') && (
          <Button size="sm" onClick={onSubmit} className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night shrink-0">
            <Upload className="h-3.5 w-3.5" />
            تسليم
          </Button>
        )}
      </div>
    </Card>
  )
}

function SubmitForm({ homework, onDone }: { homework: Homework; onDone: () => void }) {
  const [submissionText, setSubmissionText] = useState('')
  const [submissionUrl, setSubmissionUrl] = useState<string | null>(null)
  const [submissionName, setSubmissionName] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submissionText && !submissionUrl) {
      toast.error('اكتب إجابة أو ارفع ملف')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/parent/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeworkId: homework.id,
          submissionText: submissionText || undefined,
          submissionUrl: submissionUrl ?? undefined,
          submissionName: submissionName ?? undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error || 'فشل')
        return
      }
      toast.success('تم تسليم الواجب')
      onDone()
    } catch {
      toast.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-muted/30 p-3">
        <p className="text-sm font-bold mb-1">{homework.title}</p>
        <p className="text-xs text-muted-foreground">{homework.description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">إجابتك (نص)</Label>
        <Textarea
          id="text"
          value={submissionText}
          onChange={(e) => setSubmissionText(e.target.value)}
          rows={4}
          placeholder="اكتب إجابتك هنا..."
        />
      </div>

      <FileUpload
        type="material"
        label="أو ارفع ملف الإجابة"
        accept="image/*,application/pdf,video/mp4,audio/*"
        previewType="file"
        value={submissionUrl}
        onUploaded={(url) => {
          setSubmissionUrl(url)
          setSubmissionName(url.split('/').pop() ?? 'مرفق')
          toast.success('تم رفع الملف')
        }}
        onClear={() => { setSubmissionUrl(null); setSubmissionName(null) }}
      />

      <Button type="submit" disabled={saving} className="w-full h-11 gap-2 bg-gradient-to-l from-emerald-egypt to-[#52B788] text-white">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        تسليم الواجب
      </Button>
    </form>
  )
}
