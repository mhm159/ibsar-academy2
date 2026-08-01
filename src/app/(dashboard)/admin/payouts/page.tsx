'use client'

import { useEffect, useState } from 'react'
import { Wallet, Clock, CheckCircle2, TrendingUp, Loader2, Check, X } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const WALLET_LABELS: Record<string, string> = {
  VODAFONE_CASH: 'فودافون كاش',
  ETISALAT_CASH: 'اتصالات كاش',
  ORANGE_CASH: 'أورانج كاش',
  WE_PAY: 'وي باي',
  FAWRY: 'فوري',
  BANK_TRANSFER: 'تحويل بنكي',
  PAYPAL: 'PayPal',
  WISE: 'Wise',
}

interface Payout {
  id: string
  amountEGP: number
  amountUSD: number
  currency: string
  status: string
  teacherName: string | null
  teacherPhone: string | null
  teacherCountry: string | null
  wallet: {
    type: string
    identifier: string
    label: string | null
    holderName: string | null
    currency: string
  } | null
  providerRef: string | null
  notes: string | null
  createdAt: string
  processedAt: string | null
}

interface Data {
  summary: {
    pendingCount: number
    pendingAmountEGP: number
    completedCount: number
    completedAmountEGP: number
    totalThisMonthEGP: number
  }
  payouts: Payout[]
}

export default function AdminPayoutsPage() {
  return (
    <DashboardShell role="ADMIN">
      <PayoutsAdmin />
    </DashboardShell>
  )
}

