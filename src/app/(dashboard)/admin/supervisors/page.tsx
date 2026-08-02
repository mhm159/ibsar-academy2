'use client'

import { useEffect, useState } from 'react'
import { Plus, Loader2, UserCog, Power, Trash2, ClipboardCheck, Wallet, Sparkles, Banknote } from 'lucide-react'
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
import { fmtEgp } from '@/lib/money'

interface Supervisor {
  id: string
  userId: string
  name: string | null
  phone: string | null
  isActive: boolean
  title: string | null
  reportsCount: number
  credits: number
  earnedEGP: number
  paidEGP: number
  balanceEGP: number
  createdAt: string
}

interface Payout {
  id: string
  amountEGP: number
  status: string
  notes: string | null
  processedAt: string | null
  createdAt: string
  supervisorName: string
}

const PAYOUT_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'قيد الانتظار', cls: 'bg-gold/10 text-gold' },
  APPROVED: { label: 'معتمد', cls: 'bg-azure/10 text-azure' },
  PROCESSING: { label: 'قيد التنفيذ', cls: 'bg-violet/10 text-violet' },
  COMPLETED: { label: 'تم الصرف', cls: 'bg-emerald-egypt/10 text-emerald-egypt' },
  REJECTED: { label: 'مرفوض', cls: 'bg-destructive/10 text-destructive' },
  FAILED: { label: 'فشل', cls: 'bg-destructive/10 text-destructive' },
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
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [financeTarget, setFinanceTarget] = useState<Supervisor | null>(null)
  const [processingPayout, setProcessingPayout] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/supervisors').then((r) => r.json()),
      fetch('/api/admin/supervisor-payouts').then((r) => r.json()),
    ])
      .then(([s, p]) => {
        if (s.supervisors) setSupervisors(s.supervisors)
        if (p.payouts) setPayouts(p.payouts)
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

  const setPayoutStatus = async (p: Payout, status: string) => {
    setProcessingPayout(p.id)
    try {
      const res = await fetch('/api/admin/supervisor-payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, status }),
      })
      const d = await res.json()
      if (!res.ok) return notify.error(d.error || 'فشل التحديث')
      notify.success('تم تحديث الطلب')
      load()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setProcessingPayout(null)
    }
  }

  const activeCount = supervisors.filter((s) => s.isActive).length
  const totalReports = supervisors.reduce((a, s) => a + s.reportsCount, 0)
  const totalCredits = supervisors.reduce((a, s) => a + s.credits, 0)
  const pendingPayouts = payouts.filter((p) => p.status === 'PENDING')

  return (
    <>
      <PageHeader
        title="المشرفون التربويون"
        description="حسابات المشرفين، الكراد، والأتعاب"
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={UserCog} label="المشرفون" value={supervisors.length} color="var(--azure)" />
        <StatCard icon={UserCog} label="نشطون" value={activeCount} color="var(--emerald-egypt)" />
        <StatCard icon={ClipboardCheck} label="التقارير الصادرة" value={totalReports} color="var(--gold)" />
        <StatCard icon={Sparkles} label="إجمالي الكراد" value={totalCredits} color="var(--kids-teal)" />
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
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet/10 px-2.5 py-0.5 text-xs font-bold text-violet">
                      <Sparkles className="h-3 w-3" />
                      كراد: {s.credits}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-bold text-gold">
                      <Wallet className="h-3 w-3" />
                      الرصيد: {fmtEgp(s.balanceEGP)}
                    </span>
                    <span className="rounded-full bg-muted/50 px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                      مسحوب: {fmtEgp(s.paidEGP)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setFinanceTarget(s)} className="h-9 gap-1.5 text-gold hover:bg-gold/10">
                    <Banknote className="h-4 w-4" />
                    مالية
                  </Button>
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

      {/* Payout requests */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-gold" />
            طلبات السحب من المشرفين
            {pendingPayouts.length > 0 && (
              <span className="rounded-full bg-gold text-night text-xs font-bold px-2 py-0.5">{pendingPayouts.length} معلّق</span>
            )}
          </h2>
        </div>
        {payouts.length === 0 ? (
          <Card className="glass border-gold/15">
            <EmptyState icon={Wallet} title="لا توجد طلبات سحب" description="عندما يطلب مشرف صرف أتعابه سيظهر طلبه هنا" />
          </Card>
        ) : (
          <Card className="glass border-gold/15 divide-y divide-border/60">
            {payouts.map((p) => {
              const meta = PAYOUT_META[p.status] ?? PAYOUT_META.PENDING
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-3 p-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">
                      {fmtEgp(p.amountEGP)}{' '}
                      <span className="text-muted-foreground font-normal text-xs">— {p.supervisorName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(p.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                      {p.notes ? ` • ${p.notes}` : ''}
                      {p.processedAt ? ` • تمت المعالجة ${new Date(p.processedAt).toLocaleString('ar-EG', { dateStyle: 'short' })}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.cls}`}>{meta.label}</span>
                  {p.status === 'PENDING' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={processingPayout === p.id}
                        onClick={() => setPayoutStatus(p, 'APPROVED')}
                        className="h-8 gap-1 text-emerald-egypt hover:bg-emerald-egypt/10"
                      >
                        {processingPayout === p.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        اعتماد
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={processingPayout === p.id}
                        onClick={() => setPayoutStatus(p, 'REJECTED')}
                        className="h-8 gap-1 text-destructive hover:bg-destructive/10"
                      >
                        رفض
                      </Button>
                    </div>
                  )}
                  {p.status === 'APPROVED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={processingPayout === p.id}
                      onClick={() => setPayoutStatus(p, 'COMPLETED')}
                      className="h-8 gap-1 text-emerald-egypt hover:bg-emerald-egypt/10"
                    >
                      {processingPayout === p.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      تم الصرف
                    </Button>
                  )}
                </div>
              )
            })}
          </Card>
        )}
      </div>

      <CreateSupervisorDialog open={creating} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load() }} />
      <FinanceDialog key={financeTarget?.id ?? 'closed'} supervisor={financeTarget} onClose={() => setFinanceTarget(null)} onSaved={load} />
    </>
  )
}

