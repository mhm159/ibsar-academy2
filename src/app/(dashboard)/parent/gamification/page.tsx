'use client'

import { useEffect, useState } from 'react'
import { Trophy, Star, Flame, Award, Loader2, Sparkles, TrendingUp, Lock } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMode } from '@/components/use-mode'
import { triggerConfetti } from '@/components/site/kids-effects'
import { playCoin, playLevelUp, isSoundEnabled } from '@/lib/sounds'
import { toast } from 'sonner'

interface Level {
  level: number
  name: string
  nameEn: string
  icon: string
  minPoints: number
  color: string
}

interface Badge {
  id: string
  slug: string
  name: string
  nameAr: string
  description: string
  icon: string
  color: string
  tier: string
  unlockedAt?: string
  requirementType?: string
  requirementValue?: number
}

interface GamificationData {
  totalPoints: number
  level: {
    current: Level
    next: Level | null
    progress: number
    pointsToNext: number
  }
  completedSessions: number
  streak: { current: number; longest: number }
  unlockedBadges: Badge[]
  lockedBadges: Badge[]
  recentPoints: Array<{
    id: string
    points: number
    reason: string
    description: string
    createdAt: string
  }>
  students: Array<{ id: string; name: string }>
}

const TIER_COLORS: Record<string, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
}

export default function ParentGamificationPage() {
  return (
    <DashboardShell role="PARENT">
      <GamificationView />
    </DashboardShell>
  )
}

