'use client'
import { formatTime } from '@/lib/datetime'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CreditCard, ShieldCheck, Tag, ArrowLeft, Check, Landmark, Wallet } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { ThemeToggle } from '@/components/site/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { notify } from '@/lib/notify'
import { PAYMENT_METHOD_LABELS, COUNTRIES_CONFIG, type PaymentMethod } from '@/lib/payment/config'
import { cn } from '@/lib/utils'
import { useSiteSettings } from '@/hooks/use-site-settings'

interface BookingDetails {
  booking: {
    id: string
    status: string
    priceEGP: number
    priceUSD: number
    session: {
      id: string
      title: string
      track: string
      startTime: string
      endTime: string
      teacherName: string | null
    }
    studentName: string
  }
  country: string
  currency: string
  provider: 'PAYMOB' | 'STRIPE'
  methods: PaymentMethod[]
  existingTransaction: {
    id: string
    status: string
    amountEGP: number
    amountUSD: number
  } | null
}

function CheckoutContent() {
  const params = useSearchParams()
  const router = useRouter()
  const bookingId = params.get('booking') ?? ''

  const [data, setData] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CARD')
  const [couponCode, setCouponCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const { settings } = useSiteSettings()

  useEffect(() => {
    if (!bookingId) {
      router.replace('/parent/sessions')
      return
    }
    fetch(`/api/payment/checkout/details?booking=${bookingId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          notify.error(d.error)
          router.replace('/parent/sessions')
          return
        }
        setData(d)
        setSelectedMethod(d.methods[0] ?? 'CARD')
        setLoading(false)
      })
      .catch(() => {
        notify.error('تعذّر التحميل')
        router.replace('/parent/sessions')
      })
  }, [bookingId, router])

  const handlePay = async () => {
    setProcessing(true)
    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          method: selectedMethod,
          couponCode: couponCode || undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        notify.error(d.error || 'فشل إنشاء الدفع')
        return
      }
      // Redirect to provider checkout URL
      window.location.href = d.checkoutUrl
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setProcessing(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pharaonic">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    )
  }

  const { booking, country, currency, provider, methods, existingTransaction } = data
  const countryConfig = COUNTRIES_CONFIG.find((c) => c.code === country)
  const displayAmount = currency === 'EGP' ? `${(booking.priceEGP / 100).toFixed(0)} ج.م` : `$${(booking.priceUSD / 100).toFixed(2)}`

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })
  const fmtTime = (iso: string) =>
    formatTime(iso)

  return (
    <div className="min-h-screen bg-pharaonic flex flex-col">
      <header className="border-b border-border/50 glass-strong sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
          <Logo size={36} />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 p-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/parent/sessions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold mb-4">
            <ArrowLeft className="h-4 w-4" />
            العودة للحجوزات
          </Link>

          <h1 className="font-display text-3xl font-extrabold mb-2">إتمام الدفع</h1>
          <p className="text-sm text-muted-foreground mb-6">راجع تفاصيل الحجز واختر طريقة الدفع المناسبة</p>

          {/* Booking summary */}
          <Card className="p-5 glass border-gold/15 mb-4">
            <h3 className="font-display font-bold mb-3">تفاصيل الحجز</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">الحصة</span>
                <span className="font-bold">{booking.session.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المعلم</span>
                <span className="font-bold">{booking.session.teacherName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الطالب</span>
                <span className="font-bold">{booking.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الموعد</span>
                <span className="font-bold">{fmtDate(booking.session.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الوقت</span>
                <span className="font-bold" dir="ltr">
                  {fmtTime(booking.session.startTime)} - {fmtTime(booking.session.endTime)}
                </span>
              </div>
            </div>
          </Card>

          {/* Existing transaction status */}
          {existingTransaction && existingTransaction.status === 'PAID' && (
            <Card className="p-5 glass border-emerald-egypt/30 mb-4 bg-emerald-egypt/5">
              <p className="text-sm font-bold text-emerald-egypt flex items-center gap-2">
                <Check className="h-4 w-4" />
                تم دفع هذه الحصة بالفعل
              </p>
            </Card>
          )}

          {/* Amount + coupon */}
          <Card className="p-5 glass border-gold/15 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold">المبلغ المستحق</h3>
              <span className="text-2xl font-extrabold text-gradient-gold">{displayAmount}</span>
            </div>

            {/* Coupon */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="كود الخصم (إن وجد)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="pr-10 h-11"
                />
              </div>
              <Button
                variant="outline"
                className="glass border-gold/30 hover:bg-gold/10"
                onClick={() => notify.info('سيتم تطبيق الكوبون عند الدفع')}
              >
                تطبيق
              </Button>
            </div>
          </Card>

          {/* Payment method */}
          <Card className="p-5 glass border-gold/15 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold">طريقة الدفع</h3>
              <span className="text-xs text-muted-foreground">
                {countryConfig?.flag} {countryConfig?.nameAr} • {provider}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {methods.map((method) => {
                const meta = PAYMENT_METHOD_LABELS[method]
                const selected = selectedMethod === method
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border p-3 text-right transition-all',
                      selected
                        ? 'border-gold bg-gold/10'
                        : 'border-border hover:border-gold/40',
                    )}
                  >
                    <span className="text-xl">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{meta.label}</p>
                    </div>
                    {selected && (
                      <Check className="h-4 w-4 text-gold shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Trust */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
            <ShieldCheck className="h-4 w-4 text-emerald-egypt" />
            <span>دفع آمن ومشفّر • ضمان استرجاع خلال أول حصتين • أموالك في ضمان (Escrow) حتى إتمام الحصة</span>
          </div>

          {/* Platform financial info (bank / wallet / instructions) */}
          <Card className="p-5 glass border-gold/15 mb-4">
            <h3 className="font-display font-bold mb-3 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-gold" />
              طرق سداد إضافية
            </h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground mb-1">تحويل بنكي — {settings['payment.bankName']}</p>
                  <p className="font-mono font-bold" dir="ltr">{settings['payment.bankAccount']}</p>
                  {settings['payment.bankIban'] && (
                    <p className="text-[0.7rem] text-muted-foreground font-mono mt-1 truncate" dir="ltr">IBAN: {settings['payment.bankIban']}</p>
                  )}
                </div>
                <div className="rounded-xl border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Wallet className="h-3.5 w-3.5" /> {settings['payment.walletType']}
                  </p>
                  <p className="font-mono font-bold" dir="ltr">{settings['payment.walletNumber']}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{settings['payment.instructions']}</p>
            </div>
          </Card>

          {/* Pay button */}
          <Button
            onClick={handlePay}
            disabled={processing || (existingTransaction?.status === 'PAID')}
            className="w-full h-14 text-base gap-2 bg-gradient-to-l from-emerald-egypt to-[#52B788] text-white hover:shadow-lg"
          >
            {processing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="h-5 w-5" />
            )}
            {existingTransaction?.status === 'PAID' ? 'تم الدفع' : `ادفع ${displayAmount}`}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            بالضغط على "ادفع" أنت توافق على الشروط والأحكام. سيتم تحويلك لصفحة الدفع الآمنة.
          </p>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-pharaonic"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>}>
      <CheckoutContent />
    </Suspense>
  )
}
