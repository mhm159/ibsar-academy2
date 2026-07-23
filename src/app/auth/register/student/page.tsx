'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Phone, ArrowLeft, User, MapPin } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { OtpFlow } from '@/components/auth/otp-flow'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COUNTRIES } from '@/lib/constants'
import { toast } from 'sonner'

type Channel = 'SMS' | 'EMAIL' | 'WHATSAPP'
type Step = 'FORM' | 'OTP'

export default function RegisterStudentPage() {
  const router = useRouter()
  const [step, setStep] = React.useState<Step>('FORM')
  const [channel, setChannel] = React.useState<Channel>('SMS')
  const [target, setTarget] = React.useState('')
  const [name, setName] = React.useState('')
  const [country, setCountry] = React.useState('EG')
  const [city, setCity] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
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
          role: 'PARENT',
          name,
          country,
          city: city || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'فشل إنشاء الحساب')
        setStep('FORM')
        return
      }
      toast.success('تم إنشاء حساب ولي الأمر بنجاح!')
      router.push('/parent')
    } catch {
      setError('تعذّر الاتصال بالخادم')
      setStep('FORM')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="تسجيل ولي الأمر"
      subtitle="أنشئ حساب ولي الأمر وأضف بيانات طفلك للبدء"
    >
      {step === 'FORM' ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل لولي الأمر</Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                id="name"
                placeholder="مثال: أحمد محمد"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="h-12 text-base pr-11"
              />
            </div>
          </div>

          {/* Channel toggle */}
          <div className="space-y-2">
            <Label>طريقة التحقق</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('SMS')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-bold transition-all ${
                  channel === 'SMS'
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-border text-muted-foreground hover:border-gold/40'
                }`}
              >
                <Phone className="h-4 w-4" />
                SMS
              </button>
              <button
                type="button"
                onClick={() => setChannel('WHATSAPP')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-bold transition-all ${
                  channel === 'WHATSAPP'
                    ? 'border-emerald-egypt bg-emerald-egypt/10 text-emerald-egypt'
                    : 'border-border text-muted-foreground hover:border-emerald-egypt/40'
                }`}
              >
                <span className="text-base">💬</span>
                واتساب
              </button>
              <button
                type="button"
                onClick={() => setChannel('EMAIL')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-bold transition-all ${
                  channel === 'EMAIL'
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-border text-muted-foreground hover:border-gold/40'
                }`}
              >
                <Mail className="h-4 w-4" />
                البريد
              </button>
            </div>
          </div>

          {/* Target */}
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
            <p className="text-xs text-muted-foreground">
              {channel === 'EMAIL'
                ? 'سنرسل لك رمز تحقق عبر البريد'
                : channel === 'WHATSAPP'
                  ? 'سنرسل لك رمز تحقق عبر واتساب'
                  : 'سنرسل لك رمز تحقق عبر رسالة نصية'}
            </p>
          </div>

          {/* Country + City */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="country">الدولة</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country" className="h-12">
                  <SelectValue placeholder="اختر الدولة" />
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
            <div className="space-y-2">
              <Label htmlFor="city">المدينة</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="city"
                  placeholder="اختياري"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-12 pr-10"
                />
              </div>
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" required className="mt-0.5 accent-[var(--gold)]" />
            <span>
              أوافق على{' '}
              <Link href="/terms" className="text-gold hover:underline">الشروط والأحكام</Link>
              {' '}و{' '}
              <Link href="/privacy" className="text-gold hover:underline">سياسة الخصوصية</Link>
            </span>
          </label>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || !name || !target}
            className="w-full h-12 text-base gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night hover:shadow-lg hover:shadow-gold/30"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowLeft className="h-5 w-5" />
            )}
            متابعة
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
        لديك حساب بالفعل؟{' '}
        <Link href="/auth/login" className="text-gold font-bold hover:underline">
          سجّل الدخول
        </Link>
      </p>
    </AuthShell>
  )
}

/* TODO(phase-2): After PARENT registration, redirect to a wizard that adds the first student profile.
 * TODO(phase-2): Add "referral code" field for growth campaigns. */
