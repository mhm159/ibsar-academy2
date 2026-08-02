'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { ThemeToggle } from '@/components/site/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { notify } from '@/lib/notify'

function SandboxPaymentContent() {
  const params = useSearchParams()
  const router = useRouter()
  const order = params.get('order') ?? ''
  const method = params.get('method') ?? 'CARD'
  const amount = params.get('amount') ?? '0'
  const currency = params.get('currency') ?? 'EGP'

  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle')

  const handlePay = async (success: boolean) => {
    setProcessing(true)
    try {
      const res = await fetch('/api/payment/sandbox-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, success }),
      })
      const data = await res.json()
      if (!res.ok) {
        notify.error(data.error || 'فشل')
        setStatus('failed')
        return
      }
      if (success) {
        setStatus('success')
        notify.success('تم الدفع بنجاح! (وضع تجريبي)')
        setTimeout(() => router.push(`/payment/success?tx=${data.transactionId}`), 1500)
      } else {
        setStatus('failed')
      }
    } catch {
      setStatus('failed')
    } finally {
      setProcessing(false)
    }
  }

  const displayAmount = currency === 'EGP' ? `${(parseInt(amount, 10) / 100).toFixed(2)} ج.م` : `$${(parseInt(amount, 10) / 100).toFixed(2)}`

  return (
    <div className="min-h-screen bg-pharaonic flex flex-col">
      <header className="border-b border-border/50 glass-strong">
        <div className="container mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
          <Logo size={36} />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 glass border-gold/20">
          <div className="mb-6 rounded-xl bg-gold/15 border border-gold/30 p-3 text-center">
            <p className="text-sm font-bold text-gold flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              وضع تجريبي (Sandbox)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              لا توجد مفاتيح PayMob/Stripe فعلية. هذا محاكاة للدفع للاختبار فقط.
            </p>
          </div>

          {status === 'success' ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-16 w-16 text-emerald-egypt mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold mb-2">تم الدفع بنجاح!</h1>
              <p className="text-sm text-muted-foreground">جارٍ تحويلك لصفحة التأكيد...</p>
              <Loader2 className="h-6 w-6 animate-spin text-gold mx-auto mt-4" />
            </div>
          ) : status === 'failed' ? (
            <div className="text-center py-6">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold mb-2">فشل الدفع</h1>
              <p className="text-sm text-muted-foreground mb-6">يمكنك المحاولة مرة أخرى</p>
              <Button onClick={() => setStatus('idle')} variant="outline" className="gap-2">
                المحاولة مرة أخرى
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-gold/20 to-azure/20 mb-4">
                  <CreditCard className="h-8 w-8 text-gold" />
                </div>
                <h1 className="font-display text-2xl font-bold mb-1">تأكيد الدفع</h1>
                <p className="text-sm text-muted-foreground">طلب رقم: {order.slice(0, 12)}...</p>
              </div>

              <div className="rounded-xl bg-muted/30 p-4 mb-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">طريقة الدفع</span>
                  <span className="font-bold">{method}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">المبلغ</span>
                  <span className="font-bold text-lg text-gradient-gold">{displayAmount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">العملة</span>
                  <span className="font-bold">{currency}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 justify-center">
                <ShieldCheck className="h-4 w-4 text-emerald-egypt" />
                <span>دفع آمن ومشفّر — ضمان استرجاع خلال أول حصتين</span>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => handlePay(true)}
                  disabled={processing}
                  className="w-full h-12 gap-2 bg-gradient-to-l from-emerald-egypt to-[#52B788] text-white hover:shadow-lg"
                >
                  {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  تأكيد الدفع (محاكاة نجاح)
                </Button>
                <Button
                  onClick={() => handlePay(false)}
                  disabled={processing}
                  variant="outline"
                  className="w-full h-12 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  محاكاة فشل الدفع
                </Button>
              </div>

              <Link href="/" className="block text-center text-xs text-muted-foreground hover:text-gold mt-4">
                إلغاء والعودة للرئيسية
              </Link>
            </>
          )}
        </Card>
      </main>
    </div>
  )
}

export default function SandboxPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>}>
      <SandboxPaymentContent />
    </Suspense>
  )
}
