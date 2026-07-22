'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { Loader2, Video, AlertCircle, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { ThemeToggle } from '@/components/site/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function SandboxContent() {
  return (
    <div className="min-h-screen bg-pharaonic flex flex-col">
      <header className="border-b border-border/50 glass-strong">
        <div className="container mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
          <Logo size={36} />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 glass border-gold/20 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gold/15 mb-4">
            <AlertCircle className="h-8 w-8 text-gold" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">وضع تجريبي للفيديو</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Daily.co غير مُعدّ بمفاتيح فعلية. الغرفة الافتراضية ستعرض واجهة محاكاة للفيديو
            مع جميع المميزات (شات، سبورة، تسجيل) شغّالة فعلياً.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            لإتاحة الفيديو الحقيقي، أضف <code className="bg-muted px-1.5 py-0.5 rounded text-gold">DAILY_API_KEY</code> في ملف .env
          </p>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              العودة للرئيسية
            </Button>
          </Link>
        </Card>
      </main>
    </div>
  )
}

export default function SandboxClassroomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>}>
      <SandboxContent />
    </Suspense>
  )
}
