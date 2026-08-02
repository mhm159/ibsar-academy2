'use client'

import { useEffect, useState } from 'react'
import { Plus, Loader2, UserCog, Power, Trash2, ClipboardCheck } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { notify } from '@/lib/notify'

interface Supervisor {
  id: string
  userId: string
  name: string | null
  phone: string | null
  isActive: boolean
  title: string | null
  reportsCount: number
  createdAt: string
}

export default function AdminSupervisorsPage() {
  return (
    <DashboardShell role="ADMIN">
      <SupervisorsManager />
    </DashboardShell>
  )
}

function SupervisorsManager() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/supervisors')
      .then((r) => r.json())
      .then((d) => {
        if (d.supervisors) setSupervisors(d.supervisors)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [])

  const toggleActive = async (s: Supervisor) => {
    setUpdating(s.id)
    try {
      const res = await fetch('/api/admin/supervisors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, isActive: !s.isActive }),
      })
      const d = await res.json()
      if (!res.ok) return notify.error(d.error || 'فشل التحديث')
      notify.success(s.isActive ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب')
      load()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setUpdating(null)
    }
  }

  const remove = async (s: Supervisor) => {
    if (!confirm(`حذف المشرف «${s.name}» وحسابه نهائياً؟`)) return
    const res = await fetch(`/api/admin/supervisors?id=${s.id}`, { method: 'DELETE' })
    const d = await res.json()
    if (!res.ok) return notify.error(d.error || 'فشل الحذف')
    notify.success('تم الحذف')
    load()
  }

  const activeCount = supervisors.filter((s) => s.isActive).length
  const totalReports = supervisors.reduce((a, s) => a + s.reportsCount, 0)

  return (
    <>
      <PageHeader
        title="المشرفون التربويون"
        description="حسابات المشرفين الذين يدخلون الحصص كزائر ويصدرون تقارير"
        action={
          <Button
            className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night"
            onClick={() => setCreating(true)}
          >
            <Plus className="h-4 w-4" />
            مشرف جديد
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard icon={UserCog} label="المشرفون" value={supervisors.length} color="var(--azure)" />
        <StatCard icon={UserCog} label="نشطون" value={activeCount} color="var(--emerald-egypt)" />
        <StatCard icon={ClipboardCheck} label="التقارير الصادرة" value={totalReports} color="var(--gold)" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : supervisors.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState
            icon={UserCog}
            title="لا يوجد مشرفون بعد"
            description="أنشئ أول مشرف تربوي ليتابع الحصص ويصدر تقارير"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {supervisors.map((s) => (
            <Card key={s.id} className="p-4 glass border-gold/15">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-lg shrink-0">
                  {s.name?.charAt(0) ?? '؟'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold truncate">{s.name ?? 'بدون اسم'}</h3>
                    <StatusBadge status={s.isActive ? 'APPROVED' : 'SUSPENDED'} label={s.isActive ? 'نشط' : 'موقوف'} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                    {s.phone ?? '—'}
                    {' • '}
                    {s.title ?? 'مشرف تربوي'}
                    {' • '}
                    {s.reportsCount} تقرير
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={updating === s.id}
                    onClick={() => toggleActive(s)}
                    className={`h-9 gap-1.5 ${s.isActive ? 'text-destructive hover:bg-destructive/10' : 'text-emerald-egypt hover:bg-emerald-egypt/10'}`}
                  >
                    {updating === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                    {s.isActive ? 'إيقاف' : 'تفعيل'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(s)} className="h-9 gap-1.5 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateSupervisorDialog open={creating} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load() }} />
    </>
  )
}

function CreateSupervisorDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({ name: '', phone: '', password: '', title: 'مشرف تربوي' })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.name.trim()) return notify.error('الاسم مطلوب')
    if (!form.phone.trim()) return notify.error('رقم الهاتف مطلوب')
    if (form.password.length < 6) return notify.error('كلمة المرور ٦ أحرف على الأقل')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/supervisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) return notify.error(d.error || 'فشل الإنشاء')
      notify.success('تم إنشاء حساب المشرف')
      onCreated()
    } catch {
      notify.error('تعذّر إنشاء الحساب')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>مشرف تربوي جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>الاسم *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: أ. محمد السيد" />
          </div>
          <div className="space-y-1.5">
            <Label>رقم الهاتف * (سيُستخدم لتسجيل الدخول)</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+20xxxxxxxxxx" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>كلمة المرور *</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="٦ أحرف على الأقل" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>المسمى الوظيفي</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <Button onClick={submit} disabled={saving} className="w-full gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            إنشاء الحساب
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
