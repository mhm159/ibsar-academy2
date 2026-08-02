'use client'

import { useCallback, useEffect, useState } from 'react'
import { BookOpen, ChevronDown, Loader2, Plus, Trash2, Pencil, Check, X, Link2 } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, TrackBadge, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'

interface Lesson {
  id: string
  title: string
  description: string | null
  type: string
  content: string | null
  contentUrl: string | null
  orderIndex: number
  isPublished: boolean
}

interface Course {
  id: string
  title: string
  track: string
  level: string
  description: string | null
  status: string
  totalSessions: number
  lessonCount: number
  lessons: Lesson[]
}

const LESSON_TYPES = [
  { id: 'VIDEO', label: 'فيديو', emoji: '🎬' },
  { id: 'TEXT', label: 'نص تعليمي', emoji: '📄' },
  { id: 'FILE', label: 'ملف مرفق', emoji: '📎' },
  { id: 'QUIZ', label: 'اختبار', emoji: '📝' },
  { id: 'PROJECT', label: 'مشروع', emoji: '🛠️' },
]

export default function TeacherCoursesPage() {
  return (
    <DashboardShell role="TEACHER">
      <CoursesManager />
    </DashboardShell>
  )
}

function CoursesManager() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [openCourse, setOpenCourse] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/dashboard/teacher/courses')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setCourses(d.courses ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="grid gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <>
        <PageHeader title="الكورسات والمحتوى" description="أدر الكورسات والمحتوى التعليمي المرفق بها" />
        <Card className="glass border-gold/15">
          <EmptyState icon={BookOpen} title="لا توجد كورسات" description="لم يتم ربط كورسات بحسابك بعد" />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="الكورسات والمحتوى"
        description="أدر المحتوى التعليمي (الدروس) المرفق بكل كورس — يظهر مباشرة لولي الأمر والطالب"
      />
      <div className="space-y-4">
        {courses.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            open={openCourse === c.id}
            onToggle={() => setOpenCourse(openCourse === c.id ? null : c.id)}
            onChanged={load}
          />
        ))}
      </div>
    </>
  )
}

function CourseCard({
  course,
  open,
  onToggle,
  onChanged,
}: {
  course: Course
  open: boolean
  onToggle: () => void
  onChanged: () => void
}) {
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)

  const deleteLesson = async (lesson: Lesson) => {
    const ok = await notify.confirm(`حذف درس «${lesson.title}»؟`, { title: 'تأكيد الحذف', danger: true })
    if (!ok) return
    setBusy(true)
    try {
      const res = await fetch(`/api/dashboard/teacher/courses?id=${lesson.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        notify.error(data.error || 'فشل الحذف')
        return
      }
      notify.success('تم حذف الدرس')
      onChanged()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="glass border-gold/15 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-start hover:bg-gold/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <TrackBadge track={course.track} />
            <StatusBadge status={course.level} />
            <StatusBadge status={course.status} label={course.status === 'PUBLISHED' ? 'منشور' : course.status} />
          </div>
          <h3 className="font-display font-bold text-base">{course.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{course.description}</p>
        </div>
        <div className="shrink-0 text-center">
          <p className="text-xs text-muted-foreground">{course.lessonCount} درس</p>
          <p className="text-xs text-muted-foreground">{course.totalSessions} حصة</p>
        </div>
        <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-border/40 p-4 space-y-3">
          {course.lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا توجد دروس بعد — أضف أول درس من المحتوى المرفق
            </p>
          ) : (
            <ul className="space-y-2">
              {course.lessons.map((l) => (
                <li key={l.id} className="rounded-xl border border-border/40 p-3 bg-muted/20">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">
                      {LESSON_TYPES.find((t) => t.id === l.type)?.emoji ?? '📄'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{l.title}</p>
                      {l.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{l.description}</p>
                      )}
                    </div>
                    <StatusBadge status={l.isPublished ? 'PUBLISHED' : 'DRAFT'} label={l.isPublished ? 'منشور' : 'مسودة'} />
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingLesson(l)} aria-label="تعديل">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteLesson(l)} disabled={busy} aria-label="حذف">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {l.content && <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">{l.content}</p>}
                  {l.contentUrl && (
                    <a
                      href={l.contentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-azure font-bold hover:underline"
                      dir="ltr"
                    >
                      <Link2 className="h-3 w-3" />
                      {l.contentUrl}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}

          {showForm && !editingLesson ? (
            <LessonForm
              courseId={course.id}
              onDone={() => {
                setShowForm(false)
                onChanged()
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : editingLesson ? (
            <LessonForm
              courseId={course.id}
              lesson={editingLesson}
              onDone={() => {
                setEditingLesson(null)
                onChanged()
              }}
              onCancel={() => setEditingLesson(null)}
            />
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="glass border-gold/30 hover:bg-gold/10"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4" />
              إضافة درس جديد
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

function LessonForm({
  courseId,
  lesson,
  onDone,
  onCancel,
}: {
  courseId: string
  lesson?: Lesson | null
  onDone: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(lesson?.title ?? '')
  const [type, setType] = useState(lesson?.type ?? 'TEXT')
  const [description, setDescription] = useState(lesson?.description ?? '')
  const [content, setContent] = useState(lesson?.content ?? '')
  const [contentUrl, setContentUrl] = useState(lesson?.contentUrl ?? '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!title.trim()) {
      notify.error('أدخل عنوان الدرس')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/teacher/courses', {
        method: lesson ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          lesson
            ? { id: lesson.id, title, type, description, content, contentUrl }
            : { courseId, title, type, description, content, contentUrl },
        ),
      })
      const data = await res.json()
      if (!res.ok) {
        notify.error(data.error || 'فشل الحفظ')
        return
      }
      notify.success(lesson ? 'تم تحديث الدرس' : 'تمت إضافة الدرس')
      onDone()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-bold text-sm">{lesson ? 'تعديل الدرس' : 'درس جديد'}</h4>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancel} aria-label="إغلاق">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground">عنوان الدرس *</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: أساسيات الحلقات التكرارية" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground">نوع الدرس</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="اختر النوع" />
            </SelectTrigger>
            <SelectContent>
              {LESSON_TYPES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.emoji} {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground">رابط فيديو / ملف (اختياري)</label>
          <Input dir="ltr" value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground">وصف قصير</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مثال: شرح الحلقات with أمثلة" />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground">محتوى الدرس (شرح / خطوات / أسئلة)</label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="اكتب محتوى الدرس هنا..." />
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={save} disabled={saving || !title.trim()} className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night flex-1">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          حفظ الدرس
        </Button>
      </div>
    </div>
  )
}
