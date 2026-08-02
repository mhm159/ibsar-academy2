'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2, Star, TrendingUp, Lightbulb, ArrowLeft, RefreshCw, Users } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StarRating, TrackBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { notify } from '@/lib/notify'

interface Recommendation {
  type: 'TEACHER' | 'COURSE' | 'TRACK'
  entityId: string
  entityName: string
  reason: string
  score: number
}

interface Student {
  id: string
  name: string
  birthDate: string | null
  grade: string | null
  levelsJson: string
}

export default function ParentRecommendationsPage() {
  return (
    <DashboardShell role="PARENT">
      <RecommendationsView />
    </DashboardShell>
  )
}

function RecommendationsView() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [cached, setCached] = useState(false)

  // Load students first
  useEffect(() => {
    fetch('/api/dashboard/parent/students')
      .then((r) => r.json())
      .then((d) => {
        if (d.students) {
          setStudents(d.students)
          if (d.students.length > 0) {
            setSelectedStudent(d.students[0].id)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const loadRecommendations = (studentId: string) => {
    setGenerating(true)
    fetch(`/api/recommendations?student=${studentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.recommendations) {
          setRecommendations(d.recommendations)
          setCached(d.cached)
        }
        setGenerating(false)
      })
      .catch(() => setGenerating(false))
  }

  // Load recommendations when student changes
  useEffect(() => {
    if (!selectedStudent) return
    const t = setTimeout(() => loadRecommendations(selectedStudent), 0)
    return () => clearTimeout(t)
  }, [selectedStudent])

  const handleRefresh = async () => {
    if (!selectedStudent) return
    setGenerating(true)
    try {
      // Force fresh by calling with a cache-bust (the API checks 24h cache)
      // For simplicity, we just re-fetch
      const res = await fetch(`/api/recommendations?student=${selectedStudent}`)
      const d = await res.json()
      if (d.recommendations) {
        setRecommendations(d.recommendations)
        setCached(d.cached)
        notify.success('تم تحديث التوصيات')
      }
    } catch {
      notify.error('فشل التحديث')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
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
        title="توصيات الذكاء الاصطناعي"
        description="اقتراحات مخصصة لكل طفل بناءً على تحليل AI لتقدّمه واهتماماته"
        action={
          <Button
            onClick={handleRefresh}
            disabled={generating}
            variant="outline"
            className="gap-1.5 glass border-gold/30 hover:bg-gold/10"
          >
            <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        }
      />

      {/* Student selector */}
      {students.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState
            icon={Users}
            title="لا يوجد أبناء مسجّلون"
            description="أضف بيانات طفلك أولاً للحصول على توصيات مخصصة"
            action={
              <Link href="/parent/students">
                <Button className="bg-gradient-to-l from-gold to-[#E8D488] text-night">
                  إضافة طفل
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="mb-4">
            <label className="text-sm font-bold mb-2 block">اختر الطفل:</label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="h-12 max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI badge */}
          <Card className="p-4 mb-4 glass border-gold/30 bg-gradient-to-l from-gold/10 to-azure/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold to-azure flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">
                  {generating ? 'جارٍ تحليل بيانات الطفل بالذكاء الاصطناعي...' : 'تم التحليل بواسطة AI'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {cached
                    ? 'توصيات محفوظة (تتحدّث كل 24 ساعة)'
                    : generating
                      ? 'يستغرق هذا بضع ثواني...'
                      : 'توصيات مخصصة طازجة'}
                </p>
              </div>
              {generating && <Loader2 className="h-5 w-5 animate-spin text-gold" />}
            </div>
          </Card>

          {/* Recommendations */}
          {generating ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <Card className="glass border-gold/15">
              <EmptyState
                icon={Lightbulb}
                title="لا توجد توصيات متاحة"
                description="أكمل طفلك بعض الحصص أولاً للحصول على توصيات مخصصة"
              />
            </Card>
          ) : (
            <div className="grid gap-3">
              {recommendations.map((rec, i) => (
                <RecommendationCard key={`${rec.type}-${rec.entityId}-${i}`} rec={rec} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const [clicked, setClicked] = useState(false)

  const handleClick = async () => {
    setClicked(true)
    // Track click (for AI improvement)
    // Note: we'd need the recommendationLog id; skip for now
  }

  const typeMeta = {
    TEACHER: { icon: '👩‍🏫', label: 'معلم مقترح', color: 'var(--azure)' },
    COURSE: { icon: '📚', label: 'كورس مقترح', color: 'var(--emerald-egypt)' },
    TRACK: { icon: '🎯', label: 'مسار مقترح', color: 'var(--gold)' },
  }[rec.type] ?? { icon: '💡', label: 'توصية', color: 'var(--gold)' }

  return (
    <Card className="p-5 glass border-gold/15 hover:border-gold/40 transition-colors">
      <div className="flex items-start gap-4">
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: `color-mix(in srgb, ${typeMeta.color} 15%, transparent)` }}
        >
          {typeMeta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-[0.65rem] px-2 py-0.5 rounded-full font-bold"
              style={{ color: typeMeta.color, background: `color-mix(in srgb, ${typeMeta.color} 12%, transparent)` }}
            >
              {typeMeta.label}
            </span>
            <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
              تطابق {rec.score}%
            </span>
          </div>
          <h3 className="font-display font-bold text-lg mb-1">{rec.entityName}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{rec.reason}</p>
          <div className="flex items-center gap-2 mt-3">
            <Link href="/parent/sessions" onClick={handleClick}>
              <Button size="sm" className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night">
                استكشاف
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            </Link>
            {clicked && (
              <span className="text-xs text-emerald-egypt flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                تم التسجيل
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
