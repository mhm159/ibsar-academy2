'use client'

import { ClipboardCheck } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'

export default function SupervisorProfilePage() {
  return (
    <DashboardShell role="SUPERVISOR">
      <PageHeader title="الملف الشخصي" description="دورك: متابعة الحصص وإصدار تقارير تربوية" />
      <Card className="p-6 glass border-gold/15 max-w-2xl">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-3xl">
            📋
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">مشرف تربوي</h3>
            <p className="text-sm text-muted-foreground">منصة منهل — متابعة الجودة التعليمية</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-muted/40 p-3 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-gold" />
            دخول الحصص كزائر (وضع متابعة) لمتابعة سير الدرس وتفاعل الطلاب.
          </div>
          <div className="rounded-xl bg-muted/40 p-3 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-gold" />
            إنشاء تقارير تربوية بضغطة زر لكل حصة (الشات، الحضور، التركيز، الأحداث).
          </div>
          <div className="rounded-xl bg-muted/40 p-3 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-gold" />
            مراجعة تقاريرك من صفحة «تقاريري».
          </div>
        </div>
      </Card>
    </DashboardShell>
  )
}
