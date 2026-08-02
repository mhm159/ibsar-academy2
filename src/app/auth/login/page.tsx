'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Phone, ArrowLeft, KeyRound } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { OtpFlow } from '@/components/auth/otp-flow'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { notify } from '@/lib/notify'

type Channel = 'SMS' | 'EMAIL' | 'WHATSAPP'
type Step = 'INPUT' | 'OTP'

export default function LoginPage() {
  const router = useRouter()
  const [channel, setChannel] = React.useState<Channel>('SMS')
  const [step, setStep] = React.useState<Step>('INPUT')
  const [target, setTarget] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'PASSWORD',
          target,
          password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'فشل تسجيل الدخول')
        return
      }
      notify.success('تم تسجيل الدخول بنجاح')
      // Route by role
      const role = data.user?.role
      if (role === 'ADMIN') router.push('/admin')
      else if (role === 'TEACHER') router.push('/teacher')
      else router.push('/parent')
    } catch {
      setError('تعذّر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtpForLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, channel, purpose: 'LOGIN' }),
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

  const handleOtpVerified = async (verificationToken: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'OTP',
          channel,
          target,
          verificationToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'فشل تسجيل الدخول')
        setStep('INPUT')
        return
      }
      notify.success('تم تسجيل الدخول بنجاح')
      const role = data.user?.role
      if (role === 'ADMIN') router.push('/admin')
      else if (role === 'TEACHER') router.push('/teacher')
      else router.push('/parent')
    } catch {
      setError('تعذّر الاتصال بالخادم')
      setStep('INPUT')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="تسجيل الدخول" subtitle="أهلاً بعودتك! ادخل لمواصلة رحلة التعلّم">
      <Tabs defaultValue="otp" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass border border-gold/20">
          <TabsTrigger value="otp" className="data-[state=active]:bg-gold data-[state=active]:text-night">
            بالرمز (OTP)
          </TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:bg-gold data-[state=active]:text-night">
            بكلمة المرور
          </TabsTrigger>
        </TabsList>

        {/* OTP tab */}
        <TabsContent value="otp" className="mt-6">
          {step === 'INPUT' ? (
            <form onSubmit={handleSendOtpForLogin} className="space-y-5">
              {/* Channel toggle */}
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

              <div className="space-y-2">
                <Label htmlFor="target-otp">
                  {channel === 'EMAIL' ? 'البريد الإلكتروني' : 'رقم الهاتف'}
                </Label>
                <Input
                  id="target-otp"
                  type={channel === 'EMAIL' ? 'email' : 'tel'}
                  dir={channel === 'EMAIL' ? undefined : 'ltr'}
                  placeholder={channel === 'EMAIL' ? 'you@example.com' : '01012345678'}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg py-2 px-3">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading || target.length < 4}
                className="w-full h-12 text-base gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night hover:shadow-lg hover:shadow-gold/30"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <KeyRound className="h-5 w-5" />
                )}
                إرسال الرمز
              </Button>
            </form>
          ) : (
            <OtpFlow
              target={target}
              channel={channel}
              purpose="LOGIN"
              onVerified={handleOtpVerified}
              onChangeTarget={() => setStep('INPUT')}
            />
          )}
        </TabsContent>

        {/* Password tab */}
        <TabsContent value="password" className="mt-6">
          <form onSubmit={handlePasswordLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="target-pw">البريد أو الهاتف</Label>
              <Input
                id="target-pw"
                placeholder="you@example.com أو 01012345678"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">كلمة المرور</Label>
                <button type="button" className="text-xs text-gold hover:underline">
                  نسيت كلمة المرور؟
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg py-2 px-3">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night hover:shadow-lg hover:shadow-gold/30"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowLeft className="h-5 w-5" />
              )}
              دخول
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{' '}
        <Link href="/auth/register/student" className="text-gold font-bold hover:underline">
          سجّل طفلك الآن
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        أو{' '}
        <Link href="/auth/register/teacher" className="text-azure font-bold hover:underline">
          انضم كمعلم
        </Link>
      </p>
    </AuthShell>
  )
}

/* TODO(phase-2): Implement "نسيت كلمة المرور" flow (RESET purpose OTP → set new password).
 * TODO(phase-2): Replace router.push stubs with real dashboard routes once dashboards exist. */
