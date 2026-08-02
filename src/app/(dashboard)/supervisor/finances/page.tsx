'use client'

import { useEffect, useState } from 'react'
import { Wallet, Loader2, Sparkles, TrendingUp, ArrowDownToLine, History } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, EmptyState, StatusBadge } from '@/components/dashboard/ui-bits'
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
import { notify } from '@/lib/notify'
import { fmtEgp } from '@/lib/money'

interface Balance {
  earned: number
  paid: number
  balanceEGP: number
}

interface Earning {
  id: string
  amountEGP: number
  type: string
  note: string | null
  createdAt: string
}

interface PayoutRow {
  id: string
  amountEGP: number
  status: string
  notes: string | null
  createdAt: string
}

const EARNING_LABEL: Record<string, string> = {
  REPORT_FEE: 'أتعاب تقرير تربوي',
  BONUS: 'مكافأة',
  ADJUSTMENT: 'تسوية',
}

const PAYOUT_LABEL: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  APPROVED: 'معتمد',
  PROCESSING: 'قيد التنفيذ',
  COMPLETED: 'تم الصرف',
  REJECTED: 'مرفوض',
  FAILED: 'فشل',
}

export default function SupervisorFinancesPage() {
  return (
    <DashboardShell role="SUPERVISOR">
      <Finances />
    </DashboardShell>
  )
}

function Finances() {
  const [balance, setBalance] = useState<Balance>({ earned: 0, paid: 0, balanceEGP: 0 })
  const [credits, setCredits] = useState(0)
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)

  const load = () => {
    fetch('/api/supervisor/payout')
      .then((r) => r.json())
      .then((d) => {
        if (d.balance) setBalance(d.balance)
        if (typeof d.credits === 'number') setCredits(d.credits)
        if (d.earnings) setEarnings(d.earnings)
        if (d.payouts) setPayouts(d.payouts)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <PageHeader
        title="المالية"
        description="رصيدك من أتعاب التقارير والكراد"
        action={
          <Button
            className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night"
            onClick={() => setWithdrawing(true)}
            disabled={balance.balanceEGP <= 0}
          >
            <ArrowDownToLine className="h-4 w-4" />
            طلب سحب الرصيد
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard icon={Wallet} label="الرصيد المتاح" value={fmtEgp(balance.balanceEGP)} color="var(--gold)" />
        <StatCard icon={TrendingUp} label="إجمالي الأرباح" value={fmtEgp(balance.earned)} color="var(--emerald-egypt)" />
        <StatCard icon={Sparkles} label="الكراد" value={credits} color="#8b5cf6" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Earnings */}
          <Card className="p-5 glass border-gold/15">
            <h3 className="font-display font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold" />
              سجل الأرباح
            </h3>
            {earnings.length === 0 ? (
              <EmptyState icon={Wallet} title="لا توجد أرباح بعد" description="أصدر تقارير تربوية لتجمع أتعابك هنا" />
            ) : (
              <ul className="space-y-2">
                {earnings.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{EARNING_LABEL[e.type] ?? e.type}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {new Date(e.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                        {e.note ? ` • ${e.note}` : ''}
                      </p>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${e.amountEGP >= 0 ? 'text-emerald-egypt' : 'text-destructive'}`}>
                      {e.amountEGP >= 0 ? '+' : ''}
                      {fmtEgp(e.amountEGP)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Payouts */}
          <Card className="p-5 glass border-gold/15">
            <h3 className="font-display font-bold mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-gold" />
              طلبات السحب
            </h3>
            {payouts.length === 0 ? (
              <EmptyState icon={History} title="لا توجد طلبات سحب" description="اطلب صرف رصيدك وسيقوم فريق الإدارة بمعالجته" />
            ) : (
              <ul className="space-y-2">
                {payouts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{fmtEgp(p.amountEGP)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                        {p.notes ? ` • ${p.notes}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={p.status} label={PAYOUT_LABEL[p.status] ?? p.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <WithdrawDialog key={withdrawing ? 'open' : 'closed'} open={withdrawing} available={balance.balanceEGP} onClose={() => setWithdrawing(false)} onDone={() => { setWithdrawing(false); load() }} />
    </>
  )
}

function WithdrawDialog({
  open,
  available,
  onClose,
  onDone,
}: {
  open: boolean
  available: number
  onClose: () => void
  onDone: () => void
}) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const egp = Math.round(Number(amount))
    if (!Number.isFinite(egp) || egp <= 0) return notify.error('أدخل مبلغاً صحيحاً')
    if (egp * 100 > available) return notify.error('المبلغ يتجاوز الرصيد المتاح')
    setSaving(true)
    try {
      const res = await fetch('/api/supervisor/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountEGP: egp * 100, notes: notes.trim() || undefined }),
      })
      const d = await res.json()
      if (!res.ok) return notify.error(d.error || 'فشل الطلب')
      notify.success('تم إرسال طلب السحب')
      onDone()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>طلب سحب الرصيد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">
            الرصيد المتاح: <span className="font-bold text-gold">{fmtEgp(available)}</span>
          </p>
          <div className="space-y-1.5">
            <Label>المبلغ بالجنيه</Label>
            <Input type="number" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مثال: 200" />
          </div>
          <div className="space-y-1.5">
            <Label>ملاحظات (اختياري)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="طريقة الاستلام المفضلة" />
          </div>
          <Button onClick={submit} disabled={saving} className="w-full gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            إرسال الطلب
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