function GamificationView() {
  const { isKids } = useMode()
  const [data, setData] = useState<GamificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState('')

  useEffect(() => {
    fetch('/api/dashboard/parent/students')
      .then((r) => r.json())
      .then((d) => {
        if (d.students?.length > 0) {
          setSelectedStudent(d.students[0].id)
        }
      })
  }, [])

  useEffect(() => {
    if (!selectedStudent) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetch(`/api/dashboard/parent/gamification?student=${selectedStudent}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedStudent])

  if (loading || !data) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  const handleCelebrate = () => {
    if (isSoundEnabled()) playLevelUp()
    triggerConfetti(80, 4000)
    toast.success('🎉 أحسنت!')
  }

  return (
    <>
      <PageHeader
        title={isKids ? '🏆 رحلتك البطولية' : 'الإنجازات والنقاط'}
        description={isKids ? 'اجمع نقاط + افتح أوسمة + اصعد مستويات!' : 'تتبّع نقاط وأوسمة ومستويات طفلك'}
      />

      {/* Student selector */}
      {data.students.length > 0 && (
        <div className="mb-4">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="h-12 max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Level + Points Hero */}
      <Card className={`p-6 mb-4 ${isKids ? 'kids-card' : 'glass border-gold/15'}`}
        style={isKids ? { background: `linear-gradient(135deg, ${data.level.current.color}33, ${data.level.current.color}11)` } : undefined}
      >
        <div className="flex items-center gap-6 flex-wrap">
          {/* Level badge */}
          <div
            className="h-24 w-24 rounded-full flex items-center justify-center text-5xl shrink-0 kids-bounce"
            style={{ background: `linear-gradient(135deg, ${data.level.current.color}, ${data.level.current.color}88)` }}
          >
            {data.level.current.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="font-display text-2xl font-extrabold">
                مستوى {data.level.current.level}
              </h2>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ background: data.level.current.color }}
              >
                {data.level.current.name}
              </span>
            </div>
            <p className="text-2xl font-extrabold text-gradient-gold mb-2">
              {data.totalPoints} نقطة
            </p>

            {/* Progress to next level */}
            {data.level.next && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    باقي {data.level.pointsToNext} نقطة للمستوى التالي
                  </span>
                  <span className="font-bold">{data.level.progress}%</span>
                </div>
                <div className={isKids ? 'kids-progress' : 'h-2 rounded-full bg-muted overflow-hidden'}>
                  <div
                    className={isKids ? 'kids-progress-bar' : 'h-full rounded-full'}
                    style={!isKids ? {
                      width: `${data.level.progress}%`,
                      background: `linear-gradient(90deg, ${data.level.current.color}, ${data.level.next.color})`,
                    } : { width: `${data.level.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  المستوى التالي: {data.level.next.icon} {data.level.next.name} ({data.level.next.minPoints} نقطة)
                </p>
              </div>
            )}
          </div>

          {isKids && (
            <Button onClick={handleCelebrate} className="kids-btn kids-btn-accent">
              🎉 احتفل
            </Button>
          )}
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className={`p-4 text-center ${isKids ? 'kids-card bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white' : 'glass border-gold/15'}`}>
          <Flame className={`h-8 w-8 mx-auto mb-1 ${isKids ? '' : 'text-kids-red'}`} />
          <p className="text-2xl font-extrabold">{data.streak.current}</p>
          <p className={`text-xs ${isKids ? 'opacity-90' : 'text-muted-foreground'}`}>أيام متتالية</p>
        </Card>
        <Card className={`p-4 text-center ${isKids ? 'kids-card bg-gradient-to-br from-[#4ECDC4] to-[#44A8B3] text-white' : 'glass border-gold/15'}`}>
          <Trophy className={`h-8 w-8 mx-auto mb-1 ${isKids ? '' : 'text-gold'}`} />
          <p className="text-2xl font-extrabold">{data.completedSessions}</p>
          <p className={`text-xs ${isKids ? 'opacity-90' : 'text-muted-foreground'}`}>حصص مكتملة</p>
        </Card>
        <Card className={`p-4 text-center ${isKids ? 'kids-card bg-gradient-to-br from-[#FFE66D] to-[#FFC93C] text-[#2D1B4E]' : 'glass border-gold/15'}`}>
          <Award className={`h-8 w-8 mx-auto mb-1 ${isKids ? '' : 'text-emerald-egypt'}`} />
          <p className="text-2xl font-extrabold">{data.unlockedBadges.length}</p>
          <p className={`text-xs ${isKids ? 'opacity-80' : 'text-muted-foreground'}`}>أوسمة مفتوحة</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Badges */}
        <div>
          <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-gold" />
            الأوسمة ({data.unlockedBadges.length}/{data.unlockedBadges.length + data.lockedBadges.length})
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {data.unlockedBadges.map((badge, i) => (
              <div
                key={badge.id}
                className={`rounded-2xl p-3 text-center kids-pop-in ${isKids ? 'kids-card' : 'glass border-gold/15'}`}
                style={{ animationDelay: `${i * 0.05}s`, borderColor: badge.color }}
                title={badge.description}
              >
                <div className="text-4xl mb-1 kids-bounce" style={{ animationDelay: `${i * 0.2}s` }}>{badge.icon}</div>
                <p className="text-xs font-bold truncate">{badge.nameAr}</p>
                <div
                  className="mt-1 inline-block w-2 h-2 rounded-full"
                  style={{ background: TIER_COLORS[badge.tier] ?? '#999' }}
                />
              </div>
            ))}
            {data.lockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="rounded-2xl p-3 text-center opacity-40 grayscale glass border-border"
                title={badge.description}
              >
                <div className="text-4xl mb-1"><Lock className="h-8 w-8 mx-auto text-muted-foreground" /></div>
                <p className="text-xs font-bold truncate">{badge.nameAr}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent points */}
        <div>
          <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-azure" />
            آخر النقاط المكتسبة
          </h3>
          {data.recentPoints.length === 0 ? (
            <Card className="glass border-gold/15">
              <EmptyState icon={Star} title="لا توجد نقاط بعد" description="اكسب نقاط من إكمال الحصص" />
            </Card>
          ) : (
            <div className="space-y-2">
              {data.recentPoints.slice(0, 10).map((p) => (
                <div key={p.id} className={`flex items-center justify-between rounded-xl p-3 ${isKids ? 'bg-muted/40' : 'bg-muted/30'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      p.points > 0 ? 'bg-emerald-egypt/15 text-emerald-egypt' : 'bg-destructive/15 text-destructive'
                    }`}>
                      {p.points > 0 ? '+' : ''}{p.points}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{p.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
