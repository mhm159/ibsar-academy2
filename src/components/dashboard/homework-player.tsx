'use client'

import * as React from 'react'
import { Check, X, Loader2, ChevronLeft, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { notify } from '@/lib/notify'
import type { Question, QuestionType } from './interactive-homework-editor'
import { autoGradeHomework } from './interactive-homework-editor'

const TYPE_LABELS: Record<QuestionType, { label: string; icon: string }> = {
  MCQ: { label: 'اختيار من متعدد', icon: '🔘' },
  TRUE_FALSE: { label: 'صح / خطأ', icon: '✓✗' },
  FILL_BLANK: { label: 'ملء الفراغ', icon: '✏️' },
  ESSAY: { label: 'مقالي', icon: '📝' },
}

interface HomeworkPlayerProps {
  questions: Question[]
  title: string
  description: string
  onSubmit: (answers: Record<string, string>) => Promise<void>
  submitting: boolean
}

/**
 * HomeworkPlayer — interactive homework answering interface for students.
 *
 * Shows questions one by one or all at once, collects answers,
 * and submits them for auto-grading.
 */
export function HomeworkPlayer({ questions, title, description, onSubmit, submitting }: HomeworkPlayerProps) {
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [currentQ, setCurrentQ] = React.useState(0)
  const [showAll, setShowAll] = React.useState(false)

  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length
  const totalQuestions = questions.length
  const progress = Math.round((answeredCount / totalQuestions) * 100)

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !answers[q.id]?.trim())
    if (unanswered.length > 0) {
      if (!(await notify.confirm(`لديك ${unanswered.length} سؤال بدون إجابة. هل تريد التسليم؟`))) return
    }
    await onSubmit(answers)
  }

  const currentQuestion = questions[currentQ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-l from-gold/10 to-azure/10 p-4">
        <h3 className="font-display font-bold text-lg mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">تمت الإجابة: {answeredCount} / {totalQuestions}</span>
          <span className="font-bold">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-gold via-emerald-egypt to-azure rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAll(false)}
          className={cn('text-xs px-3 py-1 rounded-full font-bold', !showAll ? 'bg-gold text-night' : 'bg-muted text-muted-foreground')}
        >
          سؤال بسؤال
        </button>
        <button
          onClick={() => setShowAll(true)}
          className={cn('text-xs px-3 py-1 rounded-full font-bold', showAll ? 'bg-gold text-night' : 'bg-muted text-muted-foreground')}
        >
          عرض الكل
        </button>
      </div>

      {/* Questions */}
      {showAll ? (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              answer={answers[q.id] ?? ''}
              onAnswer={(val) => setAnswer(q.id, val)}
            />
          ))}
        </div>
      ) : (
        <div>
          <QuestionCard
            question={currentQuestion}
            index={currentQ}
            answer={answers[currentQuestion.id] ?? ''}
            onAnswer={(val) => setAnswer(currentQuestion.id, val)}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              disabled={currentQ === 0}
              onClick={() => setCurrentQ((q) => q - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
              السابق
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentQ + 1} / {totalQuestions}
            </span>
            {currentQ < totalQuestions - 1 ? (
              <Button
                onClick={() => setCurrentQ((q) => q + 1)}
                className="gap-1 bg-gradient-to-l from-gold to-[#E8D488] text-night"
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-1.5 bg-gradient-to-l from-emerald-egypt to-[#52B788] text-white"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                تسليم الواجب
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Submit button (show all mode) */}
      {showAll && (
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 gap-2 bg-gradient-to-l from-emerald-egypt to-[#52B788] text-white"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
          تسليم الواجب ({answeredCount}/{totalQuestions} مجاب)
        </Button>
      )}
    </div>
  )
}

// ============================================================
// Single Question Card (for student answering)
// ============================================================

function QuestionCard({
  question,
  index,
  answer,
  onAnswer,
}: {
  question: Question
  index: number
  answer: string
  onAnswer: (value: string) => void
}) {
  const meta = TYPE_LABELS[question.type] ?? TYPE_LABELS.MCQ

  return (
    <Card className="p-5 glass border-gold/15">
      {/* Question header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="h-8 w-8 rounded-full bg-gradient-to-br from-gold to-azure text-white font-bold flex items-center justify-center text-sm shrink-0">
          {index + 1}
        </span>
        <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
          {meta.icon} {meta.label}
        </span>
        <span className="text-xs text-muted-foreground mr-auto">{question.points} نقطة</span>
      </div>

      {/* Question text */}
      <p className="font-bold text-base mb-4">{question.question}</p>

      {/* Answer area by type */}
      {question.type === 'MCQ' && (
        <div className="space-y-2">
          {(question.options ?? []).map((opt, idx) => {
            const isSelected = answer === String(idx)
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onAnswer(String(idx))}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl border-2 p-3 text-right transition-all',
                  isSelected
                    ? 'border-emerald-egypt bg-emerald-egypt/10'
                    : 'border-border hover:border-emerald-egypt/40',
                )}
              >
                <span className={cn(
                  'h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold',
                  isSelected ? 'border-emerald-egypt bg-emerald-egypt text-white' : 'border-muted-foreground/30',
                )}>
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
                <span className="text-sm font-medium">{opt}</span>
              </button>
            )
          })}
        </div>
      )}

      {question.type === 'TRUE_FALSE' && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onAnswer('true')}
            className={cn(
              'rounded-xl border-2 py-4 text-lg font-bold transition-all',
              answer === 'true'
                ? 'border-emerald-egypt bg-emerald-egypt/10 text-emerald-egypt'
                : 'border-border hover:border-emerald-egypt/40',
            )}
          >
            ✓ صح
          </button>
          <button
            type="button"
            onClick={() => onAnswer('false')}
            className={cn(
              'rounded-xl border-2 py-4 text-lg font-bold transition-all',
              answer === 'false'
                ? 'border-destructive bg-destructive/10 text-destructive'
                : 'border-border hover:border-destructive/40',
            )}
          >
            ✗ خطأ
          </button>
        </div>
      )}

      {question.type === 'FILL_BLANK' && (
        <Input
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="اكتب إجابتك هنا..."
          className="h-12 text-base"
          dir="rtl"
        />
      )}

      {question.type === 'ESSAY' && (
        <Textarea
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="اكتب إجابتك بالتفصيل..."
          rows={6}
          className="resize-none text-base"
        />
      )}
    </Card>
  )
}

