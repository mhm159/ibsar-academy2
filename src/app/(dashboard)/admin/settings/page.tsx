'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Save, RotateCcw } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { notify } from '@/lib/notify'
import { SITE_SETTING_DEFS, DEFAULT_SITE_SETTINGS, type SiteSettingDef } from '@/lib/site-settings'

const GROUP_LABELS: Record<string, string> = {
  HERO: 'الواجهة الرئيسية (الهيرو)',
  CTA: 'شريط الدعوة للانضمام',
  FOOTER: 'التذييل (الفوتر)',
  GENERAL: 'عام',
}

export default function AdminSettingsPage() {
  return (
    <DashboardShell role="ADMIN">
      <SettingsEditor />
    </DashboardShell>
  )
}

function SettingsEditor() {
  const [values, setValues] = useState<Record<string, string>>(DEFAULT_SITE_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const load = useCallback(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error && d.settings) {
          setValues(d.settings)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const update = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      })
      const data = await res.json()
      if (!res.ok) {
        notify.error(data.error || 'فشل الحفظ')
        return
      }
      notify.success('تم حفظ نصوص الواجهة — ستظهر على الموقع فوراً')
      setDirty(false)
      // refresh public cache
      try {
        localStorage.removeItem('ibdaa:site-settings')
      } catch { /* ignore */ }
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  const resetAll = async () => {
    const ok = await notify.confirm('إعادة كل النصوص إلى الافتراضي؟', { title: 'تأكيد', danger: true })
    if (!ok) return
    setValues({ ...DEFAULT_SITE_SETTINGS })
    setDirty(true)
    notify.info('تمت إعادة القيم الافتراضية — اضغط «حفظ» لتطبيقها')
  }

  if (loading) {
    return (
      <>
        <PageHeader title="إعدادات الموقع" description="تحرير نصوص الواجهة الرئيسية" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </>
    )
  }

  const groups = ['HERO', 'CTA', 'FOOTER', 'GENERAL'] as const

  return (
    <>
      <PageHeader
        title="إعدادات الموقع"
        description="عدّل نصوص الواجهة الرئيسية (الهيرو، شريط الدعوة، الفوتر) — تُنشر فوراً"
      />

      <div className="flex items-center gap-2 mb-4">
        <Button
          onClick={save}
          disabled={saving || !dirty}
          className="gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ التغييرات
        </Button>
        <Button variant="outline" className="gap-2 glass" onClick={resetAll}>
          <RotateCcw className="h-4 w-4" />
          استعادة الافتراضي
        </Button>
      </div>

      {groups.map((group) => {
        const defs = SITE_SETTING_DEFS.filter((d) => d.group === group)
        if (defs.length === 0) return null
        return (
          <Card key={group} className="glass border-gold/15 p-5 mb-4">
            <h3 className="font-display font-bold text-base mb-4 text-gold">{GROUP_LABELS[group] ?? group}</h3>
            <div className="space-y-4">
              {defs.map((def: SiteSettingDef) => (
                <Field
                  key={def.key}
                  def={def}
                  value={values[def.key] ?? def.defaultValue}
                  onChange={(v) => update(def.key, v)}
                />
              ))}
            </div>
          </Card>
        )
      })}
    </>
  )
}

function Field({
  def,
  value,
  onChange,
}: {
  def: SiteSettingDef
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-muted-foreground">
        {def.label}
        <span className="text-[0.65rem] text-muted-foreground/60 font-mono ms-2" dir="ltr">
          {def.key}
        </span>
      </label>
      {def.type === 'textarea' ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}
