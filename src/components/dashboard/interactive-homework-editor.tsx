'use client'

import * as React from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ============================================================
// Types
// ============================================================

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK' | 'ESSAY'

export interface Question {
  id: string
  type: QuestionType
  question: string
  // MCQ options
  options?: string[]
  // correct answer index (MCQ), 'true'/'false' (TRUE_FALSE), text (FILL_BLANK)
  correctAnswer?: string | number
  // for ESSAY: model answer (guidance for teacher)
  modelAnswer?: string
  points: number
  explanation?: string
}

export interface InteractiveHomework {
  questions: Question[]
}

// ============================================================
// Question type labels
// ============================================================

const TYPE_LABELS: Record<QuestionType, { label: string; icon: string; color: string; autoGrade: boolean }> = {
  MCQ: { label: 'اختيار من متعدد', icon: '🔘', color: 'var(--azure)', autoGrade: true },
  TRUE_FALSE: { label: 'صح / خطأ', icon: '✓✗', color: 'var(--emerald-egypt)', autoGrade: true },
  FILL_BLANK: { label: 'ملء الفراغ', icon: '✏️', color: 'var(--gold)', autoGrade: true },
  ESSAY: { label: 'مقالي', icon: '📝', color: 'var(--kids-red)', autoGrade: false },
}

// ============================================================
// InteractiveHomeworkEditor — for teachers to build interactive homework
// ============================================================

interface EditorProps {
  value: InteractiveHomework
  onChange: (value: InteractiveHomework) => void
}

