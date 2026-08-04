'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Lock, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

const WATERMARK_MARKS = [
  { top: '6%', left: '6%' },
  { top: '6%', right: '6%' },
  { bottom: '6%', left: '6%' },
  { bottom: '6%', right: '6%' },
  { top: '36%', left: '36%' },
  { top: '36%', right: '36%' },
  { bottom: '36%', left: '36%' },
  { bottom: '36%', right: '36%' },
]

/**
 * ProtectedVideo — hardened <video> player for lesson/explanation videos.
 *
 * - `/media/*` sources: exchanges the stable reference for a short-lived
 *   signed URL via /api/media/token (requires login + entitlement).
 * - Any source (incl. external): disables download, Picture-in-Picture and
 *   right-click/drag, and overlays a persistent watermark so leaks are
 *   attributable to the viewer.
 */
export function ProtectedVideo({
  src,
  title,
  className,
  watermark,
}: {
  src: string | null
  title?: string
  className?: string
  watermark?: string
}) {
  const needsToken = Boolean(src) && src!.startsWith('/media/')
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'denied' | 'error'>('loading')
  const [viewer, setViewer] = useState(watermark ?? '')

  // Only `/media/*` sources need a signed URL from the server.
  useEffect(() => {
    if (!needsToken || !src) return
    let cancelled = false
    const file = src.replace(/^\/media\//, '')
    fetch(`/api/media/token?file=${encodeURIComponent(file)}`)
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          throw new Error('DENIED')
        }
        if (!r.ok) throw new Error('FAILED')
        const d = await r.json()
        if (!cancelled && d?.url) {
          setSignedUrl(d.url)
          setStatus('ready')
        } else if (!cancelled) {
          setStatus('error')
        }
      })
      .catch((err: Error) => {
        if (cancelled) return
        setSignedUrl(null)
        setStatus(err.message === 'DENIED' ? 'denied' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [needsToken, src])

  // Watermark text — falls back to the logged-in user's name.
  useEffect(() => {
    if (viewer || typeof window === 'undefined') return
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        const name = d?.user?.name || d?.user?.nameAr || d?.user?.phone
        if (name) setViewer(name)
      })
      .catch(() => {})
  }, [viewer])

  const label = useMemo(() => (viewer ? `${viewer} • منصة منهل` : 'منصة منهل'), [viewer])

  if (!src || status === 'denied') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 rounded-2xl glass p-8 text-center', className)}>
        <Lock className="h-8 w-8 text-gold/70" />
        <p className="text-sm font-bold">هذا الفيديو محمي</p>
        <p className="text-xs text-muted-foreground">تحتاج إلى اشتراك نشط لمشاهدة هذا الدرس</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 rounded-2xl glass p-8 text-center', className)}>
        <TriangleAlert className="h-8 w-8 text-kids-red/70" />
        <p className="text-sm font-bold">تعذّر تحميل الفيديو</p>
      </div>
    )
  }

  const playUrl = needsToken ? signedUrl : src

  if (needsToken && (!playUrl || status === 'loading')) {
    return (
      <div className={cn('flex items-center justify-center gap-2 rounded-2xl glass p-8', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-gold" />
        <span className="text-sm text-muted-foreground">جارٍ تجهيز الفيديو…</span>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-night/80', className)}>
      <video
        src={playUrl ?? undefined}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        playsInline
        preload="metadata"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        className="block h-auto w-full"
      />
      {title && (
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-night/70 to-transparent px-4 pt-3 pb-6">
          <p className="text-sm font-bold text-white truncate">{title}</p>
        </div>
      )}
      {/* Persistent watermark overlay */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {WATERMARK_MARKS.map((pos, i) => (
          <span
            key={i}
            className="absolute -rotate-[25deg] whitespace-nowrap text-sm font-bold text-white/20 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] select-none"
            style={pos}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