// ============================================================
// Homework Results (shown after submission + grading)
// ============================================================

export function HomeworkResults({
  questions,
  answers,
  earnedPoints,
  totalPoints,
  fullyGraded,
  results,
}: {
  questions: Question[]
  answers: Record<string, string>
  earnedPoints: number
  totalPoints: number
  fullyGraded: boolean
  results: Array<{ questionId: string; correct: boolean; earned: number; explanation?: string }>
}) {
  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Score header */}
      <Card className={cn(
        'p-6 text-center',
        percentage >= 80 ? 'glass border-emerald-egypt/30' : percentage >= 50 ? 'glass border-gold/30' : 'glass border-destructive/30',
      )}>
        <div className="text-6xl mb-2">
          {percentage >= 90 ? '🌟' : percentage >= 80 ? '⭐' : percentage >= 50 ? '👍' : '💪'}
        </div>
        <p className="text-4xl font-extrabold text-gradient-gold mb-1">{percentage}%</p>
        <p className="text-sm text-muted-foreground">
          {earnedPoints} / {totalPoints} نقطة
        </p>
        {!fullyGraded && (
          <p className="mt-2 text-xs text-gold bg-gold/10 rounded-lg p-2">
            ⚠️ بعض الأسئلة المقالية تحتاج تصحيح يدوي من المعلم
          </p>
        )}
      </Card>

      {/* Per-question results */}
      <div className="space-y-2">
        {questions.map((q, idx) => {
          const result = results.find((r) => r.questionId === q.id)
          const studentAnswer = answers[q.id] ?? ''
          const isCorrect = result?.correct
          const isEssay = q.type === 'ESSAY'

          return (
            <Card key={q.id} className={cn(
              'p-4 glass',
              isEssay ? 'border-gold/20' : isCorrect ? 'border-emerald-egypt/30' : 'border-destructive/30',
            )}>
              <div className="flex items-start gap-3">
                <div className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-white',
                  isEssay ? 'bg-gold' : isCorrect ? 'bg-emerald-egypt' : 'bg-destructive',
                )}>
                  {isEssay ? '📝' : isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm mb-1">سؤال {idx + 1}: {q.question}</p>
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground">
                      إجابتك: <span className="font-bold">{formatAnswer(q, studentAnswer)}</span>
                    </p>
                    {!isEssay && !isCorrect && (
                      <p className="text-emerald-egypt">
                        الإجابة الصحيحة: <span className="font-bold">{formatCorrectAnswer(q)}</span>
                      </p>
                    )}
                    {result?.explanation && (
                      <p className="text-muted-foreground bg-muted/30 rounded p-1.5">
                        💡 {result.explanation}
                      </p>
                    )}
                  </div>
                  <div className="text-xs font-bold mt-1">
                    {result?.earned ?? 0} / {q.points} نقطة
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function formatAnswer(q: Question, answer: string): string {
  if (q.type === 'MCQ') {
    const idx = Number(answer)
    return q.options?.[idx] ?? '—'
  }
  if (q.type === 'TRUE_FALSE') {
    return answer === 'true' ? 'صح' : answer === 'false' ? 'خطأ' : '—'
  }
  return answer || '—'
}

function formatCorrectAnswer(q: Question): string {
  if (q.type === 'MCQ') {
    return q.options?.[q.correctAnswer as number] ?? '—'
  }
  if (q.type === 'TRUE_FALSE') {
    return q.correctAnswer === 'true' ? 'صح' : 'خطأ'
  }
  if (q.type === 'FILL_BLANK') {
    return (q.correctAnswer as string) ?? '—'
  }
  return '—'
}
