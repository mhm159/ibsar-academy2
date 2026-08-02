'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Phone, ArrowLeft, User, Briefcase, GraduationCap } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { OtpFlow } from '@/components/auth/otp-flow'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { COUNTRIES } from '@/lib/constants'
import { useTracks } from '@/lib/tracks-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { notify } from '@/lib/notify'

type Channel = 'SMS' | 'EMAIL' | 'WHATSAPP'
type Step = 'FORM' | 'OTP'

export default function RegisterTeacherPage() {
  const router = useRouter()
  const trackOptions = useTracks()
  const [step, setStep] = React.useState<Step>('FORM')
  const [channel, setChannel] = React.useState<Channel>('WHATSAPP')
  const [target, setTarget] = React.useState('')
  const [name, setName] = React.useState('')
  const [country, setCountry] = React.useState('EG')
  const [city, setCity] = React.useState('')
  const [bio, setBio] = React.useState('')
  const [selectedTracks, setSelectedTracks] = React.useState<string[]>([])
  const [experienceYears, setExperienceYears] = React.useState('5')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const toggleTrack = (id: string) => {
    setSelectedTracks((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTracks.length === 0) {
      setError('اختر مادة واحدة على الأقل')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, channel, purpose: 'REGISTER' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'فشل إرسال الرمز')
        return
      }
      setStep('OTP')
    } catch {
      setError('تعذّر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const handleVerified = async (verificationToken: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'OTP',
          channel,
          target,
          verificationToken,
          role: 'TEACHER',
          name,
          country,
          city: city || undefined,
          bio: bio || undefined,
          tracks: selectedTracks,
          experienceYears: parseInt(experienceYears, 10) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'فشل إنشاء الحساب')
        setStep('FORM')
        return
      }
      notify.success('تم إنشاء حساب المعلم بنجاح! سيتم مراجعته خلال 24 ساعة')
      router.push('/teacher')
    } catch {
      setError('تعذّر الاتصال بالخادم')
      setStep('FORM')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="انضم كمعلم"
      subtitle="كن جزءاً من نخبة المعلمين في أكاديمية إبداع"
    >
      {step === 'FORM' ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                id="name"
                placeholder="مثال: م. أحمد الشريف"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="h-12 text-base pr-11"
              />
            </div>
          </div>

          {/* Tracks selection */}
          <div className="space-y-2">
            <Label>المواد التي تُدرّسها</Label>
            <div className="grid grid-cols-1 gap-2">
              {trackOptions.map((track) => {
                const selected = selectedTracks.includes(track.id)
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => toggleTrack(track.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 text-right transition-all',
                      selected
                        ? 'border-gold bg-gold/10'
                        : 'border-border hover:border-gold/40',
                    )}
                    style={selected ? { borderColor: track.color } : undefined}
                  >
                    <span className="text-2xl">{track.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">{track.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.description}</p>
                    </div>
                    <div
                      className={cn(
                        'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                        selected ? 'border-transparent' : 'border-muted-foreground/30',
                      )}
                      style={selected ? { background: track.color } : undefined}
                    >
                      {selected && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Experience */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="exp">سنوات الخبرة</Label>
              <div className="relative">
                <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="exp"
                  type="number"
                  min={0}
                  max={60}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="h-12 pr-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">الدولة</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country" className="h-12">
                  <SelectValue placeholder="الدولة" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">نبذة عنك</Label>
            <Textarea
              id="bio"
              placeholder="اكتب نبذة قصيرة عن خبرتك وأسلوبك في التدريس..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-left">{bio.length}/500</p>
          </div>

          {/* Channel toggle */}
          <div className="space-y-2">
            <Label>طريقة التحقق</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('SMS')}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-bold transition-all',
                  channel === 'SMS'
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-border text-muted-foreground hover:border-gold/40',
                )}
              >
                <Phone className="h-4 w-4" />
                SMS
              </button>
              <button
                type="button"
                onClick={() => setChannel('WHATSAPP')}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-bold transition-all',
                  channel === 'WHATSAPP'
                    ? 'border-emerald-egypt bg-emerald-egypt/10 text-emerald-egypt'
                    : 'border-border text-muted-foreground hover:border-emerald-egypt/40',
                )}
              >
                <span className="text-base">💬</span>
                واتساب
              </button>
              <button
                type="button"
                onClick={() => setChannel('EMAIL')}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-bold transition-all',
                  channel === 'EMAIL'
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-border text-muted-foreground hover:border-gold/40',
                )}
              >
                <Mail className="h-4 w-4" />
                البريد
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">
              {channel === 'EMAIL' ? 'البريد الإلكتروني' : 'رقم الهاتف'}
            </Label>
            <Input
              id="target"
              type={channel === 'EMAIL' ? 'email' : 'tel'}
              dir={channel === 'EMAIL' ? undefined : 'ltr'}
              placeholder={channel === 'EMAIL' ? 'you@example.com' : '01012345678'}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" required className="mt-0.5 accent-[var(--gold)]" />
            <span>
              أوافق على{' '}
              <Link href="/terms" className="text-gold hover:underline">الشروط والأحكام</Link>
              {' '}و{' '}
              <Link href="/privacy" className="text-gold hover:underline">سياسة الخصوصية</Link>
              . أحتسب أن إنشاء حساب المعلم يتطلب موافقة الإدارة.
            </span>
          </label>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || !name || !target || selectedTracks.length === 0}
            className="w-full h-12 text-base gap-2 bg-gradient-to-l from-azure to-[#4A9DD8] text-white hover:shadow-lg hover:shadow-azure/30"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <GraduationCap className="h-5 w-5" />
            )}
            تقديم طلب الانضمام
          </Button>
        </form>
      ) : (
        <OtpFlow
          target={target}
          channel={channel}
          purpose="REGISTER"
          onVerified={handleVerified}
          onChangeTarget={() => setStep('FORM')}
        />
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        تريد تسجيل طفل بدلاً من ذلك؟{' '}
        <Link href="/auth/register/student" className="text-gold font-bold hover:underline">
          سجّل كولي أمر
        </Link>
      </p>
    </AuthShell>
  )
}

/* TODO(phase-2): Add document upload (degree + ID) step for teacher verification.
 * TODO(phase-3): Add teacher payout info (bank account / wallet) collection during onboarding. */
