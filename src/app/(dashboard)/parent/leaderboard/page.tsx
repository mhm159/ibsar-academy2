'use client'

import { useEffect, useState } from 'react'
import { Trophy, Crown, Medal, Star, Flame, Loader2 } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { useMode } from '@/components/use-mode'

interface LeaderboardEntry {
  rank: number
  studentId: string
  studentName: string
  totalPoints: number
  level: { level: number; name: string; icon: string; color: string }
  badgesCount: number
  currentStreak: number
  gender: string | null
  grade: string | null
}

export default function ParentLeaderboardPage() {
  return (
    <DashboardShell role="PARENT">
      <LeaderboardView />
    </DashboardShell>
  )
}

function LeaderboardView() {
  const { isKids } = useMode()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/parent/leaderboard')
      .then((r) => r.json())
      .then((d) => {
        if (d.leaderboard) setEntries(d.leaderboard)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <>
      <PageHeader
        title={isKids ? '🏆 أبطال إبداع' : 'لوحة المتصدرين'}
        description={isKids ? 'شوف مين أعلى الأبطال!' : 'ترتيب الطلاب حسب النقاط'}
      />

      {/* Top 3 podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* 2nd place */}
          {top3[1] && <PodiumCard entry={top3[1]} place={2} isKids={isKids} />}
          {/* 1st place (taller) */}
          {top3[0] && <PodiumCard entry={top3[0]} place={1} isKids={isKids} />}
          {/* 3rd place */}
          {top3[2] && <PodiumCard entry={top3[2]} place={3} isKids={isKids} />}
        </div>
      )}

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((entry) => (
            <Card key={entry.studentId} className={`p-3 flex items-center gap-3 ${isKids ? 'kids-card' : 'glass border-gold/15'}`}>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-extrabold text-sm shrink-0">
                {entry.rank}
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ background: entry.level.color + '33' }}
              >
                {entry.gender === 'FEMALE' ? '👧' : '👦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{entry.studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.level.icon} {entry.level.name} • {entry.badgesCount} 🏅 • 🔥 {entry.currentStreak}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-extrabold text-gradient-gold">{entry.totalPoints}</p>
                <p className="text-xs text-muted-foreground">نقطة</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <Card className="glass border-gold/15 p-8 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">لا توجد بيانات بعد</p>
        </Card>
      )}
    </>
  )
}

function PodiumCard({ entry, place, isKids }: { entry: LeaderboardEntry; place: number; isKids: boolean }) {
  const placeConfig = {
    1: { icon: '👑', label: 'البطل', color: '#FFD700', height: 'mt-0', size: 'text-5xl' },
    2: { icon: '🥈', label: 'الثاني', color: '#C0C0C0', height: 'mt-4', size: 'text-4xl' },
    3: { icon: '🥉', label: 'الثالث', color: '#CD7F32', height: 'mt-6', size: 'text-4xl' },
  }[place]!

  return (
    <div className={`${placeConfig.height} kids-pop-in`}>
      <div
        className={`rounded-2xl p-4 text-center ${isKids ? 'kids-card' : 'glass border-gold/15'}`}
        style={{ borderColor: placeConfig.color, background: `linear-gradient(180deg, ${placeConfig.color}22, transparent)` }}
      >
        <div className={`${placeConfig.size} mb-1 kids-bounce`}>{placeConfig.icon}</div>
        <div
          className="h-14 w-14 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl"
          style={{ background: entry.level.color + '44' }}
        >
          {entry.gender === 'FEMALE' ? '👧' : '👦'}
        </div>
        <p className="font-bold text-sm truncate">{entry.studentName}</p>
        <p className="text-xs text-muted-foreground mb-2">{entry.level.icon} {entry.level.name}</p>
        <p className="text-2xl font-extrabold" style={{ color: placeConfig.color }}>
          {entry.totalPoints}
        </p>
        <p className="text-xs text-muted-foreground">نقطة</p>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs">
          <span className="flex items-center gap-0.5">🏅 {entry.badgesCount}</span>
          <span className="flex items-center gap-0.5">🔥 {entry.currentStreak}</span>
        </div>
      </div>
    </div>
  )
}
