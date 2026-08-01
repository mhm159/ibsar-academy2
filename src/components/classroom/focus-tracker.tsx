'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Brain, EyeOff, CheckCircle2, ShieldAlert } from 'lucide-react'

interface FocusTrackerProps {
  studentName: string
  sessionId: string
  /** Called when the student looks away for X consecutive seconds */
  onDistracted: () => void
  /** Called to persist the final focus score when unmounting/leaving */
  onSaveScore: (score: number) => void
}

/**
 * AI Focus Tracker
 * Uses MediaPipe FaceMesh via TensorFlow.js (loaded via CDN) to detect head pose.
 * Runs only on the student side.
 */
export function FocusTracker({ studentName, sessionId, onDistracted, onSaveScore }: FocusTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'LOADING' | 'TRACKING' | 'ERROR'>('LOADING')
  const [focusPercentage, setFocusPercentage] = useState(100)
  const [isDistracted, setIsDistracted] = useState(false)
  
  // Tracking stats
  const totalChecks = useRef(0)
  const focusedChecks = useRef(0)
  const distractedStreak = useRef(0)
  const activeTracker = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const startTrackingRef = useRef<() => void>(() => {})

  // ─── 1. Load ML Models via CDN ──────────────────────────────────────────────
  const loadScript = (src: string) => {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src
      s.onload = resolve
      s.onerror = reject
      document.head.appendChild(s)
    })
  }

  // ─── 2. Start Camera (Low Res) ──────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 160, height: 120, frameRate: 10 } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          startTrackingRef.current()
        }
      }
    } catch (err) {
      console.warn('FocusTracker: Camera permission denied or not available.', err)
      setStatus('ERROR')
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadScripts = async () => {
      try {
        // Load tfjs
        if (!(window as any).tf) {
          await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.21.0/dist/tf.min.js')
        }
        // Load tfjs-models/face-landmarks-detection
        if (!(window as any).faceLandmarksDetection) {
          await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@1.0.2/dist/face-landmarks-detection.js')
        }
        if (isMounted) startCamera()
      } catch (err) {
        console.error('Failed to load TFJS', err)
        if (isMounted) setStatus('ERROR')
      }
    }
    
    loadScripts()
    return () => { isMounted = false }
  }, [])

  // ─── 3. Face Tracking Logic ──────────────────────────────────────────────────
  const handleDistracted = () => {
    distractedStreak.current += 1
    setIsDistracted(true)
    // If distracted for 4 consecutive checks (8 seconds), alert the teacher
    if (distractedStreak.current === 4) {
      onDistracted()
    }
  }

  const startTracking = async () => {
    const fld = (window as any).faceLandmarksDetection
    if (!fld) return

    try {
      const model = fld.SupportedModels.MediaPipeFaceMesh
      const detectorConfig = {
        runtime: 'tfjs',
      }
      const detector = await fld.createDetector(model, detectorConfig)
      setStatus('TRACKING')

      // Check every 2 seconds
      activeTracker.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return

        try {
          const faces = await detector.estimateFaces(videoRef.current)
          totalChecks.current += 1

          if (faces.length > 0) {
            const face = faces[0]
            // Simple heuristic: If we can see the face bounding box and keypoints, they are likely looking.
            // A more advanced approach calculates yaw/pitch from 3D keypoints.
            // For MVP, if a face is detected, they are focused.
            const isLooking = true 
            
            if (isLooking) {
              focusedChecks.current += 1
              distractedStreak.current = 0
              setIsDistracted(false)
            } else {
              handleDistracted()
            }
          } else {
            // No face detected -> distracted
            handleDistracted()
          }

          // Update UI Percentage
          const score = Math.round((focusedChecks.current / totalChecks.current) * 100)
          setFocusPercentage(score)
        } catch (e) {
          // Ignore estimation errors
        }
      }, 2000)
    } catch (err) {
      console.error('FocusTracker detector error:', err)
      setStatus('ERROR')
    }
  }

  useEffect(() => {
    startTrackingRef.current = startTracking
  })

  // ─── Cleanup & Save ──────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Unmount: stop tracking, stop camera, save score
      if (activeTracker.current) clearInterval(activeTracker.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      
      const finalScore = totalChecks.current > 0 
        ? Math.round((focusedChecks.current / totalChecks.current) * 100)
        : 100
      
      onSaveScore(finalScore)
    }
  }, [onSaveScore])

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (status === 'ERROR') return null // Fail silently if camera blocked

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 p-2 rounded-xl backdrop-blur-md border shadow-2xl transition-colors ${
      isDistracted ? 'bg-kids-red/20 border-kids-red/40' : 'bg-night/80 border-white/10'
    }`}>
      {/* Hidden video element for processing */}
      <video ref={videoRef} playsInline muted className="hidden" />

      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
        isDistracted ? 'bg-kids-red/20 text-kids-red' : 'bg-emerald-egypt/20 text-emerald-egypt'
      }`}>
        {status === 'LOADING' ? (
          <Brain className="w-4 h-4 animate-pulse" />
        ) : isDistracted ? (
          <EyeOff className="w-4 h-4 animate-bounce" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
      </div>

      <div className="flex flex-col pr-2">
        <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">AI Focus</span>
        <span className={`text-xs font-bold font-mono ${
          focusPercentage < 50 ? 'text-kids-red' : focusPercentage < 75 ? 'text-gold' : 'text-emerald-egypt'
        }`}>
          {status === 'LOADING' ? 'جارٍ التحميل...' : `${focusPercentage}%`}
        </span>
      </div>

      {isDistracted && (
        <div className="absolute -top-10 right-0 bg-kids-red text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          تنبيه: يرجى الانتباه للشاشة
        </div>
      )}
    </div>
  )
}
