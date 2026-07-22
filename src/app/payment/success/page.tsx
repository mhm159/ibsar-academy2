'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ArrowLeft, Loader2, Calendar } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { ThemeToggle } from '@/components/site/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function SuccessContent() {
  const params = useSearchParams()
  const router = useRouter()
  const txId = params.get('tx') ?? ''
  const [tx, setTx] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!txId) return
    fetch(`/api/payment/checkout?tx=${txId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.transaction) setTx(d.transaction)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [txId])

  return (
    <div className="min-h-screen bg-pharaonic flex flex-col">
      <header className="border-b border-border/50 glass-strong">
        <div className="container mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
          <Logo size={36} />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 glass border-emerald-egypt/30 text-center">
          {loading ? (
            <Loader2 className="h-12 w-12 animate-spin text-gold mx-auto" />
          ) : (
            <>
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-egypt/15 mb-6">
                <CheckCircle2 className="h-12 w-12 text-emerald-egypt" />
              </div>
              <h1 className="font-display text-3xl font-extrabold mb-2">
                تم الدفع بنجاح! 🎉
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                تم تأكيد حجزك. الأموال محفوظة في الضمان (Escrow) حتى إتمام الحصة.
              </p>

              {tx && (
                <div className="rounded-xl bg-muted/30 p-4 mb-6 text-right space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">رقم المعاملة</span>
                    <span className="font-mono text-xs">{tx.id.slice(0, 16)}...</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">المبلغ</span>
                    <span className="font-bold">
                      {(tx.amountEGP / 100).toFixed(0)} {tx.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">الحالة</span>
                    <span className="font-bold text-emerald-egypt">
                      {tx.status === 'PAID' ? 'مدفوع' : tx.status}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Link href="/parent/sessions">
                  <Button className="w-full h-12 gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night">
                    <Calendar className="h-4 w-4" />
                    عرض حجوزاتي
                  </Button>
                </Link>
                <Link href="/parent">
                  <Button variant="outline" className="w-full h-12 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    العودة للوحة التحكم
                  </Button>
                </Link>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>}>
      <SuccessContent />
    </Suspense>
  )
}
