'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, ShieldAlert, Loader2, HardDriveDownload, Users, CalendarDays, CreditCard, Star, Wallet, FileBarChart, UserCog, DatabaseBackup } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { notify } from '@/lib/notify'

const EXPORTS: { type: string; label: string; icon: any }[] = [
  { type: 'students', label: 'الطلاب', icon: Users },
  { type: 'sessions', label: 'الحصص', icon: CalendarDays },
  { type: 'bookings', label: 'الحجوزات', icon: CalendarDays },
  { type: 'transactions', label: 'المعاملات', icon: CreditCard },
  { type: 'reviews', label: 'التقييمات', icon: Star },
  { type: 'payouts', label: 'طلبات سحب المعلمين', icon: Wallet },
  { type: 'reports', label: 'تقارير المشرفين', icon: FileBarChart },
  { type: 'users', label: 'المستخدمون', icon: Users },
  { type: 'supervisors', label: 'المشرفون', icon: UserCog },
]

export default function AdminDataToolsPage() {
  return (
    <DashboardShell role="ADMIN">
      <DataTools />
    </DashboardShell>
  )
}

function DataTools() {
  const [scope, setScope] = useState<'business' | 'full'>('business')
  const [confirm, setConfirm] = useState('')
  const [resetting, setResetting] = useState(false)

  const doReset = async () => {
    const phrase = scope === 'full' ? 'حذف الكل' : 'تصفير'
    if (confirm.trim() !== phrase) {
      return notify.error(`اكتب «${phrase}» بالضبط لتأكيد التصفير`)
    }
    setResetting(true)
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, confirm }),
      })
      const d = await res.json()
      if (!res.ok) return notify.error(d.error || 'فشلت العملية')
      notify.success(d.message || 'تمت إعادة التعيين')
      setConfirm('')
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="أدوات البيانات"
        description="نسخ احتياطي، تصدير Excel، وإعادة تعيين المنصة"
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard icon={DatabaseBackup} label="نسخة احتياطية" value="قاعدة البيانات" color="var(--azure)" />
        <StatCard icon={FileSpreadsheet} label="تصدير Excel" value={`${EXPORTS.length} أنواع`} color="var(--emerald-egypt)" />
        <StatCard icon={ShieldAlert} label="إعادة التعيين" value="بحذر" color="var(--destructive)" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Backup */}
        <Card className="p-5 glass border-gold/15">
          <h3 className="font-display font-bold flex items-center gap-2 mb-2">
            <HardDriveDownload className="h-5 w-5 text-azure" />
            نسخة احتياطية محلية
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            تنزيل نسخة كاملة من قاعدة البيانات (SQLite) — هي الطريقة الأكثر أماناً لحفظ كل بياناتك.
            للاستعادة: أوقف الخادم، استبدل ملف <code dir="ltr">prisma/db/custom.db</code> بالنسخة المحفوظة، ثم شغّل الخادم.
          </p>
          <Button
            onClick={() => window.open('/api/admin/backup', '_blank')}
            className="gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night"
          >
            <Download className="h-4 w-4" />
            تحميل النسخة الاحتياطية (.db)
          </Button>
        </Card>

        {/* Export */}
        <Card className="p-5 glass border-gold/15">
          <h3 className="font-display font-bold flex items-center gap-2 mb-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-egypt" />
            تصدير إلى Excel
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            صدّر أي قائمة كملف Excel (xlsx) بأسماء عربية واضحة.
          </p>
          <div className="flex flex-wrap gap-2">
            {EXPORTS.map((e) => {
              const Icon = e.icon
              return (
                <Button
                  key={e.type}
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/api/admin/export?type=${e.type}`, '_blank')}
                  className="gap-1.5 glass"
                >
                  <Icon className="h-4 w-4" />
                  {e.label}
                </Button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Reset */}
      <Card className="p-5 mt-6 border-destructive/30 bg-destructive/5">
        <h3 className="font-display font-bold flex items-center gap-2 text-destructive mb-2">
          <ShieldAlert className="h-5 w-5" />
          إعادة تعيين / مسح بيانات المنصة
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          إجراء خطير لا يمكن التراجع عنه. احرص على تنزيل نسخة احتياطية أولاً. تتطلب العملية كتابة عبارة التأكيد بالضبط.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => { setScope('business'); setConfirm('') }}
            className={`text-right rounded-xl border p-3 transition-colors ${scope === 'business' ? 'border-gold bg-gold/10' : 'border-border/60 hover:bg-muted/30'}`}
          >
            <p className="font-bold text-sm">مسح بيانات الأنشطة</p>
            <p className="text-xs text-muted-foreground mt-1">
              يحذف الحصص والحجوزات والمدفوعات والتقارير والتقييمات… مع الإبقاء على الحسابات والإعدادات والمسارات.
            </p>
          </button>
          <button
            type="button"
            onClick={() => { setScope('full'); setConfirm('') }}
            className={`text-right rounded-xl border p-3 transition-colors ${scope === 'full' ? 'border-destructive bg-destructive/10' : 'border-border/60 hover:bg-muted/30'}`}
          >
            <p className="font-bold text-sm text-destructive">إعادة تعيين شاملة</p>
            <p className="text-xs text-muted-foreground mt-1">
              يحذف كل ما سبق بالإضافة إلى جميع الحسابات (المعلمون وأولياء الأمور والطلاب والمشرفون) — يبقى حساب الأدمن فقط.
            </p>
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-56 space-y-1.5">
            <Label>اكتب «{scope === 'full' ? 'حذف الكل' : 'تصفير'}» للتأكيد</Label>
            <Input dir="rtl" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={scope === 'full' ? 'حذف الكل' : 'تصفير'} />
          </div>
          <Button
            onClick={doReset}
            disabled={resetting}
            className="gap-2 bg-destructive text-white hover:bg-destructive/90"
          >
            {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
            {scope === 'full' ? 'إعادة تعيين شاملة' : 'مسح البيانات'}
          </Button>
        </div>
      </Card>
    </>
  )
}
