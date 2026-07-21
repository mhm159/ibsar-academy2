'use client'

import * as React from 'react'
import { Loader2, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { cn } from '@/lib/utils'

interface OtpFlowProps {
  /** target (phone or email) */
  target: string
  channel: 'SMS' | 'EMAIL'
  purpose: 'REGISTER' | 'LOGIN' | 'RESET'
  /** called with the verification token once the OTP is consumed */
  onVerified: (verificationToken: string) => void | Promise<void>
  /** allow user to change the target */
  onChangeTarget?: () => void
}

/**
 * OtpFlow — multi-step OTP component:
 * 1) Send OTP (auto-fired on mount, with resend + countdown)
 * 2) Enter 6-digit code
 * 3) Verify → calls onVerified(verificationToken)
 */
export function OtpFlow({ target, channel, purpose, onVerified, onChangeTarget }: OtpFlowProps) {
  const [code, setCode] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [devCode, setDevCode] = React.useState<string | undefined>()
  const [countdown, setCountdown] = React.useState(0)
  const [resendsLeft, setResendsLeft] = React.useState(3)

  const sendOtp = React.useCallback(
    async (isResend = false) => {
      setSending(true)
      setError(null)
      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target, channel, purpose }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'فشل إرسال الرمز')
          return
        }
        setDevCode(data.devCode)
        setCountdown(60)
        if (isResend) setResendsLeft((n) => Math.max(0, n - 1))
      } catch {
        setError('تعذّر الاتصال بالخادم. حاول مرة أخرى')
      } finally {
        setSending(false)
      }
    },
    [target, channel, purpose],
  )

  // Auto-send on mount
  React.useEffect(() => {
    sendOtp()
  }, [sendOtp])

  // Countdown
  React.useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('أدخل الرمز كاملاً (6 أرقام)')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, code, channel, purpose }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'الرمز غير صحيح')
        return
      }
      await onVerified(data.verificationToken)
    } catch {
      setError('تعذّر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const maskedTarget = React.useMemo(() => {
    if (channel === 'EMAIL') {
      const [name, domain] = target.split('@')
      return `${name.slice(0, 2)}${'•'.repeat(Math.max(2, name.length - 2))}@${domain}`
    }
    // phone: show last 4 digits
    const digits = target.replace(/\D/g, '')
    return `${'•'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`
  }, [target, channel])

  return (
    <div className="space-y-5">
      <div className="rounded-2xl glass border border-gold/20 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          أرسلنا رمزاً مكوّناً من 6 أرقام إلى
        </p>
        <p className="mt-1 font-bold text-base" dir="ltr">
          {maskedTarget}
        </p>
        {devCode && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gold/15 px-3 py-1 text-xs font-bold text-gold">
            <span>رمز التطوير:</span>
            <span dir="ltr" className="tracking-widest">{devCode}</span>
          </div>
        )}
        {onChangeTarget && (
          <button
            type="button"
            onClick={onChangeTarget}
            className="mt-2 block mx-auto text-xs text-muted-foreground hover:text-gold underline"
          >
            تغيير
          </button>
        )}
      </div>

      {/* OTP input */}
      <div className="flex flex-col items-center gap-2">
        <InputOTP
          value={code}
          onChange={(v) => {
            setCode(v)
            setError(null)
          }}
          maxLength={6}
          dir="ltr"
          containerClassName="justify-center"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="h-12 w-12 text-lg font-bold" />
            <InputOTPSlot index={1} className="h-12 w-12 text-lg font-bold" />
            <InputOTPSlot index={2} className="h-12 w-12 text-lg font-bold" />
            <InputOTPSlot index={3} className="h-12 w-12 text-lg font-bold" />
            <InputOTPSlot index={4} className="h-12 w-12 text-lg font-bold" />
            <InputOTPSlot index={5} className="h-12 w-12 text-lg font-bold" />
          </InputOTPGroup>
        </InputOTP>
        <p className="text-xs text-muted-foreground">أدخل الرمز المكوّن من 6 أرقام</p>
      </div>

      {error && (
        <p className="text-sm text-destructive text-center bg-destructive/10 rounded-lg py-2 px-3">
          {error}
        </p>
      )}

      <Button
        onClick={handleVerify}
        disabled={loading || code.length !== 6}
        className="w-full h-12 text-base gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night hover:shadow-lg hover:shadow-gold/30"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            جارٍ التحقق...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5" />
            تأكيد الرمز
          </>
        )}
      </Button>

      {/* Resend */}
      <div className="text-center text-sm">
        {countdown > 0 ? (
          <p className="text-muted-foreground">
            إعادة الإرسال خلال <span className="font-bold">{countdown}</span> ثانية
          </p>
        ) : resendsLeft > 0 ? (
          <button
            type="button"
            onClick={() => sendOtp(true)}
            disabled={sending}
            className="inline-flex items-center gap-1.5 text-gold font-bold hover:underline disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            إعادة إرسال الرمز
          </button>
        ) : (
          <p className="text-muted-foreground">
            تجاوزت حد الإرسال. حاول بعد 5 دقائق
          </p>
        )}
      </div>
    </div>
  )
}

/* TODO(phase-2): Add "verify via WhatsApp" alternative channel for higher deliverability in EG. */
