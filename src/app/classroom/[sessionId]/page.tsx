'use client'
import { formatTime } from '@/lib/datetime'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, ArrowRight, Users, Wifi, WifiOff } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { ThemeToggle } from '@/components/site/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { VideoPanel } from '@/components/classroom/video-panel'
import { ChatPanel } from '@/components/classroom/chat-panel'
import { WhiteboardPanel } from '@/components/classroom/whiteboard-panel'
import { CodeSandboxPanel } from '@/components/classroom/code-sandbox-panel'
import { FocusTracker } from '@/components/classroom/focus-tracker'
import { useRealtimeClassroom } from '@/components/classroom/use-realtime-classroom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface JoinResult {
  ok: boolean
  userId: string
  roomUrl: string
  roomName: string
  token: string
  sandbox: boolean
  isOwner: boolean
  displayName: string
  userRole: string
  session: {
    id: string
    title: string
    track: string
    startTime: string
    endTime: string
    teacherName: string | null
  }
}

function ClassroomContent() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [joinResult, setJoinResult] = useState<JoinResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recordingStatus, setRecordingStatus] = useState('NONE')
  const [initialWhiteboard, setInitialWhiteboard] = useState<any[]>([])
  const [chatHistory, setChatHistory] = useState<any[]>([])

  // 1. Join the classroom (creates Daily room + meeting token)
  useEffect(() => {
    if (!sessionId) return;
    fetch('/api/classroom/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
      credentials: 'same-origin',
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'فشل الدخول إلى الصف');
        return d;
      })
      .then((d) => {
        setJoinResult(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    
  }, [sessionId])

  // 2. Fetch recording status
  useEffect(() => {
    if (!joinResult) return
    fetch(`/api/classroom/recording?session=${sessionId}`, { credentials: 'same-origin' })
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Failed to fetch recording status')
        return d
      })
      .then((d) => setRecordingStatus(d.recordingStatus ?? 'NONE'))
      .catch((err) => toast.error(err.message))
  }, [joinResult, sessionId])

  // 3. Fetch chat history
  useEffect(() => {
    if (!joinResult) return
    fetch(`/api/classroom/chat?session=${sessionId}`, { credentials: 'same-origin' })
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Failed to fetch chat history')
        return d
      })
      .then((d) => {
        if (d.messages) {
          setChatHistory(d.messages.map((m: any) => ({
            messageId: m.id,
            sessionId: m.sessionId,
            userId: m.userId,
            senderName: m.senderName,
            senderRole: m.senderRole,
            text: m.text,
            attachmentUrl: m.attachmentUrl,
            attachmentType: m.attachmentType,
            createdAt: m.createdAt,
          })))
        }
      })
      .catch((err) => toast.error(err.message))
  }, [joinResult, sessionId])

  // 4. Fetch whiteboard state
  useEffect(() => {
    if (!joinResult) return
    fetch(`/api/classroom/whiteboard?session=${sessionId}`, { credentials: 'same-origin' })
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Failed to fetch whiteboard')
        return d
      })
      .then((d) => {
        if (d.elements) setInitialWhiteboard(d.elements)
      })
      .catch((err) => toast.error(err.message))
  }, [joinResult, sessionId])

  // 5. Connect to realtime classroom (socket.io) — only after join succeeds
  const rt = useRealtimeClassroom({
    sessionId: joinResult ? sessionId : null,
    userId: joinResult?.userId ?? null,
    userName: joinResult?.displayName ?? null,
    userRole: joinResult?.userRole ?? null,
  })

  // Listen for AI Focus Alerts from students (Teacher side)
  useEffect(() => {
    const handleFocusAlert = (e: any) => {
      if (joinResult?.userRole !== 'TEACHER') return
      const { name } = e.detail
      toast.error(`⚠️ تنبيه ذكاء اصطناعي: الطالب ${name} يبدو مشتتاً ولا ينظر للشاشة!`, {
        duration: 5000,
      })
    }
    window.addEventListener('focus:alert', handleFocusAlert)
    return () => window.removeEventListener('focus:alert', handleFocusAlert)
  }, [joinResult])

  const handleSendChat = useCallback(
    (text: string) => {
      if (!joinResult) return
      // Persist to DB
      fetch('/api/classroom/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, text }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.ok && d.message) {
            // Broadcast via socket
            rt.sendChatMessage({
              messageId: d.message.id,
              text: d.message.text,
              attachmentUrl: d.message.attachmentUrl,
              attachmentType: d.message.attachmentType,
              createdAt: d.message.createdAt,
            })
          }
        })
        .catch(() => toast.error('فشل إرسال الرسالة'))
    },
    [joinResult, sessionId, rt],
  )

  const handleWhiteboardChange = useCallback(
    (elements: any[]) => {
      rt.sendWhiteboardUpdate(elements)
    },
    [rt],
  )

  const handleWhiteboardSave = useCallback(
    (elements: any[]) => {
      fetch('/api/classroom/whiteboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, elements }),
      }).catch(() => {})
    },
    [sessionId],
  )

  const handleCodeChange = useCallback(
    (code: string, language: string) => {
      rt.sendCodeUpdate(code, language)
    },
    [rt],
  )

  const handleCodeLockToggle = useCallback(
    (locked: boolean) => {
      rt.sendCodeLock(locked)
    },
    [rt],
  )

  const handleRecordingToggle = async () => {
    if (!joinResult) return
    const action = recordingStatus === 'STARTED' ? 'stop' : 'start'
    const res = await fetch('/api/classroom/recording', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action }),
    })
    const d = await res.json()
    if (!res.ok) {
      toast.error(d.error || 'فشل')
      return
    }
    setRecordingStatus(d.status)
    toast.success(action === 'start' ? 'بدأ التسجيل' : 'تم إيقاف التسجيل')
  }

  const handleLeave = () => {
    const dest = joinResult?.userRole === 'TEACHER' ? '/teacher/schedule' : '/parent/sessions'
    router.push(dest)
  }

  // Save AI focus score at the end of the session
  const handleSaveFocusScore = useCallback((score: number) => {
    if (!sessionId) return
    fetch('/api/classroom/focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, score }),
    }).catch(() => {})
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-gold" />
          <p className="text-sm text-white/70">جارٍ الدخول للغرفة الافتراضية...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pharaonic p-4">
        <Card className="max-w-md w-full p-8 glass border-destructive/30 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">تعذّر الدخول</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Link href="/parent/sessions">
            <Button className="gap-2 bg-gradient-to-l from-gold to-[#E8D488] text-night">
              <ArrowRight className="h-4 w-4" />
              العودة للحجوزات
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (!joinResult) return null

  const isTeacher = joinResult.userRole === 'TEACHER'
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })
  const fmtTime = (iso: string) =>
    formatTime(iso)

  return (
    <div className="min-h-screen flex flex-col bg-night text-white">
      {/* Top bar */}
      <header className="border-b border-white/10 bg-night/80 backdrop-blur-md sticky top-0 z-30">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-white/10 rounded-lg p-1.5">
              <Logo size={28} showText={false} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-sm truncate">{joinResult.session.title}</h1>
              <p className="text-xs text-white/60">
                {joinResult.session.teacherName} • {fmtDate(joinResult.session.startTime)} • {fmtTime(joinResult.session.startTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection indicator */}
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              rt.connected ? 'bg-emerald-egypt/20 text-emerald-egypt' : 'bg-kids-red/20 text-kids-red'
            }`}>
              {rt.connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {rt.connected ? 'متصل' : 'غير متصل'}
            </span>
            {/* Presence */}
            <span className="hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/10">
              <Users className="h-3 w-3" />
              {rt.presence.length}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Classroom layout: video + (chat/whiteboard tabs) */}
      <main className="flex-1 p-3 lg:p-4">
        {/* Desktop: 2 columns (video left, tabs right) */}
        <div className="grid lg:grid-cols-2 gap-3 h-[calc(100vh-100px)]">
          {/* Video panel */}
          <div className="min-h-[300px] lg:min-h-0 relative">
            <VideoPanel
              roomUrl={joinResult.roomUrl}
              token={joinResult.token}
              displayName={joinResult.displayName}
              isOwner={joinResult.isOwner}
              sandbox={joinResult.sandbox}
              recordingStatus={recordingStatus}
              onRecordingToggle={handleRecordingToggle}
              onLeave={handleLeave}
            />
          </div>

          {/* Chat + Whiteboard + Code tabs (mobile: full width) */}
          <div className="min-h-[400px] lg:min-h-0">
            <Tabs defaultValue="chat" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
                <TabsTrigger value="chat" className="data-[state=active]:bg-gold data-[state=active]:text-night text-white/70">
                  💬 المحادثة
                </TabsTrigger>
                <TabsTrigger value="board" className="data-[state=active]:bg-gold data-[state=active]:text-night text-white/70">
                  ✏️ السبورة
                </TabsTrigger>
                <TabsTrigger value="code" className="data-[state=active]:bg-emerald-egypt data-[state=active]:text-white text-white/70">
                  💻 الكود
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 mt-2 min-h-0">
                <ChatPanel
                  messages={[...chatHistory, ...rt.messages]}
                  onSend={handleSendChat}
                  presence={rt.presence}
                  currentUserId={joinResult.userId}
                  connected={rt.connected}
                />
              </TabsContent>

              <TabsContent value="board" className="flex-1 mt-2 min-h-0">
                <WhiteboardPanel
                  initialElements={initialWhiteboard}
                  realtimeElements={rt.whiteboardElements}
                  isTeacher={isTeacher}
                  onElementsChange={handleWhiteboardChange}
                  onStateRequest={() => {}}
                  onSave={handleWhiteboardSave}
                />
              </TabsContent>

              <TabsContent value="code" className="flex-1 mt-2 min-h-0">
                <CodeSandboxPanel
                  code={rt.codeContent}
                  language={rt.codeLanguage}
                  isLocked={rt.codeLocked}
                  isTeacher={isTeacher}
                  onCodeChange={handleCodeChange}
                  onLockToggle={handleCodeLockToggle}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* AI Focus Tracker for Student */}
      {!isTeacher && (
        <FocusTracker
          sessionId={sessionId}
          studentName={joinResult.displayName}
          onDistracted={() => rt.sendFocusAlert(joinResult.displayName)}
          onSaveScore={handleSaveFocusScore}
        />
      )}
    </div>
  )
}

export default function ClassroomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-night"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>}>
      <ClassroomContent />
    </Suspense>
  )
}
