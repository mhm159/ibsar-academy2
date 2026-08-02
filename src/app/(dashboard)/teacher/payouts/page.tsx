'use client'

import { useEffect, useState } from 'react'
import {
  Wallet,
  Loader2,
  Plus,
  Trash2,
  ArrowDownToLine,
  TrendingUp,
  Clock,
  CheckCircle2,
  Star,
} from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { notify } from '@/lib/notify'

interface Balance {
  availableEGP: number
  availableUSD: number
  pendingEGP: number
  pendingUSD: number
  totalEarnedEGP: number
  totalEarnedUSD: number
  totalPaidOutEGP: number
  totalPaidOutUSD: number
}

interface Wallet {
  id: string
  type: string
  identifier: string
  label: string | null
  holderName: string | null
  currency: string
  isDefault: boolean
  meta?: { label: string; icon: string; currency: string }
}

interface Payout {
  id: string
  amountEGP: number
  amountUSD: number
  currency: string
  status: string
  walletAccount: { type: string; identifier: string; label: string | null } | null
  providerRef: string | null
  notes: string | null
  createdAt: string
  processedAt: string | null
}

interface Data {
  balance: Balance
  wallets: Wallet[]
  walletTypes: Array<{ type: string; label: string; icon: string; needsHolder: boolean; currency: string }>
  payouts: Payout[]
}

export default function TeacherPayoutsPage() {
  return (
    <DashboardShell role="TEACHER">
      <PayoutsManager />
    </DashboardShell>
  )
}

