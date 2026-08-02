'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  X,
  Check,
  Send,
  Sparkles,
  BookOpenText,
  CreditCard,
  Lightbulb,
  FileText,
} from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { notify } from '@/lib/notify'

interface Post {
  id: string
  title: string
  content: string
  type: string
  emoji: string
  category: string | null
  status: string
  source: string
  publishedAt: string | null
  createdAt: string
}

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  STORY: { label: 'قصة', icon: BookOpenText, color: 'var(--kids-purple)' },
  CARD: { label: 'بطاقة', icon: CreditCard, color: 'var(--azure)' },
  TIPS: { label: 'نصائح', icon: Lightbulb, color: 'var(--gold)' },
}

const AI_TEMPLATES = [
  {
    title: 'لماذا يتعلم طفلك البرمجة قبل سن المراهقة؟',
    type: 'CARD',
    emoji: '💻',
    category: 'PROGRAMMING',
    content:
      'البرمجة ليست مجرد مهارة تقنية، بل طريقة تفكير تعلّم الطفل حل المشكلات وتقسيم الأفكار الكبيرة إلى خطوات صغيرة.\n\nفي منصة منهل نبدأ من اللعب والقصص لنبني معاً عقلية المبرمج الصغير — خطوة بخطوة وبتشجيع مستمر.\n\n🎯 ابدأ رحلة طفلك الآن!',
  },
  {
    title: 'رحلة يوسف مع الروبوت الذكي',
    type: 'STORY',
    emoji: '🤖',
    category: 'ROBOTICS',
    content:
      'كان يوسف (9 سنوات) يخاف من فكرة أن الروبوتات قد تحل محل أصدقائه... حتى بنى أول روبوت له في حصتنا!\n\nتعلم كيف يقسم المشكلة، يجرب، يفشل، ثم يعيد المحاولة حتى نجح الروبوت في عبور المتاهة.\n\nالقصة الحقيقية أن يوسف لم يتعلم الهندسة فقط، بل تعلم أن الفشل هو خطوة نحو النجاح. 🌟',
  },
  {
    title: '3 ألعاب تنمّي الحساب الذهني في البيت',
    type: 'TIPS',
    emoji: '🧮',
    category: 'MENTAL_MATH',
    content:
      '١) لعبة التسوق: اطلب من طفلك حساب فاتورة بسيطة ذهنياً قبل الدفع.\n٢) لعبة الأرقام المعلقة: اكتب أرقاماً على بطاقات واطلب ترتيبها من الأصغر للأكبر بسرعة.\n٣) تحدي العد التنازلي: ابدأ من ١٠٠ وعدّ تنازلياً بخطوات متفاوتة.\n\n٥ دقائق يومياً كافية لنمو سرعة التركيز والحساب!',
  },
  {
    title: 'قصة ليلى: أول سطر برمجي في حياتها',
    type: 'STORY',
    emoji: '🌟',
    category: 'PROGRAMMING',
    content:
      'في أول حصة، جلست ليلى (11 سنة) صامتة خجولة.\n\nبعد 10 دقائق من بناء أول شخصية متحركة، تغيّر كل شيء — ابتسامة لا تُنسى وسؤال واحد: «هل أستطيع جعلها تطير؟»\n\nهذا هو سحر التعليم الممتع: عندما يتحول الفضول إلى إنجاز. ✨',
  },
  {
    title: 'كيف تحوّل وقت الشاشة إلى وقت تعلم؟',
    type: 'CARD',
    emoji: '📱',
    category: 'GENERAL',
    content:
      'لا يجب أن تكون الشاشات عدوّاً للأطفال!\n\nاختار مع طفلك نشاطاً تعليمياً تفاعلياً واحداً يومياً، واجعل له هدفاً بسيطاً وواضحاً، ثم كافئه على الإنجاز.\n\nفي منصة منهل نجعل وقت الشاشة منتجاً وممتعاً في نفس الوقت. 💛',
  },
  {
    title: 'الحساب الذهني: رياضة للدماغ وليست مادة دراسية',
    type: 'TIPS',
    emoji: '🧠',
    category: 'MENTAL_MATH',
    content:
      'تماماً كما يحتاج الجسم للرياضة، يحتاج دماغ الطفل للتدريب اليومي.\n\nالمعداد ينشط الذاكرة البصرية والتخيل المكاني، ويزيد التركيز بسرعة مدهشة.\n\nجرب 5 دقائق يومياً لمدة أسبوع ولاحظ الفرق! 🧮',
  },
]

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

