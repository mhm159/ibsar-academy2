'use client'

import { useEffect, useState } from 'react'
import { Settings, Loader2, Check } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatusBadge } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface TeacherPricing {
  id: string
  name: string | null
  phone: string | null
  pricingMode: string
  maxHourlyRateEGP: number | null
  fixedHourlyRateEGP: number | null
  fixedHourlyRateUSD: number | null
  hourlyRateEGP: number
  hourlyRateUSD: number
  status: string
}

const MODE_LABELS: Record<string, string> = {
  FREE: 'حر — المعلم يحدد السعر',
  CAPPED: 'محدد بسقف — المعلم لا يتجاوز الحد',
  FIXED: 'ثابت — الأكاديمية تحدد السعر',
}

const MODE_COLORS: Record<string, string> = {
  FREE: 'var(--emerald-egypt)',
  CAPPED: 'var(--gold)',
  FIXED: 'var(--azure)',
}

export default function AdminTeacherPricingPage() {
  return (
    <DashboardShell role="ADMIN">
      <PricingManager />
    </DashboardShell>
  )
}

function PricingManager() {
  const [teachers, setTeachers] = useState<TeacherPricing[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/dashboard/admin/teacher-pricing')
      .then((r) => r.json())
      .then((d) => {
        if (d.teachers) setTeachers(d.teachers)
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
          <div key={i} className="h-20 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="تسعير المعلمين"
        description="تحكم في أسعار المعلمين — حر / محدد بسقف / ثابت من الأكاديمية"
      />

      {/* Commission rate editor */}
      <CommissionEditor />

      {/* Teachers list */}
      <h3 className="font-display font-bold mt-6 mb-3">المعلمون</h3>
      <div className="space-y-3">
        {teachers.map((t) => (
          <Card key={t.id} className="p-4 glass border-gold/15">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold">{t.name}</h4>
                  <span
                    className="text-[0.65rem] px-2 py-0.5 rounded-full font-bold"
                    style={{
                      color: MODE_COLORS[t.pricingMode] ?? 'var(--muted-foreground)',
                      background: `color-mix(in srgb, ${MODE_COLORS[t.pricingMode] ?? '#999'} 12%, transparent)`,
                    }}
                  >
                    {MODE_LABELS[t.pricingMode] ?? t.pricingMode}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground" dir="ltr">{t.phone}</p>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <span>السعر الحالي: <span className="font-bold">{t.hourlyRateEGP / 100} ج.م</span></span>
                  {t.pricingMode === 'CAPPED' && t.maxHourlyRateEGP && (
                    <span className="text-gold">الحد الأقصى: {t.maxHourlyRateEGP / 100} ج.م</span>
                  )}
                  {t.pricingMode === 'FIXED' && t.fixedHourlyRateEGP && (
                    <span className="text-azure">السعر المحدد: {t.fixedHourlyRateEGP / 100} ج.م</span>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(editing === t.id ? null : t.id)}
                className="gap-1.5"
              >
                <Settings className="h-3.5 w-3.5" />
                تعديل
              </Button>
            </div>

            {/* Edit form */}
            {editing === t.id && (
              <PricingEditForm
                teacher={t}
                onSaved={() => {
                  setEditing(null)
                  load()
                }}
                saving={saving}
                setSaving={setSaving}
              />
            )}
          </Card>
        ))}
      </div>
    </>
  )
}

function PricingEditForm({
  teacher,
  onSaved,
  saving,
  setSaving,
}: {
  teacher: TeacherPricing
  onSaved: () => void
  saving: boolean
  setSaving: (v: boolean) => void
}) {
  const [mode, setMode] = useState(teacher.pricingMode)
  const [maxRate, setMaxRate] = useState(String((teacher.maxHourlyRateEGP ?? 30000) / 100))
  const [fixedRate, setFixedRate] = useState(String((teacher.fixedHourlyRateEGP ?? 20000) / 100))
  const [fixedRateUSD, setFixedRateUSD] = useState(String((teacher.fixedHourlyRateUSD ?? 2000) / 100))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/admin/teacher-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          pricingMode: mode,
          maxHourlyRateEGP: mode === 'CAPPED' ? Math.round(parseFloat(maxRate) * 100) : undefined,
          fixedHourlyRateEGP: mode === 'FIXED' ? Math.round(parseFloat(fixedRate) * 100) : undefined,
          fixedHourlyRateUSD: mode === 'FIXED' ? Math.round(parseFloat(fixedRateUSD) * 100) : undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error || 'فشل')
        return
      }
      toast.success(d.message)
      onSaved()
    } catch {
      toast.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
      <div className="space-y-2">
        <Label>وضع التسعير</Label>
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FREE">حر — المعلم يحدد سعره</SelectItem>
            <SelectItem value="CAPPED">محدد بسقف — المعلم لا يتجاوز الحد</SelectItem>
            <SelectItem value="FIXED">ثابت — الأكاديمية تحدد السعر</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === 'CAPPED' && (
        <div className="space-y-2">
          <Label htmlFor="max">الحد الأقصى للسعر (ج.م/ساعة)</Label>
          <Input
            id="max"
            type="number"
            min={0}
            value={maxRate}
            onChange={(e) => setMaxRate(e.target.value)}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            المعلم يستطيع وضع سعر حتى هذا الحد فقط
          </p>
        </div>
      )}

      {mode === 'FIXED' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="fixed-egp">السعر الثابت (ج.م/ساعة)</Label>
            <Input
              id="fixed-egp"
              type="number"
              min={0}
              value={fixedRate}
              onChange={(e) => setFixedRate(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fixed-usd">السعر الثابت ($/ساعة)</Label>
            <Input
              id="fixed-usd"
              type="number"
              min={0}
              value={fixedRateUSD}
              onChange={(e) => setFixedRateUSD(e.target.value)}
              className="h-11"
            />
          </div>
          <p className="col-span-2 text-xs text-muted-foreground">
            المعلم لا يستطيع تغيير هذا السعر — سيُطبّق على جميع حصصه
          </p>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        حفظ الإعدادات
      </Button>
    </div>
  )
}

function CommissionEditor() {
  const [rate, setRate] = useState('15')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/admin/commission')
      .then((r) => r.json())
      .then((d) => {
        if (d.commissionRate !== undefined) setRate(String(d.commissionRate))
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/admin/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: parseFloat(rate) }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error || 'فشل')
        return
      }
      toast.success(d.message)
    } catch {
      toast.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-5 glass border-gold/15">
      <h3 className="font-display font-bold mb-3">نسبة عمولة الأكاديمية</h3>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            disabled={loading || saving}
            className="h-11 w-24"
          />
          <span className="text-lg font-bold">%</span>
        </div>
        <Button onClick={handleSave} disabled={saving || loading} className="gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          حفظ
        </Button>
        <p className="text-xs text-muted-foreground">
          المعلم يحصل على {100 - parseFloat(rate || '15')}% — الأكاديمية تحصل على {rate}%
        </p>
      </div>
    </Card>
  )
}
