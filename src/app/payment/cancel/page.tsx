'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { XCircle, ArrowRight, RotateCcw } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { ThemeToggle } from '@/components/site/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function CancelContent() {
  return (
    <div className="min-h-screen bg-pharaonic flex flex-col">
      <header className="border-b border-border/50 glass-strong">
        <div className="container mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
          <Logo size={36} />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 glass border-destructive/30 text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-destructive/15 mb-6">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="font-display text-3xl font-extrabold mb-2">
            تم إلغاء الدفع
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            لم يتم خصم أي مبلغ. يمكنك المحاولة مرة أخرى في أي وقت.
          </p>

          <div className="flex flex-col gap-2">
            <Link href="/parent/sessions">
              <Button className="w-full h-12 gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night">
                <RotateCcw className="h-4 w-4" />
                المحاولة مرة أخرى
              </Button>
            </Link>
            <Link href="/parent">
              <Button variant="outline" className="w-full h-12 gap-2">
                <ArrowRight className="h-4 w-4" />
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  )
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={null}>
      <CancelContent />
    </Suspense>
  )
}
