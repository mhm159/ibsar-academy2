'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CalendarClock,
  ChevronDown,
  MessageSquare,
  Activity,
  Loader2,
  Search,
  ImagePlus,
  X,
} from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, StatusBadge, EmptyState, TrackBadge } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { notify } from '@/lib/notify'

interface SessionRow {
  id: string
  title: string
  track: string
  status: string
  startTime: string
  durationMins: number
  isTrial: boolean
  teacherName: string | null
  studentsCount: number
  chatCount: number
  activityCount: number
  mediaCount: number
  avgFocusScore: number | null
  reportsCount: number
  avgSupervisorRating: number | null
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'ظ…ط¬ط¯ظˆظ„ط©',
  COMPLETED: 'ظ…ظƒطھظ…ظ„ط©',
  CANCELLED: 'ظ…ظ„ط؛ط§ط©',
  IN_PROGRESS: 'ط¬ط§ط±ظگظٹط©',
}

export default function AdminSessionsPage() {
  return (
    <DashboardShell role="ADMIN">
      <SessionsReport />
    </DashboardShell>
  )
}

function SessionsReport() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [q, setQ] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (q) params.set('q', q)
    fetch(`/api/dashboard/admin/sessions?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.sessions) setSessions(d.sessions)
        if (d.summary) setSummary(d.summary)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [statusFilter, q])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  return (
    <>
      <PageHeader
        title="ط³ط¬ظ„ ط§ظ„ط­طµطµ"
        description="ط³ط¬ظ„ ط§ظ„ظ…ط­ط§ط¯ط«ط§طھ ظˆظ†ط´ط§ط· ط§ظ„ط­طµطµ ظˆط§ظ„طھظ‚ط§ط±ظٹط± ظ„ظƒظ„ ط­طµط©"
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard icon={CalendarClock} label="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط­طµطµ" value={summary.total ?? 0} color="var(--azure)" />
        <StatCard icon={CalendarClock} label="ظ…ظƒطھظ…ظ„ط©" value={summary.completed ?? 0} color="var(--emerald-egypt)" />
        <StatCard icon={CalendarClock} label="ظ…ط¬ط¯ظˆظ„ط©/ط¬ط§ط±ظگظٹط©" value={(summary.scheduled ?? 0) + (summary.inProgress ?? 0)} color="var(--gold)" />
        <StatCard icon={MessageSquare} label="ط±ط³ط§ط¦ظ„ ط§ظ„ط´ط§طھ" value={summary.totalChatMessages ?? 0} color="var(--kids-teal)" />
        <StatCard icon={Activity} label="ط§ظ„ط£ط­ط¯ط§ط« ط§ظ„ظ…ط³ط¬ظ„ط©" value={sessions.reduce((a, s) => a + s.activityCount, 0)} color="var(--kids-yellow)" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="ط¨ط­ط« ط¨ط§ط³ظ… ط§ظ„ط­طµط© ط£ظˆ ط§ظ„ظ…ط¹ظ„ظ…..." value={q} onChange={(e) => setQ(e.target.value)} className="pr-10 h-11" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-11">
            <SelectValue placeholder="ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</SelectItem>
            <SelectItem value="SCHEDULED">ظ…ط¬ط¯ظˆظ„ط©</SelectItem>
            <SelectItem value="IN_PROGRESS">ط¬ط§ط±ظگظٹط©</SelectItem>
            <SelectItem value="COMPLETED">ظ…ظƒطھظ…ظ„ط©</SelectItem>
            <SelectItem value="CANCELLED">ظ…ظ„ط؛ط§ط©</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState icon={CalendarClock} title="ظ„ط§ طھظˆط¬ط¯ ط­طµطµ" description="ط¬ط±ظ‘ط¨ طھط؛ظٹظٹط± ظ…ط¹ط§ظٹظٹط± ط§ظ„ط¨ط­ط«" />
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              expanded={expanded === s.id}
              onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}

function SessionCard({
  session,
  expanded,
  onToggle,
}: {
  session: SessionRow
  expanded: boolean
  onToggle: () => void
}) {
  const [detail, setDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadDetail = () => {
    setLoadingDetail(true)
    fetch(`/api/dashboard/admin/sessions/${session.id}`)
      .then((r) => r.json())
      .then((d) => setDetail(d))
      .catch(() => notify.error('طھط¹ط°ظ‘ط± طھط­ظ…ظٹظ„ طھظپط§طµظٹظ„ ط§ظ„ط­طµط©'))
      .finally(() => setLoadingDetail(false))
  }

  return (
    <Card className="glass border-gold/15 overflow-hidden">
      {/* Row header */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-4 text-right hover:bg-gold/5 transition-colors">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-lg shrink-0">
          {session.track === 'ROBOTICS' ? 'ًں¤–' : session.track === 'PROGRAMMING' ? 'ًں’»' : session.track === 'MENTAL_MATH' ? 'ًں§®' : 'ًںژ¨'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold truncate">{session.title}</h3>
            <TrackBadge track={session.track} />
            {session.isTrial && (
              <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-500">طھط¬ط±ظٹط¨ظٹط©</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {session.teacherName} â€¢ {new Date(session.startTime).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' â€¢ '}
            {new Date(session.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            {' â€¢ '}
            {session.durationMins} ط¯
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={session.status} label={STATUS_LABELS[session.status] ?? session.status} />
          <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{session.chatCount}</span>
            <span className="flex items-center gap-1"><Activity className="h-3.5 w-3.5" />{session.activityCount}</span>
            <span className="flex items-center gap-1"><ImagePlus className="h-3.5 w-3.5" />{session.mediaCount}</span>
            <span>{session.studentsCount} ط·ط§ظ„ط¨</span>
          </div>
          <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border/50 p-4 space-y-5">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              <Loader2 className="h-5 w-5 animate-spin ml-2" /> ط¬ط§ط±ظچ طھط­ظ…ظٹظ„ ط§ظ„طھظپط§طµظٹظ„...
            </div>
          ) : detail ? (
            <SessionDetail sessionId={session.id} detail={detail} onChanged={loadDetail} />
          ) : (
            <button onClick={loadDetail} className="text-sm text-gold font-bold">ط¥ط¹ط§ط¯ط© ط§ظ„ظ…ط­ط§ظˆظ„ط©</button>
          )}
        </div>
      )}
    </Card>
  )
}

function SessionDetail({ sessionId, detail, onChanged }: { sessionId: string; detail: any; onChanged: () => void }) {
  const s = detail.session
  const [mediaForm, setMediaForm] = useState({ url: '', caption: '' })
  const [uploading, setUploading] = useState(false)

  const fmt = (iso: string) => new Date(iso).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  const handleMediaUpload = async (file: File) => {
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: reader.result, type: 'session-media', fileName: file.name }),
        })
        const d = await res.json()
        if (!res.ok || !d.url) return notify.error(d.error || 'ظپط´ظ„ ط§ظ„ط±ظپط¹')
        const attach = await fetch('/api/admin/session-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, url: d.url, caption: mediaForm.caption, type: 'IMAGE', isPublished: true }),
        })
        const ad = await attach.json()
        if (!attach.ok) return notify.error(ad.error || 'ظپط´ظ„ ط§ظ„ط¥ط¶ط§ظپط©')
        notify.success('طھظ…طھ ط¥ط¶ط§ظپط© ط§ظ„طµظˆط±ط©')
        setMediaForm({ url: '', caption: '' })
        onChanged()
      } catch {
        notify.error('طھط¹ط°ظ‘ط± ط§ظ„ط±ظپط¹')
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const removeMedia = async (id: string) => {
    const res = await fetch(`/api/admin/session-media?id=${id}`, { method: 'DELETE' })
    const d = await res.json()
    if (!res.ok) return notify.error(d.error || 'ظپط´ظ„ ط§ظ„ط­ط°ظپ')
    notify.success('طھظ… ط§ظ„ط­ط°ظپ')
    onChanged()
  }

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Chat transcript */}
      <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
        <h4 className="font-display font-bold mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gold" />
          ط³ط¬ظ„ ط§ظ„ظ…ط­ط§ط¯ط«ط© ({detail.chatMessages.length})
        </h4>
        {detail.chatMessages.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">ظ„ط§ طھظˆط¬ط¯ ط±ط³ط§ط¦ظ„</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pl-1">
            {detail.chatMessages.map((m: any) => (
              <div key={m.id} className="rounded-xl bg-card/60 p-3 border border-border/30">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-bold">{m.senderName}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-muted">{m.senderRole}</span>
                    <span className="text-[0.6rem] text-muted-foreground">{fmt(m.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5">
        {/* Activity log */}
        <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
          <h4 className="font-display font-bold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-gold" />
            ظ†ط´ط§ط· ط§ظ„ط­طµط© ({detail.logs.length})
          </h4>
          {detail.logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">ظ„ط§ ظٹظˆط¬ط¯ ظ†ط´ط§ط· ظ…ط³ط¬ظ„</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pl-1">
              {detail.logs.map((l: any) => (
                <div key={l.id} className="flex items-start gap-2 text-xs">
                  <span className="rounded-full bg-muted px-2 py-0.5 font-bold shrink-0">{l.event}</span>
                  <span className="text-muted-foreground flex-1 min-w-0">
                    {l.userName ?? 'ظ…ط´ط§ط±ظƒ'} ({l.userRole}) {l.detail}
                  </span>
                  <span className="text-muted-foreground/60 shrink-0">{fmt(l.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Focus + attendance */}
        <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
          <h4 className="font-display font-bold mb-3">طھط±ظƒظٹط² ط§ظ„ط·ظ„ط§ط¨</h4>
          {detail.progressReports.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">ظ„ط§ طھظˆط¬ط¯ طھظ‚ط§ط±ظٹط± طھظ‚ط¯ظ…</p>
          ) : (
            <div className="space-y-1.5">
              {detail.progressReports.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="font-bold">{r.studentName}</span>
                  <span className="flex items-center gap-2">
                    <StatusBadge status={r.attendance ?? 'UNKNOWN'} label={r.attendance ?? 'â€”'} />
                    {r.focusScore != null && <span className="text-xs font-bold text-azure">{r.focusScore}%</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
          {s.avgFocusScore != null && (
            <p className="mt-3 text-xs text-muted-foreground">ظ…طھظˆط³ط· ط§ظ„طھط±ظƒظٹط²: <span className="font-bold text-azure">{s.avgFocusScore}%</span></p>
          )}
        </div>

        {/* Supervisor reports */}
        <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
          <h4 className="font-display font-bold mb-3">طھظ‚ط§ط±ظٹط± ط§ظ„ظ…ط´ط±ظپظٹظ† ({detail.supervisorReports.length})</h4>
          {detail.supervisorReports.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">ظ„ط§ طھظˆط¬ط¯ طھظ‚ط§ط±ظٹط± ط¨ط¹ط¯</p>
          ) : (
            <div className="space-y-2">
              {detail.supervisorReports.map((r: any) => (
                <div key={r.id} className="rounded-xl bg-card/60 p-3 border border-border/30">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{r.supervisorName}</p>
                    <span className="text-xs font-bold text-gold">{'âک…'.repeat(r.rating)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{r.notes || 'ط¨ط¯ظˆظ† ظ…ظ„ط§ط­ط¸ط§طھ'}</p>
                  <p className="text-[0.65rem] text-muted-foreground mt-1">
                    {r.chatCount} ط±ط³ط§ظ„ط© â€¢ {r.studentCount} ط·ط§ظ„ط¨ â€¢ طھط±ظƒظٹط² {r.avgFocusScore}% â€¢ {fmt(r.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Session media */}
      <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-muted/20 p-4">
        <h4 className="font-display font-bold mb-3 flex items-center gap-2">
          <ImagePlus className="h-4 w-4 text-gold" />
          طµظˆط± ط§ظ„ط­طµط© ({detail.media.length})
        </h4>
        {detail.media.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
            {detail.media.map((m: any) => (
              <div key={m.id} className="relative group aspect-square rounded-xl overflow-hidden border border-border/50">
                <img src={m.url} alt={m.caption ?? ''} className="h-full w-full object-cover" />
                <button
                  onClick={() => removeMedia(m.id)}
                  className="absolute top-1 left-1 h-6 w-6 rounded-full bg-night/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="ط­ط°ظپ"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[180px] space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">ط±ط§ط¨ط· طµظˆط±ط© ط£ظˆ ط±ظپط¹ ظ…ظ„ظپ</label>
            <Input value={mediaForm.url} onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })} placeholder="/uploads/... ط£ظˆ ط±ط§ط¨ط· ط®ط§ط±ط¬ظٹ" dir="ltr" />
          </div>
          <div className="flex-1 min-w-[180px] space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">ظˆطµظپ (ط§ط®طھظٹط§ط±ظٹ)</label>
            <Input value={mediaForm.caption} onChange={(e) => setMediaForm({ ...mediaForm, caption: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <input type="file" accept="image/*" id={`upload-${sessionId}`} className="hidden" onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0])} />
            <label htmlFor={`upload-${sessionId}`} className="cursor-pointer">
              <Button asChild variant="outline" disabled={uploading}>
                <span className="gap-1.5">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} ط±ظپط¹</span>
              </Button>
            </label>
            <Button
              className="bg-gradient-to-l from-gold to-[#E8D488] text-night gap-1.5"
              disabled={!mediaForm.url.trim()}
              onClick={async () => {
                const res = await fetch('/api/admin/session-media', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sessionId, url: mediaForm.url.trim(), caption: mediaForm.caption, type: 'IMAGE', isPublished: true }),
                })
                const d = await res.json()
                if (!res.ok) return notify.error(d.error || 'ظپط´ظ„ ط§ظ„ط¥ط¶ط§ظپط©')
                notify.success('طھظ…طھ ط§ظ„ط¥ط¶ط§ظپط©')
                setMediaForm({ url: '', caption: '' })
                onChanged()
              }}
            >
              ط¥ط¶ط§ظپط©
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
