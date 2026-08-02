'use client'
import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MessageCircle,
  Send,
  Eye,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { notify } from '@/lib/notify'

interface DryRunParent {
  parentId: string
  parentName: string
  phone: string
  studentsCount: number
  sessionsCount: number
}

export default function AdminWhatsAppReportsPage() {
  return (
    <DashboardShell role="ADMIN">
      <WhatsAppReportsContent />
    </DashboardShell>
  )
}

function WhatsAppReportsContent() {
  const [loading, setLoading] = useState(false)
  const [dryRunData, setDryRunData] = useState<DryRunParent[] | null>(null)
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; skipped: number } | null>(null)
  const [previewParentId, setPreviewParentId] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  const handleDryRun = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports/send-weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dry-run' }),
      })
      const data = await res.json()
      if (data.ok) {
        setDryRunData(data.parents)
        notify.success(`سيتم الإرسال لـ ${data.wouldSend} ولي أمر`)
      } else {
        notify.error(data.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!(await notify.confirm(`هل تريد إرسال التقارير الأسبوعية فعلياً عبر الواتساب لجميع أولياء الأمور؟`))) return
    setLoading(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/reports/send-weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      })
      const data = await res.json()
      if (data.ok) {
        setSendResult({ sent: data.sent, failed: data.failed, skipped: data.skipped })
        notify.success(data.message)
      } else {
        notify.error(data.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    if (!previewParentId.trim()) {
      notify.error('أدخل ID ولي الأمر أولاً')
      return
    }
    setLoading(true)
    setPreview(null)
    try {
      const res = await fetch('/api/reports/send-weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', parentId: previewParentId }),
      })
      const data = await res.json()
      if (data.ok) {
        setPreview(data.preview)
      } else {
        notify.error(data.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="التقارير الأسبوعية عبر واتساب"
        description="إرسال تقارير أداء تلقائية لأولياء الأمور عبر الواتساب كل أسبوع."
      />

      {/* Info banner */}
      <Card className="p-4 glass border-gold/20 bg-gold/5 flex items-start gap-3 mt-6">
        <AlertTriangle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold text-gold mb-1">كيف يعمل النظام؟</p>
          <p className="text-muted-foreground">
            يجمع النظام كل تقارير الأداء (Progress Reports) الصادرة خلال آخر 7 أيام، ويُرسل رسالة واتساب منسّقة لكل ولي أمر تحتوي على درجات أبنائه، مستوى التفاعل، الحضور، وملاحظات المعلم. يتطلب إعداد متغيرات Twilio في ملف <code className="text-gold bg-black/30 px-1 rounded">.env</code>
          </p>
        </div>
      </Card>

      <div className="grid gap-4 mt-6 sm:grid-cols-3">
        {/* Dry Run */}
        <Card className="p-5 glass border-azure/20 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-azure" />
            <h3 className="font-bold">اختبار (Dry Run)</h3>
          </div>
          <p className="text-xs text-muted-foreground">اعرف عدد أولياء الأمور الذين سيستلمون التقرير هذا الأسبوع بدون إرسال فعلي.</p>
          <Button onClick={handleDryRun} disabled={loading} variant="outline" className="mt-auto border-azure/30 text-azure hover:bg-azure/10">
            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <PlayCircle className="w-4 h-4 ml-2" />}
            تشغيل الاختبار
          </Button>
        </Card>

        {/* Preview */}
        <Card className="p-5 glass border-gold/20 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-gold" />
            <h3 className="font-bold">معاينة تقرير</h3>
          </div>
          <p className="text-xs text-muted-foreground">استعرض الرسالة الكاملة التي ستُرسل لولي أمر معين قبل الإرسال.</p>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-gold outline-none"
            placeholder="Parent ID..."
            value={previewParentId}
            onChange={e => setPreviewParentId(e.target.value)}
            dir="ltr"
          />
          <Button onClick={handlePreview} disabled={loading} variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Eye className="w-4 h-4 ml-2" />}
            معاينة
          </Button>
        </Card>

        {/* Send All */}
        <Card className="p-5 glass border-emerald-egypt/20 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-egypt" />
            <h3 className="font-bold">إرسال الكل</h3>
          </div>
          <p className="text-xs text-muted-foreground">أرسل التقارير الأسبوعية فعلياً لجميع أولياء الأمور عبر الواتساب.</p>
          <Button onClick={handleSend} disabled={loading} className="mt-auto bg-emerald-egypt text-white hover:bg-emerald-egypt/90">
            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}
            إرسال الآن
          </Button>
        </Card>
      </div>

      {/* Dry Run Results */}
      {dryRunData && (
        <Card className="mt-6 glass border-azure/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
            <Users className="w-4 h-4 text-azure" />
            <h3 className="font-bold">نتائج الاختبار — {dryRunData.length} ولي أمر</h3>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">ولي الأمر</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الهاتف</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">الأبناء</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">الحصص</th>
                </tr>
              </thead>
              <tbody>
                {dryRunData.map(p => (
                  <tr key={p.parentId} className="border-t border-border/30 hover:bg-muted/20 cursor-pointer" onClick={() => setPreviewParentId(p.parentId)}>
                    <td className="px-4 py-3 font-medium">{p.parentName}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs" dir="ltr">{p.phone}</td>
                    <td className="px-4 py-3 text-center">{p.studentsCount}</td>
                    <td className="px-4 py-3 text-center text-gold font-bold">{p.sessionsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 text-xs text-muted-foreground border-t border-border/50">
            💡 اضغط على أي صف لاستخدام ID الخاص به في معاينة التقرير
          </div>
        </Card>
      )}

      {/* Send Result */}
      {sendResult && (
        <Card className="mt-6 p-5 glass border-emerald-egypt/20">
          <h3 className="font-bold mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> نتائج الإرسال</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-emerald-egypt/10 border border-emerald-egypt/20">
              <CheckCircle2 className="w-6 h-6 text-emerald-egypt mx-auto mb-1" />
              <div className="text-2xl font-bold text-emerald-egypt">{sendResult.sent}</div>
              <div className="text-xs text-muted-foreground">تم الإرسال</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <XCircle className="w-6 h-6 text-destructive mx-auto mb-1" />
              <div className="text-2xl font-bold text-destructive">{sendResult.failed}</div>
              <div className="text-xs text-muted-foreground">فشل</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted/30 border border-border">
              <MessageCircle className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
              <div className="text-2xl font-bold">{sendResult.skipped}</div>
              <div className="text-xs text-muted-foreground">تم التخطي</div>
            </div>
          </div>
        </Card>
      )}

      {/* Preview pane */}
      {preview && (
        <Card className="mt-6 glass border-gold/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-egypt" />
              <h3 className="font-bold">معاينة رسالة الواتساب</h3>
            </div>
            <span className="text-xs text-muted-foreground bg-emerald-egypt/10 text-emerald-egypt px-2 py-1 rounded-full">Sandbox Mode</span>
          </div>
          {/* WhatsApp-style bubble */}
          <div className="p-5 bg-[#e5ddd5] dark:bg-[#0b141a]">
            <div className="max-w-sm bg-white dark:bg-[#1e2d35] rounded-2xl rounded-tl-none shadow-md p-4">
              <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed" dir="rtl">
                {preview}
              </pre>
              <div className="text-right text-[10px] text-gray-400 mt-2">
                {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} ✓✓
              </div>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}
