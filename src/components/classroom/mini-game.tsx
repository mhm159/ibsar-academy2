'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gamepad2, RefreshCcw, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizQuestion {
  q: string
  options: string[]
  correct: number
  explanation: string
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'ما هي التعليمات التي يفهمها الكمبيوتر مباشرة؟',
    options: ['لغة بايثون', 'الكود الثنائي (0 و1)', 'لغة جافا', 'الكود بالعربية'],
    correct: 1,
    explanation: 'الكمبيوتر يفهم فقط النظام الثنائي (0 و1)، وبقية اللغات تتحول إليه.',
  },
  {
    q: 'ما وظيفة الـ Loop (الحلقة) في البرمجة؟',
    options: ['حذف الأخطاء', 'تكرار تعليمات عدة مرات', 'حفظ الملفات', 'تلوين الشاشة'],
    correct: 1,
    explanation: 'الحلقة تعيد تنفيذ تعليمات معينة عدداً من المرات تلقائياً.',
  },
  {
    q: 'ماذا يفعل الزر الأحمر في الروبوت المتحكم به؟',
    options: ['يشحن البطارية', 'يوقف الروبوت فوراً', 'يرفع السرعة', 'يغير الاتجاه'],
    correct: 1,
    explanation: 'الزر الأحمر عادة زر طوارئ يوقف الروبوت فوراً لتفادي الخطر.',
  },
  {
    q: 'أي مما يلي مثال على متغير (Variable)؟',
    options: ['x = 5', 'print()', 'if', 'return'],
    correct: 0,
    explanation: 'المتغير حاوية تخزن قيمة، مثل x = 5.',
  },
  {
    q: 'ما نوع الذاكرة الذي يحفظ البيانات مؤقتاً أثناء عمل البرنامج؟',
    options: ['القرص الصلب', 'الذاكرة المؤقتة RAM', 'الفلاشة', 'الطابعة'],
    correct: 1,
    explanation: 'الذاكرة المؤقتة RAM تفقد بياناتها عند إيقاف التشغيل.',
  },
  {
    q: 'ما الذي تستخدمه الأسطوانة (Servo Motor) فيه عادة؟',
    options: ['تحريك ذراع الروبوت بدقة', 'عرض الصور', 'تخزين البيانات', 'الإنترنت'],
    correct: 0,
    explanation: 'السيرفو يتحرك بزوايا دقيقة — مثالي لذراع الروبوت.',
  },
  {
    q: 'في لغة Scratch، ماذا تعني كتلة الشرط "إذا كان..."؟',
    options: ['التكرار', 'اتخاذ قرار حسب شرط', 'الحركة للأمام', 'إيقاف البرنامج'],
    correct: 1,
    explanation: 'الكتلة الشرطية تنفذ أمراً معيناً فقط إذا تحقق الشرط.',
  },
  {
    q: 'أي خوارزمية ترتيب تقارن كل عنصرين متجاورين؟',
    options: ['الدمج Merge Sort', 'الفقاعة Bubble Sort', 'الإدراج Insertion Sort', 'التحديد Selection Sort'],
    correct: 1,
    explanation: 'Bubble Sort تقارن وتتبادل العناصر المتجاورة حتى يتم الترتيب.',
  },
]

const PASS_SCORE = 60

interface MiniGameProps {
  sessionId: string
  isTeacher: boolean
}

