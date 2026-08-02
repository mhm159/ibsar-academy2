'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save, Clock, Star } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StarRating, TrackBadge } from '@/components/dashboard/ui-bits'
import { FileUpload } from '@/components/dashboard/file-upload'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { notify } from '@/lib/notify'
import { TRACKS } from '@/lib/constants'
import { useTracks } from '@/lib/tracks-store'

const DAYS = [
  { idx: 6, label: 'السبت' },
  { idx: 0, label: 'الأحد' },
  { idx: 1, label: 'الإثنين' },
  { idx: 2, label: 'الثلاثاء' },
  { idx: 3, label: 'الأربعاء' },
  { idx: 4, label: 'الخميس' },
  { idx: 5, label: 'الجمعة' },
]

interface ProfileData {
  teacher: {
    id: string
    name: string | null
    bio: string | null
    tracks: string[]
    experienceYears: number
    hourlyRateEGP: number
    hourlyRateUSD: number
    rating: number
    reviewsCount: number
    status: string
  }
  availability: Array<{ id: string; dayOfWeek: number; startHour: number; endHour: number; isActive: boolean }>
}

export default function TeacherProfilePage() {
  return (
    <DashboardShell role="TEACHER">
      <ProfileEditor />
    </DashboardShell>
  )
}

function ProfileEditor() {
  const trackOptions = useTracks()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // form state
  const [bio, setBio] = useState('')
  const [tracks, setTracks] = useState<string[]>([])
  const [experienceYears, setExperienceYears] = useState('0')
  const [hourlyRateEGP, setHourlyRateEGP] = useState('150')
  const [hourlyRateUSD, setHourlyRateUSD] = useState('15')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [diplomaUrl, setDiplomaUrl] = useState<string | null>(null)
  const [availability, setAvailability] = useState<
    Array<{ dayOfWeek: number; startHour: number; endHour: number; isActive: boolean }>
  >([])

  useEffect(() => {
    fetch('/api/dashboard/teacher/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return
        setData(d)
        setBio(d.teacher.bio ?? '')
        setTracks(d.teacher.tracks)
        setExperienceYears(String(d.teacher.experienceYears))
        setHourlyRateEGP(String(d.teacher.hourlyRateEGP))
        setHourlyRateUSD(String(d.teacher.hourlyRateUSD))
        setAvatarUrl(d.teacher.avatarUrl ?? null)
        setVideoUrl(d.teacher.videoUrl ?? null)
        setDiplomaUrl(d.teacher.diplomaUrl ?? null)
        // Initialize availability for all days (default off)
        const existing = new Map(
          d.availability.map((a: any) => [a.dayOfWeek, a] as [number, { startHour: number; endHour: number; isActive: boolean }]),
        )
        setAvailability(
          DAYS.map((day) => {
            const ex = existing.get(day.idx) as
              | { startHour: number; endHour: number; isActive: boolean }
              | undefined
            return ex
              ? { dayOfWeek: day.idx, startHour: ex.startHour, endHour: ex.endHour, isActive: ex.isActive }
              : { dayOfWeek: day.idx, startHour: 16, endHour: 20, isActive: false }
          }),
        )
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggleTrack = (id: string) => {
    setTracks((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const toggleDay = (idx: number) => {
    setAvailability((prev) =>
      prev.map((a) => (a.dayOfWeek === idx ? { ...a, isActive: !a.isActive } : a)),
    )
  }

  const updateHours = (idx: number, field: 'startHour' | 'endHour', value: number) => {
    setAvailability((prev) =>
      prev.map((a) => (a.dayOfWeek === idx ? { ...a, [field]: value } : a)),
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/teacher/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          tracks,
          experienceYears,
          hourlyRateEGP,
          hourlyRateUSD,
          availability,
          avatarUrl,
          videoUrl,
          diplomaUrl,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        notify.error(d.error || 'فشل الحفظ')
        return
      }
      notify.success('تم تحديث الملف بنجاح')
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="grid gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="الملف الشخصي"
        description="حدّث معلوماتك ومواعيد توفرک وأسعارک"
        action={
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ التغييرات
          </Button>
        }
      />

      {/* Profile header */}
      <Card className="p-5 glass border-gold/15 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-3xl shrink-0">
            👩‍🏫
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-xl">{data.teacher.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={data.teacher.rating} size="md" />
              <span className="text-sm font-bold">{data.teacher.rating}</span>
              <span className="text-xs text-muted-foreground">({data.teacher.reviewsCount} تقييم)</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              data.teacher.status === 'APPROVED'
                ? 'bg-emerald-egypt/15 text-emerald-egypt'
                : 'bg-gold/15 text-gold'
            }`}>
              {data.teacher.status === 'APPROVED' ? '✓ معتمد' : '⏳ قيد المراجعة'}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Bio + tracks */}
        <Card className="p-5 glass border-gold/15 space-y-4">
          <h3 className="font-display font-bold">المعلومات الأساسية</h3>

          <div className="space-y-2">
            <Label htmlFor="bio">نبذة عنك</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="اكتب نبذة قصيرة عن خبرتك وأسلوبك في التدريس..."
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-left">{bio.length}/500</p>
          </div>

          <div className="space-y-2">
            <Label>المواد التي تُدرّسها</Label>
            <div className="grid grid-cols-1 gap-2">
              {trackOptions.map((track) => {
                const selected = tracks.includes(track.id)
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => toggleTrack(track.id)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-right transition-all ${
                      selected
                        ? 'border-gold bg-gold/10'
                        : 'border-border hover:border-gold/40'
                    }`}
                    style={selected ? { borderColor: track.color } : undefined}
                  >
                    <span className="text-xl">{track.emoji}</span>
                    <span className="text-sm font-bold">{track.name}</span>
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center mr-auto shrink-0 ${
                        selected ? 'border-transparent' : 'border-muted-foreground/30'
                      }`}
                      style={selected ? { background: track.color } : undefined}
                    >
                      {selected && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="exp">سنوات الخبرة</Label>
              <Input
                id="exp"
                type="number"
                min={0}
                max={60}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate-egp">سعر الساعة (ج.م)</Label>
              <Input
                id="rate-egp"
                type="number"
                min={0}
                value={hourlyRateEGP}
                onChange={(e) => setHourlyRateEGP(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate-usd">سعر الساعة ($)</Label>
              <Input
                id="rate-usd"
                type="number"
                min={0}
                value={hourlyRateUSD}
                onChange={(e) => setHourlyRateUSD(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        </Card>

        {/* File uploads: avatar + video + diploma */}
        <Card className="p-5 glass border-gold/15 space-y-4">
          <h3 className="font-display font-bold">الصور والملفات</h3>
          <p className="text-xs text-muted-foreground">
            ارفع صورتك الشخصية، فيديو تعريفي، وشهاداتك. ستظهر للطلاب في ملفك.
          </p>

          <FileUpload
            type="avatar"
            label="الصورة الشخصية"
            accept="image/jpeg,image/png,image/webp"
            previewType="image"
            value={avatarUrl}
            onUploaded={(url) => {
              setAvatarUrl(url)
              notify.success('تم رفع الصورة')
            }}
            onClear={() => setAvatarUrl(null)}
          />

          <FileUpload
            type="video"
            label="الفيديو التعريفي (اختياري)"
            accept="video/mp4,video/webm"
            previewType="video"
            value={videoUrl}
            onUploaded={(url) => {
              setVideoUrl(url)
              notify.success('تم رفع الفيديو')
            }}
            onClear={() => setVideoUrl(null)}
          />

          <FileUpload
            type="diploma"
            label="الشهادة / المؤهل (PDF)"
            accept="application/pdf,image/jpeg,image/png"
            previewType="file"
            value={diplomaUrl}
            onUploaded={(url) => {
              setDiplomaUrl(url)
              notify.success('تم رفع الشهادة')
            }}
            onClear={() => setDiplomaUrl(null)}
          />
        </Card>

        {/* Availability */}
        <Card className="p-5 glass border-gold/15 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gold" />
            <h3 className="font-display font-bold">مواعيد التوفر الأسبوعي</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            فعّل الأيام المتاح فيها للتدريس، وحدّد الساعات. سيتمكن الطلاب من حجز حصص في هذه الأوقات.
          </p>

          <div className="space-y-2">
            {availability.map((slot) => {
              const dayLabel = DAYS.find((d) => d.idx === slot.dayOfWeek)?.label ?? ''
              return (
                <div
                  key={slot.dayOfWeek}
                  className={`rounded-xl border p-3 transition-all ${
                    slot.isActive ? 'border-gold/40 bg-gold/5' : 'border-border bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">{dayLabel}</span>
                    <button
                      type="button"
                      onClick={() => toggleDay(slot.dayOfWeek)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        slot.isActive ? 'bg-gold' : 'bg-muted-foreground/30'
                      }`}
                      aria-label={`تفعيل ${dayLabel}`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          slot.isActive ? 'right-0.5' : 'right-[1.375rem]'
                        }`}
                      />
                    </button>
                  </div>
                  {slot.isActive && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">من</span>
                      <select
                        value={slot.startHour}
                        onChange={(e) => updateHours(slot.dayOfWeek, 'startHour', parseInt(e.target.value, 10))}
                        className="rounded-lg border border-border bg-card px-2 py-1 text-sm"
                      >
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour12 = i === 0 ? 12 : i > 12 ? i - 12 : i
                          const period = i < 12 ? 'ص' : 'م'
                          return (
                            <option key={i} value={i}>{hour12}:00 {period}</option>
                          )
                        })}
                      </select>
                      <span className="text-muted-foreground">إلى</span>
                      <select
                        value={slot.endHour}
                        onChange={(e) => updateHours(slot.dayOfWeek, 'endHour', parseInt(e.target.value, 10))}
                        className="rounded-lg border border-border bg-card px-2 py-1 text-sm"
                      >
                        {Array.from({ length: 24 }, (_, i) => i + 1).map((i) => {
                          const h = i === 24 ? 0 : i
                          const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
                          const period = h < 12 ? 'ص' : 'م'
                          return (
                            <option key={i} value={i}>{hour12}:00 {period}</option>
                          )
                        })}
                      </select>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </>
  )
}