function PayoutsAdmin() {
  const [data, setData] = useState<Data | null>(null)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [processing, setProcessing] = useState<string | null>(null)
  const [processDialog, setProcessDialog] = useState<Payout | null>(null)
  const loading = data === null

  const load = () => {
    fetch(`/api/dashboard/admin/payouts?status=${statusFilter}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setData(null)
          return
        }
        setData(d)
      })
      .catch(() => setData(null))
  }

  useEffect(() => {
    load()
      
  }, [statusFilter])

  const handleAction = async (payoutId: string, action: 'APPROVE' | 'REJECT') => {
    setProcessing(payoutId)
    try {
      const res = await fetch('/api/dashboard/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, action }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error || 'فشل')
        return
      }
      toast.success(d.message)
      load()
    } finally {
      setProcessing(null)
    }
  }

  if (loading || !data) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="طلبات السحب"
        description="مراجعة ومعالجة طلبات سحب المعلمين"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Clock} label="طلبات معلّقة" value={data.summary.pendingCount} hint={`${(data.summary.pendingAmountEGP / 100).toFixed(0)} ج.م`} color="var(--gold)" />
        <StatCard icon={CheckCircle2} label="مكتملة" value={data.summary.completedCount} hint={`${(data.summary.completedAmountEGP / 100).toFixed(0)} ج.م`} color="var(--emerald-egypt)" />
        <StatCard icon={TrendingUp} label="مسحوب هذا الشهر" value={`${(data.summary.totalThisMonthEGP / 100).toFixed(0)} ج.م`} color="var(--azure)" />
        <StatCard icon={Wallet} label="إجمالي المعلمين" value={data.payouts.length} color="var(--kids-teal)" />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground">تصفية:</span>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setData(null)
            setStatusFilter(v)
          }}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">معلّقة</SelectItem>
            <SelectItem value="APPROVED">معتمدة</SelectItem>
            <SelectItem value="COMPLETED">مكتملة</SelectItem>
            <SelectItem value="REJECTED">مرفوضة</SelectItem>
            <SelectItem value="">الكل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.payouts.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState icon={Wallet} title="لا توجد طلبات" description={`لا توجد طلبات ${statusFilter === 'PENDING' ? 'معلّقة' : statusFilter === 'COMPLETED' ? 'مكتملة' : ''} حالياً`} />
        </Card>
      ) : (
        <div className="space-y-3">
          {data.payouts.map((p) => (
            <Card key={p.id} className="p-5 glass border-gold/15">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gold/20 to-azure/20 flex items-center justify-center text-xl shrink-0">
                  💰
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display font-bold">{p.teacherName}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2" dir="ltr">
                    {p.teacherPhone} • {p.teacherCountry}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap text-sm">
                    <span className="font-extrabold text-gradient-gold text-lg">
                      {(p.amountEGP / 100).toFixed(0)} {p.currency}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (${(p.amountUSD / 100).toFixed(2)})
                    </span>
                  </div>
                  {p.wallet && (
                    <div className="mt-2 rounded-lg bg-muted/30 p-2 text-xs">
                      <p className="font-bold">{WALLET_LABELS[p.wallet.type] ?? p.wallet.type}</p>
                      <p className="text-muted-foreground" dir="ltr">{p.wallet.identifier}</p>
                      {p.wallet.holderName && <p className="text-muted-foreground">المالك: {p.wallet.holderName}</p>}
                    </div>
                  )}
                  {p.providerRef && (
                    <p className="text-xs text-muted-foreground mt-1" dir="ltr">مرجع: {p.providerRef}</p>
                  )}
                  {p.notes && <p className="text-xs text-muted-foreground mt-1">ملاحظات: {p.notes}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    الطلب: {new Date(p.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {p.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      onClick={() => handleAction(p.id, 'APPROVE')}
                      disabled={processing === p.id}
                      size="sm"
                      className="gap-1.5 bg-emerald-egypt text-white hover:bg-emerald-egypt/90"
                    >
                      {processing === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      اعتماد
                    </Button>
                    <Button
                      onClick={() => handleAction(p.id, 'REJECT')}
                      disabled={processing === p.id}
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                      رفض
                    </Button>
                  </div>
                )}
                {p.status === 'APPROVED' && (
                  <Button
                    onClick={() => setProcessDialog(p)}
                    className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    تحويل المبلغ
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Process payout dialog */}
      <Dialog open={!!processDialog} onOpenChange={(o) => !o && setProcessDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد تحويل السحب</DialogTitle>
          </DialogHeader>
          {processDialog && (
            <ProcessPayoutForm
              payout={processDialog}
              onDone={() => {
                setProcessDialog(null)
                load()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function ProcessPayoutForm({
  payout,
  onDone,
}: {
  payout: Payout
  onDone: () => void
}) {
  const [providerRef, setProviderRef] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!providerRef) {
      toast.error('أدخل رقم المرجع من التحويل')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId: payout.id,
          action: 'COMPLETE',
          providerRef,
          notes,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error || 'فشل')
        return
      }
      toast.success('تم تأكيد التحويل بنجاح ✅')
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-muted/30 p-3 text-sm">
        <p className="font-bold mb-1">{payout.teacherName}</p>
        <p>المبلغ: <span className="font-extrabold text-gradient-gold">{(payout.amountEGP / 100).toFixed(0)} ج.م</span></p>
        {payout.wallet && (
          <p className="text-xs text-muted-foreground mt-1">
            إلى: {WALLET_LABELS[payout.wallet.type] ?? payout.wallet.type} • {payout.wallet.identifier}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="ref">رقم مرجع التحويل *</Label>
        <Input
          id="ref"
          value={providerRef}
          onChange={(e) => setProviderRef(e.target.value)}
          required
          placeholder="مثال: TRX-12345 / Vodafone-Cash-ref"
          dir="ltr"
          className="h-11 text-left"
        />
        <p className="text-xs text-muted-foreground">
          رقم العملية من فودافون كاش / البنك / فوري — يُرسل للمعلم كإثبات
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">ملاحظات (اختياري)</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="مثال: تم التحويل عبر فودافون كاش"
          className="h-11"
        />
      </div>
      <Button
        type="submit"
        disabled={saving}
        className="w-full h-11 gap-2 bg-gradient-to-l from-emerald-egypt to-[#52B788] text-white"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        تأكيد التحويل وإشعار المعلم
      </Button>
    </form>
  )
}