export function MiniGame({ sessionId, isTeacher }: MiniGameProps) {
  const questions = useMemo(() => {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 6)
  }, [])

  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [awarding, setAwarding] = useState(false)
  const [awarded, setAwarded] = useState(false)

  const current = questions[index]
  const answered = selected !== null
  const correctAnswer = current?.correct ?? -1

  const reset = () => {
    setStarted(true)
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
    setAwarded(false)
  }

  const pick = (i: number) => {
    if (answered) return
    setSelected(i)
    if (i === correctAnswer) setScore((s) => s + 1)
  }

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1)
      setSelected(null)
    } else {
      const percent = Math.round((score / questions.length) * 100)
      setFinished(true)
      if (!isTeacher && percent >= PASS_SCORE) {
        submitPoints()
      }
    }
  }

  const submitPoints = async () => {
    setAwarding(true)
    try {
      const res = await fetch('/api/classroom/game-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, score: Math.round((score / questions.length) * 100) }),
      })
      const d = await res.json()
      if (d.ok && d.awarded) setAwarded(true)
    } catch {
      // silently ignore — points are a bonus, not blocking
    } finally {
      setAwarding(false)
    }
  }

  const percent = questions.length ? Math.round((score / questions.length) * 100) : 0

  return (
    <div className="h-full overflow-y-auto p-4">
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="h-full flex flex-col items-center justify-center text-center gap-4"
          >
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-fuchsia-500/30 to-azure/30 flex items-center justify-center">
              <Gamepad2 className="h-10 w-10 text-gold" />
            </div>
            <div>
              <h3 className="text-xl font-black">🎮 لعبة سريعة</h3>
              <p className="text-sm text-white/60 mt-1 max-w-xs">
                اختبر معلوماتك في البرمجة والروبوتيكس. اجمع {PASS_SCORE}٪ أو أكثر لتربح نقاطاً إضافية!
              </p>
            </div>
            <button
              onClick={() => setStarted(true)}
              className="h-12 px-8 rounded-2xl font-black text-night bg-gradient-to-l from-gold to-amber-400 hover:opacity-90 transition-opacity"
            >
              ابدأ اللعب
            </button>
          </motion.div>
        ) : !finished ? (
          <motion.div
            key={`q${index}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            className="space-y-4"
          >
            {/* Progress */}
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>سؤال {index + 1} من {questions.length}</span>
              <span>النتيجة: {score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-l from-gold to-amber-400"
                animate={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }}
              />
            </div>

            <h4 className="text-base font-bold leading-relaxed min-h-[3rem]">{current.q}</h4>

            <div className="grid gap-2">
              {current.options.map((opt, i) => {
                const isCorrect = answered && i === correctAnswer
                const isWrongPick = answered && i === selected && i !== correctAnswer
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={answered}
                    className={cn(
                      'w-full text-right px-4 py-3 rounded-xl border text-sm transition-all',
                      'border-white/10 bg-white/5 hover:bg-white/10 disabled:cursor-default',
                      isCorrect && 'border-emerald-500 bg-emerald-500/15 text-emerald-300',
                      isWrongPick && 'border-destructive bg-destructive/15 text-red-300',
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-white/50 text-xs font-bold">{String.fromCharCode(97 + i)})</span>
                      {opt}
                      {isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400 mr-auto" />}
                      {isWrongPick && <XCircle className="h-4 w-4 text-red-400 mr-auto" />}
                    </span>
                  </button>
                )
              })}
            </div>

            <AnimatePresence>
              {answered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white/70 leading-relaxed">
                    <span className="font-bold text-gold">💡</span> {current.explanation}
                  </div>
                  <button
                    onClick={next}
                    className="mt-3 w-full h-11 rounded-xl font-bold text-white bg-gradient-to-l from-emerald-egypt to-[#52B788] hover:opacity-90 transition-opacity"
                  >
                    {index + 1 === questions.length ? 'عرض النتيجة 🏁' : 'التالي ←'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="end"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center text-center gap-4"
          >
            <div
              className="h-28 w-28 rounded-full flex items-center justify-center border-4"
              style={{
                borderColor: percent >= PASS_SCORE ? 'var(--emerald-egypt)' : 'var(--destructive)',
                background: `color-mix(in srgb, ${percent >= PASS_SCORE ? 'var(--emerald-egypt)' : 'var(--destructive)'} 12%, transparent)`,
              }}
            >
              <div>
                <div className="text-3xl font-black">{percent}٪</div>
                <div className="text-[11px] text-white/60">{score}/{questions.length}</div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black">
                {percent >= PASS_SCORE ? '🎉 ممتاز! أحسنت' : '💪 حاول مرة أخرى'}
              </h3>
              <p className="text-sm text-white/60 mt-1 max-w-xs">
                {percent >= PASS_SCORE
                  ? 'أنهيت اللعبة بنجاح وكسبت نقاطاً إضافية.'
                  : 'تحتاج ' + PASS_SCORE + '٪ على الأقل لنقاط إضافية. لا تستسلم!'}
              </p>
            </div>

            {awarding && (
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <Loader2 className="h-4 w-4 animate-spin" /> جارٍ إضافة النقاط...
              </div>
            )}
            {awarded && (
              <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 text-sm text-emerald-300 font-bold">
                +20 نقطة أُضيفت إلى رصيدك 🎉
              </div>
            )}

            <button
              onClick={reset}
              className="h-11 px-6 rounded-xl font-bold text-white bg-white/10 border border-white/10 hover:bg-white/15 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" /> العب مرة أخرى
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