export default function AdminPostsPage() {
  return (
    <DashboardShell role="ADMIN">
      <PostsManager />
    </DashboardShell>
  )
}

function PostsManager() {
  const [posts, setPosts] = useState<Post[]>([])
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Post | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    fetch('/api/admin/posts')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setPosts(d.posts ?? [])
          setSummary(d.summary ?? {})
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (p: Post, status: string) => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, status }),
      })
      const data = await res.json()
      if (!res.ok) {
        notify.error(data.error || 'فشل التحديث')
        return
      }
      notify.success(status === 'PUBLISHED' ? 'تم النشر' : 'تم إرجاعه للمسودات')
      load()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (p: Post) => {
    const ok = await notify.confirm(`حذف منشور «${p.title}» نهائياً؟`, { title: 'تأكيد', danger: true })
    if (!ok) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/posts?id=${p.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        notify.error(data.error || 'فشل الحذف')
        return
      }
      notify.success('تم حذف المنشور')
      load()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="منشورات AI" description="قصص وبطاقات ومحتوى منشور على الموقع" />
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="منشورات AI"
        description="أنشئ قصصاً وبطاقات ورسائل تلهم الأهالي — تُعرض على الموقع والمنصات الاجتماعية"
        action={
          <Button className="gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            منشور جديد
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard icon={FileText} label="إجمالي المنشورات" value={summary.total ?? 0} color="var(--azure)" />
        <StatCard icon={Send} label="منشورة" value={summary.published ?? 0} color="var(--emerald-egypt)" />
        <StatCard icon={X} label="مسودات" value={summary.drafts ?? 0} color="var(--gold)" />
        <StatCard icon={BookOpenText} label="قصص" value={summary.stories ?? 0} color="var(--kids-purple)" />
        <StatCard icon={CreditCard} label="بطاقات" value={summary.cards ?? 0} color="var(--kids-teal)" />
      </div>

      {posts.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState
            icon={Sparkles}
            title="لا توجد منشورات بعد"
            description="أنشئ أول منشور، أو استخدم زر «اقتراح AI» لتوليد نص جاهز"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const meta = TYPE_META[p.type] ?? { label: p.type, icon: FileText, color: 'var(--muted-foreground)' }
            return (
              <Card key={p.id} className="glass border-gold/15 p-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: `color-mix(in srgb, ${meta.color} 12%, transparent)` }}
                  >
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold">{p.title}</h3>
                      <StatusBadge status={p.status} label={p.status === 'PUBLISHED' ? 'منشور' : 'مسودة'} />
                      <span
                        className="text-[0.65rem] px-2 py-0.5 rounded-full font-bold"
                        style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 12%, transparent)` }}
                      >
                        {meta.label}
                      </span>
                      {p.category && (
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-muted/50 font-bold text-muted-foreground">
                          {p.category}
                        </span>
                      )}
                      {p.source === 'AI_SUGGESTED' && (
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-kids-purple/15 text-kids-purple font-bold inline-flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/85 mt-1.5 whitespace-pre-line line-clamp-3">{p.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      أُنشئ {fmtDate(p.createdAt)}
                      {p.publishedAt ? ` · نُشر ${fmtDate(p.publishedAt)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {p.status === 'DRAFT' ? (
                      <Button size="sm" variant="ghost" className="h-8 gap-1 text-emerald-egypt" onClick={() => setStatus(p, 'PUBLISHED')} disabled={busy}>
                        <Send className="h-3.5 w-3.5" />
                        نشر
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-8 gap-1 text-gold" onClick={() => setStatus(p, 'DRAFT')} disabled={busy}>
                        <X className="h-3.5 w-3.5" />
                        إيقاف
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(p)} aria-label="تعديل">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(p)} disabled={busy} aria-label="حذف">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {(showCreate || editing) && (
        <PostForm
          post={editing}
          onDone={() => {
            setShowCreate(false)
            setEditing(null)
            load()
          }}
          onClose={() => {
            setShowCreate(false)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function PostForm({
  post,
  onDone,
  onClose,
}: {
  post: Post | null
  onDone: () => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(post?.title ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [type, setType] = useState(post?.type ?? 'CARD')
  const [emoji, setEmoji] = useState(post?.emoji ?? '✨')
  const [category, setCategory] = useState(post?.category ?? '')
  const [status, setStatus] = useState(post?.status ?? 'DRAFT')
  const [saving, setSaving] = useState(false)
  const [aiIndex, setAiIndex] = useState(0)

  const suggestAi = () => {
    const t = AI_TEMPLATES[aiIndex % AI_TEMPLATES.length]
    setTitle(t.title)
    setContent(t.content)
    setType(t.type)
    setEmoji(t.emoji)
    setCategory(t.category)
    setAiIndex((i) => i + 1)
  }

  const save = async () => {
    if (!title.trim() || !content.trim()) {
      notify.error('أكمل العنوان والمحتوى')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title,
        content,
        type,
        emoji,
        category: category || null,
        status,
        source: post?.source ?? 'MANUAL',
      }
      const res = await fetch('/api/admin/posts', {
        method: post ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post ? { id: post.id, ...payload } : payload),
      })
      const data = await res.json()
      if (!res.ok) {
        notify.error(data.error || 'فشل الحفظ')
        return
      }
      notify.success(post ? 'تم تحديث المنشور' : 'تم إنشاء المنشور')
      onDone()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? `تعديل منشور` : 'منشور جديد'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <Button
            variant="outline"
            onClick={suggestAi}
            className="w-full gap-2 glass border-kids-purple/30 text-kids-purple hover:bg-kids-purple/10"
          >
            <Sparkles className="h-4 w-4" />
            اقتراح نص من AI
          </Button>

          <div className="space-y-1.5">
            <Label>العنوان *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: رحلة يوسف مع الروبوت الذكي" />
          </div>

          <div className="space-y-1.5">
            <Label>المحتوى *</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="اكتب نص المنشور..." />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>النوع</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="CARD">بطاقة</option>
                <option value="STORY">قصة</option>
                <option value="TIPS">نصائح</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>الرمز التعبيري</Label>
              <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="✨" />
            </div>
            <div className="space-y-1.5">
              <Label>التصنيف</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">عام</option>
                <option value="PROGRAMMING">البرمجة</option>
                <option value="ROBOTICS">الروبوتيكس</option>
                <option value="MENTAL_MATH">الحساب الذهني</option>
                <option value="AI">الذكاء الاصطناعي</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>الحالة</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('DRAFT')}
                className={`flex-1 rounded-xl border-2 p-2 text-sm transition-all ${
                  status === 'DRAFT' ? 'border-gold bg-gold/10 font-bold' : 'border-border bg-card'
                }`}
              >
                مسودة
              </button>
              <button
                type="button"
                onClick={() => setStatus('PUBLISHED')}
                className={`flex-1 rounded-xl border-2 p-2 text-sm transition-all ${
                  status === 'PUBLISHED' ? 'border-emerald-egypt bg-emerald-egypt/10 font-bold' : 'border-border bg-card'
                }`}
              >
                نشر فوراً
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={saving} className="gap-2 flex-1 bg-gradient-to-l from-gold to-[#E8D488] text-night">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              حفظ
            </Button>
            <Button variant="outline" onClick={onClose} className="gap-1.5 glass">
              <X className="h-4 w-4" />
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
