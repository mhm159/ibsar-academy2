'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Loader2, Plus, Check, Clock, FileText, Star } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileUpload } from '@/components/dashboard/file-upload'
import { formatDate, formatTime } from '@/lib/datetime'
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
  studentName: string
  studentId: string
  sessionTitle: string | null
  submissionText: string | null
  submissionUrl: string | null
  submissionName: string | null
  submittedAt: string | null
  grade: number | null
  feedback: string | null
  reviewedAt: string | null
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'مُكلّف',
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

export default function TeacherHomeworkPage() {
  return (
    <DashboardShell role="TEACHER">
      <HomeworkManager />
    </DashboardShell>
  )
}

function HomeworkManager() {
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [assignDialog, setAssignDialog] = useState(false)
  const [reviewDialog, setReviewDialog] = useState<Homework | null>(null)

  const load = () => {
    fetch('/api/dashboard/teacher/homework')
      .then((r) => r.json())
      .then((d) => {
        if (d.homeworks) setHomeworks(d.homeworks)
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
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  const pending = homeworks.filter((h) => h.status === 'SUBMITTED' || h.status === 'LATE')
  const assigned = homeworks.filter((h) => h.status === 'ASSIGNED')
  const reviewed = homeworks.filter((h) => h.status === 'REVIEWED')

  return (
    <>
      <PageHeader
        title="الواجبات"
        description={`${pending.length} بحاجة تصحيح • ${assigned.length} مُكلّفة • ${reviewed.length} مكتملة`}
        action={
          <Dialog open={assignDialog} onOpenChange={(o) => { setAssignDialog(o); if (!o) load() }}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night">
                <Plus className="h-4 w-4" />
                تكليف واجب
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>تكليف طالب بواجب</DialogTitle>
              </DialogHeader>
              <AssignForm onSaved={() => setAssignDialog(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Pending review */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gold" />
            بحاجة تصحيح ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((h) => (
              <HomeworkCard key={h.id} homework={h} onReview={() => setReviewDialog(h)} />
            ))}
          </div>
        </div>
      )}

      {/* Assigned (not yet submitted) */}
      {assigned.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-azure" />
            مُكلّفة — بانتظار التسليم ({assigned.length})
          </h3>
          <div className="space-y-3">
            {assigned.map((h) => (
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
            description="كلّف طلابك بواجبات لمتابعة تقدّمهم"
          />
        </Card>
      )}

      {/* Review dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(o) => { if (!o) setReviewDialog(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تصحيح الواجب</DialogTitle>
          </DialogHeader>
          {reviewDialog && (
            <ReviewForm
              homework={reviewDialog}
              onDone={() => {
                setReviewDialog(null)
                load()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function HomeworkCard({ homework, onReview }: { homework: Homework; onReview?: () => void }) {
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
            <span>👨‍🎓 {homework.studentName}</span>
            <span>📅 الموعد: {formatDate(homework.dueDate)}</span>
          </div>

          {/* Submission */}
          {homework.submissionText && (
            <div className="mt-2 rounded-lg bg-muted/30 p-2 text-xs">
              <p className="font-bold mb-1">📝 تسليم الطالب:</p>
              <p className="text-muted-foreground">{homework.submissionText}</p>
            </div>
          )}
          {homework.submissionUrl && (
            <a
              href={homework.submissionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-azure hover:underline"
            >
              <FileText className="h-3 w-3" />
              {homework.submissionName ?? 'ملف التسليم'}
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

          {/* Attachment from teacher */}
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
        </div>

        {onReview && (homework.status === 'SUBMITTED' || homework.status === 'LATE') && (
          <Button size="sm" onClick={onReview} className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night shrink-0">
            <Star className="h-3.5 w-3.5" />
            تصحيح
          </Button>
        )}
      </div>
    </Card>
  )
}

function AssignForm({ onSaved }: { onSaved: () => void }) {
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([])
  const [studentId, setStudentId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('PRACTICAL')
  const [dueDate, setDueDate] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const [attachmentName, setAttachmentName] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Fetch teacher's students
    fetch('/api/dashboard/teacher/students')
      .then((r) => r.json())
      .then((d) => {
        if (d.students) setStudents(d.students)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId || !title || !description || !dueDate) {
      toast.error('املأ كل الحقول المطلوبة')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/teacher/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          title,
          description,
          type,
          dueDate: new Date(dueDate).toISOString(),
          attachmentUrl,
          attachmentName,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error || 'فشل')
        return
      }
      toast.success('تم تكليف الطالب بالواجب')
      onSaved()
    } catch {
      toast.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>الطالب</Label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger className="h-11"><SelectValue placeholder="اختر الطالب..." /></SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">عنوان الواجب</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="h-11" placeholder="مثال: تمرين 3 — الحلقات" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">الوصف / التعليمات</Label>
        <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} placeholder="اكتب تعليمات الواجب..." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>النوع</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PRACTICAL">تطبيقي</SelectItem>
              <SelectItem value="WRITTEN">تحريري</SelectItem>
              <SelectItem value="READING">قراءة</SelectItem>
              <SelectItem value="QUIZ">اختبار</SelectItem>
              <SelectItem value="PROJECT">مشروع</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="due">الموعد النهائي</Label>
          <Input id="due" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="h-11" />
        </div>
      </div>

      <FileUpload
        type="material"
        label="مرفق (اختياري)"
        accept="image/*,application/pdf,video/mp4"
        previewType="file"
        value={attachmentUrl}
        onUploaded={(url) => {
          setAttachmentUrl(url)
          setAttachmentName(url.split('/').pop() ?? 'مرفق')
          toast.success('تم رفع المرفق')
        }}
        onClear={() => { setAttachmentUrl(null); setAttachmentName(null) }}
      />

      <Button type="submit" disabled={saving} className="w-full h-11 gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        تكليف بالواجب
      </Button>
    </form>
  )
}

function ReviewForm({ homework, onDone }: { homework: Homework; onDone: () => void }) {
  const [grade, setGrade] = useState('80')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/teacher/homework', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeworkId: homework.id,
          grade: parseInt(grade, 10),
          feedback,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error || 'فشل')
        return
      }
      toast.success('تم تصحيح الواجب')
      onDone()
    } catch {
      toast.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Show submission */}
      {homework.submissionText && (
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-sm font-bold mb-1">📝 تسليم الطالب:</p>
          <p className="text-sm text-muted-foreground">{homework.submissionText}</p>
        </div>
      )}
      {homework.submissionUrl && (
        <a href={homework.submissionUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-azure hover:underline">
          📎 {homework.submissionName ?? 'تحميل الملف'}
        </a>
      )}

      <div className="space-y-2">
        <Label htmlFor="grade">الدرجة (0-100)</Label>
        <Input id="grade" type="number" min={0} max={100} value={grade} onChange={(e) => setGrade(e.target.value)} required className="h-11" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback">ملاحظات للطالب</Label>
        <Textarea id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} placeholder="اكتب ملاحظاتك..." />
      </div>

      <Button type="submit" disabled={saving} className="w-full h-11 gap-2 bg-gradient-to-l from-emerald-egypt to-[#52B788] text-white">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        حفظ التصحيح
      </Button>
    </form>
  )
}