function FinanceDialog({
  supervisor,
  onClose,
  onSaved,
}: {
  supervisor: Supervisor | null
  onClose: () => void
  onSaved: () => void
}) {
  const [credits, setCredits] = useState('')
  const [bonus, setBonus] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'credits' | 'bonus'>('credits')

  const submit = async () => {
    if (!supervisor) return
    const delta = mode === 'credits' ? Math.round(Number(credits)) : 0
    const bonusAmount = mode === 'bonus' ? Math.round(Number(bonus)) * 100 : 0
    if (mode === 'credits' && (!Number.isFinite(delta) || delta === 0)) return notify.error('أدخل قيمة كراد صحيحة')
    if (mode === 'bonus' && (!Number.isFinite(bonusAmount) || bonusAmount === 0)) return notify.error('أدخل مبلغ مكافأة صحيحاً')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/supervisors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: supervisor.id,
          creditDelta: mode === 'credits' ? delta : undefined,
          bonusEGP: mode === 'bonus' ? bonusAmount : undefined,
          bonusNote: mode === 'bonus' && note.trim() ? note.trim() : undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) return notify.error(d.error || 'فشل التحديث')
      notify.success('تمت الإضافة')
      onSaved()
      onClose()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!supervisor} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>المالية — {supervisor?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {supervisor && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-violet/10 p-2">
                <p className="text-lg font-bold text-violet">{supervisor.credits}</p>
                <p className="text-[11px] text-muted-foreground">كراد</p>
              </div>
              <div className="rounded-xl bg-gold/10 p-2">
                <p className="text-lg font-bold text-gold">{fmtEgp(supervisor.balanceEGP)}</p>
                <p className="text-[11px] text-muted-foreground">الرصيد</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-2">
                <p className="text-lg font-bold">{fmtEgp(supervisor.paidEGP)}</p>
                <p className="text-[11px] text-muted-foreground">مسحوب</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === 'credits' ? 'default' : 'outline'}
              onClick={() => setMode('credits')}
              className={mode === 'credits' ? 'bg-violet text-white' : ''}
            >
              إضافة كراد
            </Button>
            <Button
              variant={mode === 'bonus' ? 'default' : 'outline'}
              onClick={() => setMode('bonus')}
              className={mode === 'bonus' ? 'bg-gradient-to-l from-gold to-[#E8D488] text-night' : ''}
            >
              مكافأة مالية
            </Button>
          </div>

          {mode === 'credits' ? (
            <div className="space-y-1.5">
              <Label>قيمة الكراد (يمكن إدخال قيمة سالبة للخصم)</Label>
              <Input type="number" dir="ltr" value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="مثال: 50" />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>المبلغ بالجنيه</Label>
                <Input type="number" dir="ltr" value={bonus} onChange={(e) => setBonus(e.target.value)} placeholder="مثال: 100" />
              </div>
              <div className="space-y-1.5">
                <Label>ملاحظة</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="سبب المكافأة (اختياري)" />
              </div>
            </>
          )}

          <Button onClick={submit} disabled={saving} className="w-full gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
