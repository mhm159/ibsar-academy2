'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff, Circle, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VideoPanelProps {
  roomUrl: string
  token: string
  displayName: string
  isOwner: boolean
  sandbox: boolean
  recordingStatus: string
  onRecordingToggle?: () => void
  onLeave?: () => void
}

/**
 * VideoPanel — Daily.co video room via iframe.
 *
 * In sandbox mode (no DAILY_API_KEY), shows a simulated video panel
 * with avatar tiles + mic/cam toggles (UI-only, no real stream).
 *
 * In production, embeds the Daily.co iframe with the meeting token.
 */
export function VideoPanel({
  roomUrl,
  token,
  displayName,
  isOwner,
  sandbox,
  recordingStatus,
  onRecordingToggle,
  onLeave,
}: VideoPanelProps) {
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  if (sandbox) {
    return (
      <div className="flex flex-col h-full bg-night rounded-2xl overflow-hidden">
        {/* Sandbox banner */}
        <div className="bg-gold/20 border-b border-gold/30 px-3 py-1.5 text-center">
          <p className="text-xs font-bold text-gold">وضع تجريبي — لا يوجد فيديو حقيقي (Daily.co غير مُعدّ)</p>
        </div>

        {/* Video tiles */}
        <div className="flex-1 p-4 flex items-center justify-center bg-gradient-to-br from-night via-[#16222E] to-[#0F1923]">
          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            {/* Teacher tile */}
            <div className="aspect-video rounded-xl bg-gradient-to-br from-azure/30 to-emerald-egypt/30 flex flex-col items-center justify-center text-white relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gold/40 to-azure/40 flex items-center justify-center text-3xl mb-2">
                👩‍🏫
              </div>
              <p className="text-xs font-bold">{isOwner ? displayName : 'المعلم'}</p>
              <span className="absolute top-2 right-2 text-[0.6rem] px-1.5 py-0.5 rounded bg-emerald-egypt text-white font-bold">
                معلم
              </span>
              {camOn && (
                <div className="absolute inset-0 rounded-xl ring-2 ring-emerald-egypt/50 pointer-events-none" />
              )}
            </div>

            {/* Student/Parent tile */}
            <div className="aspect-video rounded-xl bg-gradient-to-br from-kids-teal/20 to-kids-yellow/20 flex flex-col items-center justify-center text-white relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-kids-teal/40 to-kids-yellow/40 flex items-center justify-center text-3xl mb-2">
                {isOwner ? '👨‍👩‍👧' : '😀'}
              </div>
              <p className="text-xs font-bold">{isOwner ? 'الطالب' : displayName}</p>
              <span className="absolute top-2 right-2 text-[0.6rem] px-1.5 py-0.5 rounded bg-azure text-white font-bold">
                طالب
              </span>
            </div>
          </div>
        </div>

        {/* Recording indicator */}
        {recordingStatus === 'STARTED' && (
          <div className="absolute top-14 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-kids-red text-white text-xs font-bold animate-pulse">
            <span className="h-2 w-2 rounded-full bg-white" />
            تسجيل
          </div>
        )}

        {/* Controls */}
        <div className="bg-night/80 backdrop-blur-md border-t border-white/10 p-3 flex items-center justify-center gap-2">
          <button
            onClick={() => setMicOn((v) => !v)}
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center transition-colors',
              micOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-kids-red text-white',
            )}
            aria-label={micOn ? 'كتم المايك' : 'تشغيل المايك'}
          >
            {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setCamOn((v) => !v)}
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center transition-colors',
              camOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-kids-red text-white',
            )}
            aria-label={camOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
          >
            {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </button>

          {isOwner && onRecordingToggle && (
            <button
              onClick={onRecordingToggle}
              className={cn(
                'h-10 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold transition-colors',
                recordingStatus === 'STARTED'
                  ? 'bg-kids-red text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white',
              )}
            >
              {recordingStatus === 'STARTED' ? (
                <><Square className="h-3 w-3" /> إيقاف التسجيل</>
              ) : (
                <><Circle className="h-3 w-3" /> بدء التسجيل</>
              )}
            </button>
          )}

          <button
            onClick={onLeave}
            className="h-10 px-4 rounded-full flex items-center gap-1.5 text-xs font-bold bg-kids-red hover:bg-kids-red/90 text-white transition-colors"
          >
            <PhoneOff className="h-4 w-4" />
            مغادرة
          </button>
        </div>
      </div>
    )
  }

  // Production: embed Daily.co iframe with token
  // Daily.co iframe URL format: https://your-domain.daily.co/room-name?t=token
  const fullUrl = `${roomUrl}?t=${encodeURIComponent(token)}&embed=true`

  return (
    <div className="flex flex-col h-full bg-night rounded-2xl overflow-hidden relative">
      <iframe
        ref={iframeRef}
        src={fullUrl}
        allow="camera; microphone; fullscreen; display-capture; speaker-selection"
        className="flex-1 w-full border-0"
        title="Ibsar Classroom — Video"
      />
      {recordingStatus === 'STARTED' && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-kids-red text-white text-xs font-bold animate-pulse z-10">
          <span className="h-2 w-2 rounded-full bg-white" />
          تسجيل
        </div>
      )}
    </div>
  )
}

/* TODO(phase-5): Add AI background blur + noise cancellation via Daily.co client SDK. */
