'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Loader2, Pencil, Archive, Trash2, X, Check } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { notify } from '@/lib/notify'
import { setTracks } from '@/lib/tracks-store'

interface TrackRow {
  id: string
  nameAr: string
  nameEn: string
  icon: string
  colorVar: string
  color: string
  descriptionAr: string
  ageRange: string
  emoji: string
  isActive: boolean
  orderIndex: number
}

const PRESET_COLORS = [
  { var: 'kids-teal', css: 'var(--azure)' },
  { var: 'kids-red', css: 'var(--kids-red)' },
  { var: 'kids-yellow', css: 'var(--kids-yellow)' },
  { var: 'kids-green', css: 'var(--emerald-egypt)' },
  { var: 'kids-purple', css: 'var(--kids-purple)' },
  { var: 'kids-orange', css: 'var(--kids-orange)' },
  { var: 'kids-pink', css: 'var(--kids-pink)' },
  { var: 'gold', css: 'var(--gold)' },
]

export default function AdminTracksPage() {
  return (
    <DashboardShell role="ADMIN">
      <TracksManager />
    </DashboardShell>
  )
}

function TracksManager() {
  const [tracks, setTracksList] = useState<TrackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TrackRow | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    fetch('/api/admin/tracks')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setTracksList(d.tracks ?? [])
          setTracks(
            (d.tracks ?? []).map((t: TrackRow) => ({
              id: t.id,
              name: t.nameAr,
              nameEn: t.nameEn,
              icon: t.icon,
              colorVar: t.colorVar,
              color: t.color,
              description: t.descriptionAr,
              descriptionEn: t.descriptionAr,
              ageRange: t.ageRange,
              emoji: t.emoji,
              isActive: t.isActive,
              orderIndex: t.orderIndex,
            })),
          )
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggleActive = async (t: TrackRow) => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/tracks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, isActive: !t.isActive }),
      })
      const data = await res.json()
      if (!res.ok) {
        notify.error(data.error || 'فشل التحديث')
        return
      }
      notify.success(t.isActive ? 'تمت الأرشفة' : 'تم التفعيل')
      load()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (t: TrackRow) => {
    const ok = await notify.confirm(
      t.isActive
        ? `أرشفة مسار «${t.nameAr}»؟ (يُفضَّل الأرشفة حتى لا تختفي الحصص القديمة)`
        : `حذف مسار «${t.nameAr}» نهائياً؟`,
      { title: 'تأكيد', danger: true },
    )
    if (!ok) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/tracks?id=${t.id}&archive=${t.isActive ? 'true' : 'false'}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        notify.error(data.error || 'فشل الحذف')
        return
      }
      notify.success(data.message || 'تم')
      load()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="المسارات والتخصصات" description="أضف مسارات جديدة أو عدّل المسارات الحالية" />
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="المسارات والتخصصات"
        description="أدر التخصصات التعليمية — تظهر تلقائياً في الواجهة الرئيسية ونماذج التسجيل"
        action={
          <Button className="gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            مسار جديد
          </Button>
        }
      />

      {tracks.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState icon={Plus} title="لا توجد مسارات" description="أضف أول مسار تعليمي" />
        </Card>
      ) : (
        <div className="space-y-3">
          {tracks.map((t) => (
            <Card key={t.id} className="glass border-gold/15 p-4 flex items-center gap-3 flex-wrap">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shrink-0"
                style={{ background: `color-mix(in srgb, ${t.color} 14%, transparent)` }}
              >
                {t.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold">{t.nameAr}</h3>
                  <span className="text-xs text-muted-foreground font-mono" dir="ltr">{t.id}</span>
                  {t.isActive ? (
                    <StatusBadge status="PUBLISHED" label="مفعّل" />
                  ) : (
                    <StatusBadge status="DRAFT" label="مؤرشف" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {t.descriptionAr} · {t.ageRange} سنة
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(t)} aria-label="تعديل">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleActive(t)} disabled={busy} aria-label="أرشفة/تفعيل">
                  <Archive className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(t)} disabled={busy} aria-label="حذف">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(showCreate || editing) && (
        <TrackForm
          track={editing}
          onDone={() => {
            setShowCreate(false)
            setEditing(null)
            load()
          }}
          onClose={() => {
            setShowCreate(false)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function TrackForm({
  track,
  onDone,
  onClose,
}: {
  track: TrackRow | null
  onDone: () => void
  onClose: () => void
}) {
  const [id, setId] = useState(track?.id ?? '')
  const [nameAr, setNameAr] = useState(track?.nameAr ?? '')
  const [nameEn, setNameEn] = useState(track?.nameEn ?? '')
  const [descriptionAr, setDescriptionAr] = useState(track?.descriptionAr ?? '')
  const [emoji, setEmoji] = useState(track?.emoji ?? '💡')
  const [ageRange, setAgeRange] = useState(track?.ageRange ?? '7-16')
  const [colorVar, setColorVar] = useState(track?.colorVar ?? 'kids-teal')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!id.trim() || !nameAr.trim() || !nameEn.trim()) {
      notify.error('أكمل المعرّف والاسم العربي والإنجليزي')
      return
    }
    setSaving(true)
    try {
      const color = PRESET_COLORS.find((c) => c.var === colorVar)?.css ?? 'var(--azure)'
      const fields = { nameAr, nameEn, descriptionAr, emoji, ageRange, colorVar, color }
      const res = await fetch('/api/admin/tracks', {
        method: track ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(track ? { id: track.id, ...fields } : { id: id.trim().toUpperCase(), ...fields }),
      })
      const data = await res.json()
      if (!res.ok) {
        notify.error(data.error || 'فشل الحفظ')
        return
      }
      notify.success(track ? 'تم تحديث المسار' : 'تمت إضافة المسار')
      onDone()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{track ? `تعديل ${track.nameAr}` : 'مسار تعليمي جديد'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {!track && (
            <div className="space-y-1.5">
              <Label>المعرّف (أحرف إنجليزية كبيرة فقط)</Label>
              <Input dir="ltr" value={id} onChange={(e) => setId(e.target.value)} placeholder="مثال: AI" />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>الاسم العربي *</Label>
              <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: الذكاء الاصطناعي" />
            </div>
            <div className="space-y-1.5">
              <Label>الاسم الإنجليزي *</Label>
              <Input dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="AI" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>الوصف</Label>
            <Textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows={2} placeholder="وصف مختصر يظهر في البطاقات" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>الرمز التعبيري</Label>
              <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="💡" />
            </div>
            <div className="space-y-1.5">
              <Label>الفئة العمرية</Label>
              <Input dir="ltr" value={ageRange} onChange={(e) => setAgeRange(e.target.value)} placeholder="7-16" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>اللون</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.var}
                  type="button"
                  onClick={() => setColorVar(c.var)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${colorVar === c.var ? 'border-gold scale-110' : 'border-transparent'}`}
                  style={{ background: c.css }}
                  aria-label={c.var}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={saving} className="gap-2 flex-1 bg-gradient-to-l from-gold to-[#E8D488] text-night">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              حفظ
            </Button>
            <Button variant="outline" onClick={onClose} className="gap-1.5 glass">
              <X className="h-4 w-4" />
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
