'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Loader2, Pencil, Trash2, ImagePlus, GripVertical } from 'lucide-react'
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
import type { SiteBanner } from '@/features/landing/hero-slider'

export default function AdminSliderPage() {
  return (
    <DashboardShell role="ADMIN">
      <SliderManager />
    </DashboardShell>
  )
}

function SliderManager() {
  const [banners, setBanners] = useState<SiteBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<SiteBanner | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/slider')
      .then((r) => r.json())
      .then((d) => {
        if (d.banners) setBanners(d.banners)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [load])

  const remove = async (b: SiteBanner) => {
    if (!confirm(`حذف الشريحة «${b.title}»؟`)) return
    const res = await fetch(`/api/admin/slider?id=${b.id}`, { method: 'DELETE' })
    const d = await res.json()
    if (!res.ok) return notify.error(d.error || 'فشل الحذف')
    notify.success('تم الحذف')
    load()
  }

  const activeCount = banners.filter((b) => b.isActive).length

  return (
    <>
      <PageHeader
        title="سلايدر الواجهة"
        description="شرائح العرض أعلى الصفحة الرئيسية"
        action={
          <Button
            className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night"
            onClick={() => setCreating(true)}
          >
            <Plus className="h-4 w-4" />
            شريحة جديدة
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={ImagePlus} label="إجمالي الشرائح" value={banners.length} color="var(--azure)" />
        <StatCard icon={ImagePlus} label="الشرائح النشطة" value={activeCount} color="var(--emerald-egypt)" />
        <StatCard icon={ImagePlus} label="الشرائح المعطلة" value={banners.length - activeCount} color="var(--kids-red)" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState
            icon={ImagePlus}
            title="لا توجد شرائح بعد"
            description="أضف شريحة لعرضها أعلى الصفحة الرئيسية"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <Card key={b.id} className="p-4 glass border-gold/15">
              <div className="flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                <div className="h-16 w-24 rounded-xl overflow-hidden bg-gradient-to-br from-gold/20 to-azure/20 shrink-0 relative">
                  {b.imageUrl ? (
                    <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-3xl">{b.emoji}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold truncate">{b.emoji} {b.title}</h3>
                    <StatusBadge status={b.isActive ? 'APPROVED' : 'SUSPENDED'} label={b.isActive ? 'نشط' : 'معطل'} />
                  </div>
                  {b.subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{b.subtitle}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    الترتيب: {b.order} • {b.badge ?? 'بدون شارة'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(b)}
                    className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(b)}
                    className="h-9 gap-1.5 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <BannerDialog
        key={editing?.id ?? (creating ? 'new' : 'closed')}
        open={creating || !!editing}
        initial={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        onSaved={() => {
          setCreating(false)
          setEditing(null)
          load()
        }}
      />
    </>
  )
}

function BannerDialog({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean
  initial: SiteBanner | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    subtitle: initial?.subtitle ?? '',
    imageUrl: initial?.imageUrl ?? '',
    linkUrl: initial?.linkUrl ?? '',
    emoji: initial?.emoji ?? 'ًںڈ†',
    badge: initial?.badge ?? '',
    order: initial?.order ?? 0,
    isActive: initial?.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const handleUpload = async (file: File) => {
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: reader.result, type: 'banner', fileName: file.name }),
        })
        const d = await res.json()
        if (!res.ok || !d.url) {
          notify.error(d.error || 'فشل رفع الصورة')
        } else {
          set('imageUrl', d.url)
          notify.success('تم رفع الصورة')
        }
      } catch {
        notify.error('تعذّر رفع الصورة')
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const save = async () => {
    if (!form.title.trim()) return notify.error('العنوان مطلوب')
    setSaving(true)
    const res = await fetch('/api/admin/slider', {
      method: initial ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...(initial ? { id: initial.id } : {}), ...form }),
    })
    const d = await res.json()
    setSaving(false)
    if (!res.ok) return notify.error(d.error || 'فشل الحفظ')
    notify.success(initial ? 'تم التحديث' : 'تمت الإضافة')
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'تعديل الشريحة' : 'شريحة جديدة'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>العنوان *</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثال: عروض الصيف" />
            </div>
            <div className="space-y-1.5">
              <Label>الرمز 🏆</Label>
              <Input value={form.emoji} onChange={(e) => set('emoji', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>الوصف</Label>
            <Input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>الشارة (Badge)</Label>
            <Input value={form.badge} onChange={(e) => set('badge', e.target.value)} placeholder="مثال: عرض محدود" />
          </div>

          <div className="space-y-1.5">
            <Label>الصورة</Label>
            <div className="flex items-center gap-3">
              <Input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="رابط صورة أو ارفعها" />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
              <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()} className="shrink-0 gap-1.5">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                رفع
              </Button>
            </div>
            {form.imageUrl && (
              <img src={form.imageUrl} alt="معاينة" className="h-24 rounded-xl object-cover border border-border/50 mt-2" />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>رابط الزر</Label>
            <Input value={form.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} placeholder="/auth/register/student" dir="ltr" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>الترتيب</Label>
              <Input type="number" value={form.order} onChange={(e) => set('order', Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5 flex items-end">
              <Button
                type="button"
                variant={form.isActive ? 'default' : 'outline'}
                className={form.isActive ? 'bg-gradient-to-l from-emerald-egypt to-emerald-egypt/70 text-white w-full' : 'w-full'}
                onClick={() => set('isActive', !form.isActive)}
              >
                {form.isActive ? 'نشطة' : 'معطلة'}
              </Button>
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="w-full gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