export function InteractiveHomeworkEditor({ value, onChange }: EditorProps) {
  const { questions } = value

  const addQuestion = (type: QuestionType) => {
    const newQ: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      question: '',
      points: type === 'ESSAY' ? 20 : 10,
      ...(type === 'MCQ' ? { options: ['', '', '', ''], correctAnswer: 0 } : {}),
      ...(type === 'TRUE_FALSE' ? { correctAnswer: 'true' } : {}),
      ...(type === 'FILL_BLANK' ? { correctAnswer: '' } : {}),
      ...(type === 'ESSAY' ? { modelAnswer: '' } : {}),
    }
    onChange({ questions: [...questions, newQ] })
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onChange({
      questions: questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    })
  }

  const removeQuestion = (id: string) => {
    onChange({ questions: questions.filter((q) => q.id !== id) })
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQs = [...questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newQs.length) return
    ;[newQs[index], newQs[targetIndex]] = [newQs[targetIndex], newQs[index]]
    onChange({ questions: newQs })
  }

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)
  const autoGradeable = questions.every((q) => TYPE_LABELS[q.type].autoGrade)

  return (
    <div className="space-y-4">
      {/* Add question buttons */}
      <div>
        <Label className="mb-2 block">إضافة سؤال:</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(TYPE_LABELS) as QuestionType[]).map((type) => {
            const meta = TYPE_LABELS[type]
            return (
              <button
                key={type}
                type="button"
                onClick={() => addQuestion(type)}
                className="flex items-center gap-2 rounded-xl border border-border p-2.5 text-sm font-bold transition-all hover:border-gold/40 hover:bg-gold/5"
              >
                <span className="text-lg">{meta.icon}</span>
                <span className="text-xs">{meta.label}</span>
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Questions list */}
      {questions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            لم تضف أي أسئلة بعد. اختر نوع السؤال من الأعلى للبدء.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, index) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={index}
              total={questions.length}
              onChange={(updates) => updateQuestion(q.id, updates)}
              onRemove={() => removeQuestion(q.id)}
              onMove={(dir) => moveQuestion(index, dir)}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {questions.length > 0 && (
        <Card className="p-3 glass border-gold/15 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-bold">📊 {questions.length} سؤال</span>
            <span className="font-bold">⭐ {totalPoints} نقطة</span>
            <span className={cn('font-bold', autoGradeable ? 'text-emerald-egypt' : 'text-gold')}>
              {autoGradeable ? '✅ تصحيح تلقائي' : '⚠️ يحتاج تصحيح يدوي'}
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// Single Question Editor
// ============================================================

function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  question: Question
  index: number
  total: number
  onChange: (updates: Partial<Question>) => void
  onRemove: () => void
  onMove: (dir: 'up' | 'down') => void
}) {
  const meta = TYPE_LABELS[question.type]

  return (
    <Card className="p-4 glass border-gold/15">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-muted-foreground">سؤال {index + 1}</span>
        <span
          className="text-[0.65rem] px-2 py-0.5 rounded-full font-bold"
          style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 12%, transparent)` }}
        >
          {meta.icon} {meta.label}
        </span>
        <div className="flex-1" />
        <button type="button" onClick={() => onMove('up')} disabled={index === 0} className="p-1 hover:bg-muted rounded disabled:opacity-30">
          <ChevronUp className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onMove('down')} disabled={index === total - 1} className="p-1 hover:bg-muted rounded disabled:opacity-30">
          <ChevronDown className="h-4 w-4" />
        </button>
        <button type="button" onClick={onRemove} className="p-1 hover:bg-destructive/10 rounded text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Question text */}
      <div className="space-y-2 mb-3">
        <Input
          value={question.question}
          onChange={(e) => onChange({ question: e.target.value })}
          placeholder="اكتب نص السؤال هنا..."
          className="h-11 font-bold"
        />
      </div>

      {/* Type-specific editor */}
      {question.type === 'MCQ' && (
        <MCQEditor question={question} onChange={onChange} />
      )}
      {question.type === 'TRUE_FALSE' && (
        <TrueFalseEditor question={question} onChange={onChange} />
      )}
      {question.type === 'FILL_BLANK' && (
        <FillBlankEditor question={question} onChange={onChange} />
      )}
      {question.type === 'ESSAY' && (
        <EssayEditor question={question} onChange={onChange} />
      )}

      {/* Points + explanation */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/50">
        <div className="space-y-1">
          <Label className="text-xs">النقاط</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={question.points}
            onChange={(e) => onChange({ points: parseInt(e.target.value, 10) || 1 })}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">شرح الإجابة (اختياري)</Label>
          <Input
            value={question.explanation ?? ''}
            onChange={(e) => onChange({ explanation: e.target.value })}
            placeholder="يُظهر للطالب بعد التصحيح"
            className="h-9"
          />
        </div>
      </div>
    </Card>
  )
}

// ============================================================
// MCQ Editor
// ============================================================

function MCQEditor({ question, onChange }: { question: Question; onChange: (u: Partial<Question>) => void }) {
  const options = question.options ?? ['', '', '', '']

  const updateOption = (idx: number, value: string) => {
    const newOptions = [...options]
    newOptions[idx] = value
    onChange({ options: newOptions })
  }

  const addOption = () => {
    onChange({ options: [...options, ''] })
  }

  const removeOption = (idx: number) => {
    if (options.length <= 2) return
    const newOptions = options.filter((_, i) => i !== idx)
    let correct = question.correctAnswer as number
    if (correct === idx) correct = 0
    else if (correct > idx) correct--
    onChange({ options: newOptions, correctAnswer: correct })
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">الاختيارات (اضغط على ✓ لتحديد الإجابة الصحيحة):</Label>
      {options.map((opt, idx) => {
        const isCorrect = question.correctAnswer === idx
        return (
          <div key={idx} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ correctAnswer: idx })}
              className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all',
                isCorrect ? 'bg-emerald-egypt text-white' : 'bg-muted text-muted-foreground hover:bg-emerald-egypt/20',
              )}
            >
              {isCorrect ? <Check className="h-4 w-4" /> : String.fromCharCode(1571 + idx)}
            </button>
            <Input
              value={opt}
              onChange={(e) => updateOption(idx, e.target.value)}
              placeholder={`الاختيار ${idx + 1}`}
              className="h-9"
            />
            {options.length > 2 && (
              <button type="button" onClick={() => removeOption(idx)} className="p-1 hover:bg-destructive/10 rounded text-destructive shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )
      })}
      {options.length < 6 && (
        <button type="button" onClick={addOption} className="text-xs text-azure hover:underline">
          + إضافة اختيار
        </button>
      )}
    </div>
  )
}

// ============================================================
// True/False Editor
// ============================================================

function TrueFalseEditor({ question, onChange }: { question: Question; onChange: (u: Partial<Question>) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">الإجابة الصحيحة:</Label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange({ correctAnswer: 'true' })}
          className={cn(
            'rounded-xl border-2 py-2.5 text-sm font-bold transition-all',
            question.correctAnswer === 'true'
              ? 'border-emerald-egypt bg-emerald-egypt/10 text-emerald-egypt'
              : 'border-border hover:border-emerald-egypt/40',
          )}
        >
          ✓ صح
        </button>
        <button
          type="button"
          onClick={() => onChange({ correctAnswer: 'false' })}
          className={cn(
            'rounded-xl border-2 py-2.5 text-sm font-bold transition-all',
            question.correctAnswer === 'false'
              ? 'border-destructive bg-destructive/10 text-destructive'
              : 'border-border hover:border-destructive/40',
          )}
        >
          ✗ خطأ
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Fill Blank Editor
// ============================================================

function FillBlankEditor({ question, onChange }: { question: Question; onChange: (u: Partial<Question>) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">الإجابة الصحيحة (اكتب الإجابة الدقيقة المتوقعة):</Label>
      <Input
        value={(question.correctAnswer as string) ?? ''}
        onChange={(e) => onChange({ correctAnswer: e.target.value })}
        placeholder="الإجابة المتوقعة..."
        className="h-10"
      />
      <p className="text-xs text-muted-foreground">
        💡 سيتم مقارنة إجابة الطالب بهذه الإجابة (غير حساسة لحالة الأحرف والمسافات)
      </p>
    </div>
  )
}

// ============================================================
// Essay Editor
// ============================================================

function EssayEditor({ question, onChange }: { question: Question; onChange: (u: Partial<Question>) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">الإجابة النموذجية (إرشاد للتصحيح اليدوي):</Label>
      <Textarea
        value={question.modelAnswer ?? ''}
        onChange={(e) => onChange({ modelAnswer: e.target.value })}
        placeholder="اكتب الإجابة النموذجية أو معايير التصحيح..."
        rows={3}
        className="resize-none"
      />
      <p className="text-xs text-muted-foreground">
        ⚠️ الأسئلة المقالية تحتاج تصحيح يدوي من المعلم
      </p>
    </div>
  )
}

// ============================================================
// Auto-grading function (used by API)
// ============================================================

export function autoGradeHomework(questions: Question[], answers: Record<string, string>): {
  earnedPoints: number
  totalPoints: number
  fullyGraded: boolean
  results: Array<{ questionId: string; correct: boolean; earned: number; explanation?: string }>
} {
  let earnedPoints = 0
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)
  const results: Array<{ questionId: string; correct: boolean; earned: number; explanation?: string }> = []
  let fullyGraded = true

  for (const q of questions) {
    const studentAnswer = answers[q.id] ?? ''
    let correct = false

    if (q.type === 'MCQ') {
      correct = Number(studentAnswer) === q.correctAnswer
    } else if (q.type === 'TRUE_FALSE') {
      correct = studentAnswer === q.correctAnswer
    } else if (q.type === 'FILL_BLANK') {
      const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
      correct = normalize(studentAnswer) === normalize((q.correctAnswer as string) ?? '')
    } else if (q.type === 'ESSAY') {
      // Essay needs manual grading
      fullyGraded = false
      results.push({ questionId: q.id, correct: false, earned: 0, explanation: 'يحتاج تصحيح يدوي' })
      continue
    }

    const earned = correct ? (q.points || 0) : 0
    earnedPoints += earned
    results.push({
      questionId: q.id,
      correct,
      earned,
      explanation: q.explanation,
    })
  }

  return { earnedPoints, totalPoints, fullyGraded, results }
}
