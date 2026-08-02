'use client'

import { useEffect, useState } from 'react'
import {
  Copy,
  Check,
  ExternalLink,
  Rocket,
  BookOpen,
  RefreshCw,
  Send,
  ChevronDown,
  ChevronUp,
  MonitorPlay,
  Download,
} from 'lucide-react'
import { notify } from '@/lib/notify'
import {
  CLASSROOM_PLATFORMS,
  getClassroomPlatform,
  type ClassroomPlatform,
} from '@/lib/classroom-platforms'
import { cn } from '@/lib/utils'

interface PlatformPanelProps {
  sessionId: string
  isTeacher: boolean
  /** Realtime broadcast platform url (students receive, teacher keeps local) */
  platformUrl: string | null
  /** Realtime broadcast lesson content */
  lessonContent: string
  /** Teacher: broadcast the platform to students */
  onPlatformSelect: (url: string) => void
  /** Teacher: broadcast lesson content to students */
  onLessonUpdate: (content: string) => void
}

function matchFromUrl(url: string | null): ClassroomPlatform | undefined {
  if (!url) return undefined
  return CLASSROOM_PLATFORMS.find((p) => p.embedUrl === url || p.url === url)
}

export function PlatformPanel({
  sessionId,
  isTeacher,
  platformUrl,
  lessonContent,
  onPlatformSelect,
  onLessonUpdate,
}: PlatformPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [localLesson, setLocalLesson] = useState<string>('')
  const [fetchedLesson, setFetchedLesson] = useState<string>('')
  const [lessonOpen, setLessonOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Teacher: local selection. Student: derived from broadcast url
  const teacherSel = isTeacher && selectedId ? (getClassroomPlatform(selectedId) ?? null) : null
  const studentPlat = !isTeacher ? matchFromUrl(platformUrl) : null
  const active = isTeacher ? teacherSel : studentPlat

  const activeUrl = active ? active.embedUrl || active.url : null

  // Load saved lesson content on mount (both roles; only teacher can edit)
  useEffect(() => {
    fetch(`/api/classroom/lesson?session=${sessionId}`, { credentials: 'same-origin' })
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Failed to fetch lesson')
        return d
      })
      .then((d) => {
        setFetchedLesson(d.content ?? '')
        if (isTeacher && !localLesson && d.content) setLocalLesson(d.content)
      })
      .catch((err) => notify.error(err.message))
  }, [sessionId])

  const handleSelect = (p: ClassroomPlatform) => {
    if (!isTeacher) return
    setSelectedId(p.id)
    const url = p.embedUrl || p.url
    onPlatformSelect(url)
    notify.success(`تم عرض ${p.nameAr} للطلاب`)
  }

  const rebroadcast = () => {
    if (!isTeacher || !activeUrl) return
    onPlatformSelect(activeUrl)
    notify.success('تم تحديث المنصة على شاشات الطلاب')
  }

  const copyActiveUrl = async () => {
    if (!activeUrl) return
    await navigator.clipboard.writeText(activeUrl)
    setCopied(true)
    notify.success('تم نسخ الرابط!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePublishLesson = () => {
    if (!isTeacher) return
    onLessonUpdate(localLesson)
    fetch('/api/classroom/lesson', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, content: localLesson }),
    })
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'فشل حفظ الدرس')
        return d
      })
      .then(() => notify.success('تم نشر الدرس للطلاب وحفظه'))
      .catch((err) => notify.error(err.message))
  }

  const displayedLesson = isTeacher ? localLesson : lessonContent || fetchedLesson

  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border-b border-white/10 flex-wrap">
        <Rocket className="w-4 h-4 text-gold" />
        <span className="text-xs font-bold text-white/80">منصات البرمجة التعليمية</span>
        <span className="text-[10px] text-white/40 hidden sm:inline">
          اختر منصة وسيظهر الطلاب عليها مباشرة
        </span>
        <div className="flex-1" />
        {activeUrl && (
          <button
            onClick={copyActiveUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all"
            title="نسخ رابط المنصة"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-egypt" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'تم النسخ' : 'نسخ الرابط'}
          </button>
        )}
        {isTeacher && activeUrl && (
          <button
            onClick={rebroadcast}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-azure/20 border border-azure/30 text-azure hover:bg-azure/30 transition-all"
            title="إعادة البث للطلاب"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            بث الآن
          </button>
        )}
        <button
          onClick={() => setLessonOpen((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
            lessonOpen
              ? 'bg-gold/20 border-gold/30 text-gold'
              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10',
          )}
          title="عرض الدرس"
        >
          <BookOpen className="w-3.5 h-3.5" />
          الدرس
          {lessonOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* ── Lesson drawer ── */}
      {lessonOpen && (
        <div className="border-b border-white/10 bg-[#0a0c10] px-3 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs text-white/70 font-bold">📖 ملاحظات الدرس</span>
          </div>
          {isTeacher ? (
            <div className="flex gap-2 items-end">
              <textarea
                value={localLesson}
                onChange={(e) => setLocalLesson(e.target.value)}
                placeholder="اكتب موضوع الدرس، الأهداف، المطلوب من الطالب تنفيذه..."
                dir="rtl"
                className="flex-1 resize-none bg-[#161b22] border border-white/10 rounded-lg p-3 text-xs text-white/90 leading-6 outline-none placeholder:text-white/30 min-h-[70px] max-h-[140px]"
              />
              <button
                onClick={handlePublishLesson}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-egypt text-white hover:bg-emerald-egypt/90 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                نشر للطلاب
              </button>
            </div>
          ) : (
            <div className="bg-[#161b22] border border-white/10 rounded-lg p-3 text-xs text-white/80 leading-6 whitespace-pre-wrap min-h-[60px]">
              {displayedLesson ? (
                displayedLesson
              ) : (
                <span className="text-white/30 italic">لم يشارك المعلم ملاحظات الدرس بعد...</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Platform selector (horizontal scroll) ── */}
      <div className="flex gap-2 px-3 py-2.5 border-b border-white/10 overflow-x-auto shrink-0">
        {CLASSROOM_PLATFORMS.map((p) => {
          const isActive = isTeacher ? selectedId === p.id : studentPlat?.id === p.id
          return (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              disabled={!isTeacher}
              className={cn(
                'group flex flex-col items-center gap-1 px-3.5 py-2 rounded-xl border transition-all shrink-0 min-w-[92px]',
                isActive
                  ? 'bg-gradient-to-br border-white/30 shadow-lg shadow-gold/10 ' + p.color
                  : 'bg-white/5 border-white/10 hover:bg-white/10',
                !isTeacher && 'cursor-default opacity-90',
              )}
              title={`${p.nameAr} (${p.ageGroup}) — ${p.desc}`}
            >
              <span className="text-2xl leading-none drop-shadow">{p.icon}</span>
              <span className={cn('text-[11px] font-bold', isActive ? 'text-white' : 'text-white/70')}>
                {p.nameAr}
              </span>
              <span className={cn('text-[9px]', isActive ? 'text-white/80' : 'text-white/30')}>
                {isTeacher ? (p.kind === 'iframe' ? '● متاح مباشرة' : '○ فتح خارجي') : p.ageGroup}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Display area ── */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#0a0c10]">
        {active && active.kind === 'iframe' && active.embedUrl ? (
          <>
            <div className="flex-1 min-h-0">
              <iframe
                key={activeUrl}
                src={activeUrl!}
                title={active.nameAr}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-presentation"
                loading="lazy"
                allow="clipboard-write; fullscreen; microphone; camera"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 border-t border-white/10 bg-[#161b22] flex-wrap">
              <MonitorPlay className="w-3.5 h-3.5 text-emerald-egypt" />
              <span className="text-[11px] text-white/50 flex-1 min-w-0 truncate" dir="ltr">
                {activeUrl}
              </span>
              <span className="text-[10px] text-white/35 hidden sm:inline">
                {isTeacher ? 'تظهر هذه المنصة الآن على شاشات الطلاب' : 'المنصة التي اختارها معلمك'}
              </span>
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-azure/25 text-azure hover:bg-azure/40 transition-all shrink-0"
                title="بعض المنصات تمنع العرض داخل الإطار — استخدم هذه إن لم تظهر المنصة"
              >
                <ExternalLink className="w-3 h-3" />
                فتح في نافذة جديدة
              </a>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 border-t border-white/5 bg-[#0a0c10]">
              <span className="text-[10px] text-white/40">
                💡 إذا لم تظهر المنصة في المعاينة (بعض المنصات تمنع العرض داخل الإطار) اضغط «فتح في نافذة جديدة» بالأسفل.
              </span>
            </div>
          </>
        ) : active ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-sm w-full text-center">
              <div className={cn('w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br flex items-center justify-center text-4xl shadow-xl', active.color)}>
                {active.icon}
              </div>
              <h3 className="font-display font-bold text-lg text-white">{active.nameAr} {active.name}</h3>
              <p className="text-xs text-white/60 mt-1 leading-5">{active.desc}</p>
              <p className="text-[11px] text-white/40 mt-1">الفئة العمرية: {active.ageGroup}</p>
              <div className="flex flex-col gap-2 mt-5">
                <a
                  href={active.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-l from-gold to-[#E8D488] text-night hover:opacity-90 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  فتح المنصة
                </a>
                {active.kind === 'app' && (
                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-white/50">
                    <Download className="w-3.5 h-3.5" />
                    يُنصح بتحميل التطبيق على جهاز التابلت قبل الحصة
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Rocket className="w-12 h-12 text-white/10" />
            {isTeacher ? (
              <>
                <p className="text-sm text-white/50 font-bold">اختر منصة من الشريط بالأعلى</p>
                <p className="text-xs text-white/30 max-w-xs">
                  سيتغير محتوى شاشة الطالب تلقائياً بمجرد اختيارك، أو انسخ الرابط وأرسله في المحادثة
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-white/50 font-bold">بانتظار المعلم...</p>
                <p className="text-xs text-white/30 max-w-xs">
                  سيُعرض عليك هنا المنصة التي يحددها معلمك داخل الحصة. يمكنك أيضاً فتح المنصة في نافذة
                  مستقلة عند الطلب.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