function PayoutsManager() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [walletDialog, setWalletDialog] = useState(false)
  const [payoutDialog, setPayoutDialog] = useState(false)

  const load = () => {
    fetch('/api/dashboard/teacher/payouts')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetch('/api/dashboard/teacher/wallets')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setData({
            balance: d.balance,
            wallets: d.wallets,
            walletTypes: d.walletTypes,
            payouts: [],
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading) load()
     
  }, [])

  if (loading || !data) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  const fmtEGP = (piasters: number) => `${(piasters / 100).toFixed(0)} ج.م`
  const fmtUSD = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <>
      <PageHeader
        title="المحافظ والسحب"
        description="إدارة محافظك المالية وطلبات السحب"
        action={
          <Dialog open={payoutDialog} onOpenChange={setPayoutDialog}>
            <DialogTrigger asChild>
              <Button
                className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night"
                disabled={data.balance.availableEGP <= 0 || data.wallets.length === 0}
              >
                <ArrowDownToLine className="h-4 w-4" />
                طلب سحب
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>طلب سحب رصيد</DialogTitle>
              </DialogHeader>
              <PayoutForm
                balance={data.balance}
                wallets={data.wallets}
                onDone={() => {
                  setPayoutDialog(false)
                  load()
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Balance stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Wallet}
          label="الرصيد المتاح"
          value={fmtEGP(data.balance.availableEGP)}
          hint={fmtUSD(data.balance.availableUSD)}
          color="var(--emerald-egypt)"
        />
        <StatCard
          icon={Clock}
          label="قيد التح羁 (Escrow)"
          value={fmtEGP(data.balance.pendingEGP)}
          hint={fmtUSD(data.balance.pendingUSD)}
          color="var(--gold)"
        />
        <StatCard
          icon={TrendingUp}
          label="إجمالي الأرباح"
          value={fmtEGP(data.balance.totalEarnedEGP)}
          hint={fmtUSD(data.balance.totalEarnedUSD)}
          color="var(--azure)"
        />
        <StatCard
          icon={CheckCircle2}
          label="إجمالي المسحوب"
          value={fmtEGP(data.balance.totalPaidOutEGP)}
          hint={fmtUSD(data.balance.totalPaidOutUSD)}
          color="var(--kids-teal)"
        />
      </div>

      <Tabs defaultValue="wallets" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass border border-gold/20 max-w-md">
          <TabsTrigger value="wallets" className="data-[state=active]:bg-gold data-[state=active]:text-night">
            المحافظ ({data.wallets.length})
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-gold data-[state=active]:text-night">
            سجل السحب ({data.payouts.length})
          </TabsTrigger>
        </TabsList>

        {/* Wallets tab */}
        <TabsContent value="wallets" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold">محافظ الاستلام</h3>
            <Dialog open={walletDialog} onOpenChange={(o) => { setWalletDialog(o); if (!o) load() }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 glass border-gold/30 hover:bg-gold/10">
                  <Plus className="h-4 w-4" />
                  إضافة محفظة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة محفظة جديدة</DialogTitle>
                </DialogHeader>
                <WalletForm walletTypes={data.walletTypes} onSaved={() => setWalletDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {data.wallets.length === 0 ? (
            <Card className="glass border-gold/15">
              <EmptyState
                icon={Wallet}
                title="لا توجد محافظ"
                description="أضف محفظة (فودافون كاش، بنك، PayPal) لاستلام أرباحك"
              />
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {data.wallets.map((w) => (
                <WalletCard key={w.id} wallet={w} onDeleted={load} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Payouts tab */}
        <TabsContent value="payouts" className="mt-4 space-y-2">
          {data.payouts.length === 0 ? (
            <Card className="glass border-gold/15">
              <EmptyState
                icon={ArrowDownToLine}
                title="لا توجد طلبات سحب"
                description="اطلب سحب رصيدك المتاح من زر «طلب سحب»"
              />
            </Card>
          ) : (
            data.payouts.map((p) => (
              <Card key={p.id} className="p-4 glass border-gold/15">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={p.status} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="font-bold text-lg">{fmtEGP(p.amountEGP)}</p>
                    {p.walletAccount && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.walletAccount.type} • {p.walletAccount.identifier}
                      </p>
                    )}
                    {p.providerRef && (
                      <p className="text-xs text-muted-foreground" dir="ltr">مرجع: {p.providerRef}</p>
                    )}
                    {p.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}

function WalletCard({ wallet, onDeleted }: { wallet: Wallet; onDeleted: () => void }) {
  const handleDelete = async () => {
    if (!(await notify.confirm('هل تريد حذف هذه المحفظة؟'))) return
    const res = await fetch(`/api/dashboard/teacher/wallets?id=${wallet.id}`, { method: 'DELETE' })
    if (res.ok) {
      notify.success('تم الحذف')
      onDeleted()
    }
  }

  return (
    <Card className="p-4 glass border-gold/15">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-gold/20 to-azure/20 flex items-center justify-center text-xl shrink-0">
          {wallet.meta?.icon ?? '💰'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold">{wallet.meta?.label ?? wallet.type}</h4>
            {wallet.isDefault && (
              <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-gold text-night font-bold">
                افتراضية
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate" dir="ltr">{wallet.identifier}</p>
          {wallet.label && <p className="text-xs text-muted-foreground">{wallet.label}</p>}
          <p className="text-xs text-muted-foreground mt-0.5">العملة: {wallet.currency}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  )
}

function WalletForm({ walletTypes, onSaved }: { walletTypes: Array<{ type: string; label: string; icon: string }>; onSaved: () => void }) {
  const [type, setType] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [label, setLabel] = useState('')
  const [holderName, setHolderName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!type || !identifier) {
      notify.error('املأ البيانات المطلوبة')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/teacher/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, identifier, label, holderName, isDefault }),
      })
      const d = await res.json()
      if (!res.ok) {
        notify.error(d.error || 'فشل الحفظ')
        return
      }
      notify.success('تمت إضافة المحفظة')
      onSaved()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>نوع المحفظة</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-11"><SelectValue placeholder="اختر النوع..." /></SelectTrigger>
          <SelectContent>
            {walletTypes.map((w) => (
              <SelectItem key={w.type} value={w.type}>
                {w.icon} {w.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="identifier">الرقم / البريد / IBAN</Label>
        <Input
          id="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          placeholder="مثال: 01012345678 أو you@email.com"
          dir="ltr"
          className="h-11 text-left"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="label">تسمية (اختياري)</Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="محفظتي الشخصية"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="holder">اسم المالك</Label>
          <Input
            id="holder"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            placeholder="الاسم كما في البنك"
            className="h-11"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="accent-[var(--gold)]"
        />
        تعيين كمحفظة افتراضية
      </label>
      <Button
        type="submit"
        disabled={saving}
        className="w-full h-11 gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        إضافة المحفظة
      </Button>
    </form>
  )
}

function PayoutForm({
  balance,
  wallets,
  onDone,
}: {
  balance: Balance
  wallets: Wallet[]
  onDone: () => void
}) {
  const [walletId, setWalletId] = useState('')
  const [withdrawAll, setWithdrawAll] = useState(true)
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletId) {
      notify.error('اختر المحفظة')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/teacher/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAccountId: walletId,
          withdrawAll,
          amountEGP: withdrawAll ? undefined : Math.round(parseFloat(amount) * 100),
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        notify.error(d.error || 'فشل الطلب')
        return
      }
      notify.success('تم إرسال طلب السحب ✅ سيتم مراجعته من الإدارة')
      onDone()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-emerald-egypt/10 border border-emerald-egypt/30 p-3 text-center">
        <p className="text-xs text-muted-foreground">الرصيد المتاح للسحب</p>
        <p className="text-2xl font-extrabold text-emerald-egypt">
          {(balance.availableEGP / 100).toFixed(0)} ج.م
        </p>
        <p className="text-xs text-muted-foreground">${(balance.availableUSD / 100).toFixed(2)}</p>
      </div>

      <div className="space-y-2">
        <Label>المحفظة المستلمة</Label>
        <Select value={walletId} onValueChange={setWalletId}>
          <SelectTrigger className="h-11"><SelectValue placeholder="اختر المحفظة..." /></SelectTrigger>
          <SelectContent>
            {wallets.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.meta?.label ?? w.type} • {w.identifier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="radio"
          checked={withdrawAll}
          onChange={() => setWithdrawAll(true)}
          className="accent-[var(--gold)]"
        />
        سحب كل الرصيد المتاح
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="radio"
          checked={!withdrawAll}
          onChange={() => setWithdrawAll(false)}
          className="accent-[var(--gold)]"
        />
        سحب مبلغ محدد
      </label>

      {!withdrawAll && (
        <div className="space-y-2">
          <Label htmlFor="amount">المبلغ (ج.م)</Label>
          <Input
            id="amount"
            type="number"
            min={1}
            max={balance.availableEGP / 100}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-11"
            placeholder="0"
          />
        </div>
      )}

      <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
        💡 سيتم مراجعة طلبك من الإدارة وتحويل المبلغ خلال 1-3 أيام عمل. العمولة (15%) محسوبة من الأصل.
      </div>

      <Button
        type="submit"
        disabled={saving}
        className="w-full h-11 gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
        تأكيد طلب السحب
      </Button>
    </form>
  )
}
