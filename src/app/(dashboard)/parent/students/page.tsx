'use client'

import { useEffect, useState } from 'react'
import { Plus, Users, Pencil, Trash2, Loader2, X } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, EmptyState } from '@/components/dashboard/ui-bits'
import { calculateAge } from '@/lib/datetime'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { notify } from '@/lib/notify'

interface Student {
  id: string
  name: string
  birthDate: string | null
  gender: string | null
  grade: string | null
  levelsJson: string
  completedSessions: number
  upcomingSessions: number
}

export default function ParentStudentsPage() {
  return (
    <DashboardShell role="PARENT">
      <StudentsManager />
    </DashboardShell>
  )
}

function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)

  const load = () => {
    fetch('/api/dashboard/parent/students')
      .then((r) => r.json())
      .then((d) => {
        if (d.students) setStudents(d.students)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const calcAge = (birth: string | null) => {
    if (!birth) return null
    return calculateAge(birth).display
  }

  const handleDelete = async (id: string) => {
    if (!(await notify.confirm('هل أنت متأكد من حذف هذا الطفل؟ سيتم حذف جميع حجوزاته وتقاريره.', { danger: true }))) return
    const res = await fetch(`/api/dashboard/parent/students?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      notify.success('تم حذف الطفل')
      load()
    } else {
      notify.error('فشل الحذف')
    }
  }

  return (
    <>
      <PageHeader
        title="أبنائي"
        description="إدارة بيانات أبنائك المسجّلين في الأكاديمية"
        action={
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null) }}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night">
                <Plus className="h-4 w-4" />
                إضافة طفل
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'تعديل بيانات الطفل' : 'إضافة طفل جديد'}</DialogTitle>
              </DialogHeader>
              <StudentForm
                student={editing}
                onSaved={() => {
                  setDialogOpen(false)
                  setEditing(null)
                  load()
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="grid gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState
            icon={Users}
            title="لا يوجد أبناء مسجّلون"
            description="أضف بيانات طفلك الأول للبدء في حجز الحصص ومتابعة تقدّمه"
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {students.map((s) => {
            const age = calcAge(s.birthDate)
            return (
              <Card key={s.id} className="p-5 glass border-gold/15">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-2xl shrink-0">
                    {s.gender === 'FEMALE' ? '👧' : '👦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg truncate">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {age ? `${age} سنة` : 'العمر غير محدد'}
                      {s.grade ? ` • ${s.grade}` : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-egypt/15 text-emerald-egypt font-bold">
                        {s.completedSessions} مكتملة
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/15 text-gold font-bold">
                        {s.upcomingSessions} قادمة
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 flex-1"
                    onClick={() => { setEditing(s); setDialogOpen(true) }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(s.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}

function StudentForm({ student, onSaved }: { student: Student | null; onSaved: () => void }) {
  const [name, setName] = useState(student?.name ?? '')
  const [birthDate, setBirthDate] = useState(
    student?.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : '',
  )
  const [gender, setGender] = useState(student?.gender ?? 'MALE')
  const [grade, setGrade] = useState(student?.grade ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = '/api/dashboard/parent/students'
      const method = student ? 'PATCH' : 'POST'
      const body: any = { name, gender, grade }
      if (birthDate) body.birthDate = new Date(birthDate).toISOString()
      if (student) body.id = student.id

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        notify.error(data.error || 'فشل الحفظ')
        return
      }
      notify.success(student ? 'تم تحديث البيانات' : 'تمت إضافة الطفل')
      onSaved()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">اسم الطفل</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          className="h-11"
          placeholder="مثال: محمد أحمد"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="birth">تاريخ الميلاد</Label>
          <Input
            id="birth"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label>الجنس</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">ذكر</SelectItem>
              <SelectItem value="FEMALE">أنثى</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="grade">الصف الدراسي</Label>
        <Input
          id="grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="h-11"
          placeholder="مثال: الصف الخامس الابتدائي"
        />
      </div>

      <Button
        type="submit"
        disabled={saving || !name}
        className="w-full h-11 gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {student ? 'حفظ التعديلات' : 'إضافة الطفل'}
      </Button>
    </form>
  )
}
