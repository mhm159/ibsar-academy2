'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, Pen, Save, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WhiteboardPanelProps {
  /** initial elements loaded from DB */
  initialElements: any[]
  /** realtime elements broadcast from teacher */
  realtimeElements: any[]
  /** is the current user the teacher (can edit)? */
  isTeacher: boolean
  /** called when teacher edits the board (broadcasts via socket + throttled save) */
  onElementsChange: (elements: any[]) => void
  /** called when teacher responds to state-request from a new joiner */
  onStateRequest: (callback: (toSocketId: string) => void) => void
  /** save to DB (throttled) */
  onSave: (elements: any[]) => void
}

/**
 * WhiteboardPanel — uses Excalidraw via official npm package.
 *
 * Falls back to a lightweight canvas-based whiteboard if Excalidraw
 * fails to load (e.g. in sandbox environments with Turbopack).
 *
 * Teacher can draw/edit; students are view-only.
 * Sync happens via socket.io (teacher broadcasts → students receive).
 */
export function WhiteboardPanel({
  initialElements,
  realtimeElements,
  isTeacher,
  onElementsChange,
  onStateRequest,
  onSave,
}: WhiteboardPanelProps) {
  const [loadError, setLoadError] = useState(false)
  const [ExcalidrawComp, setExcalidrawComp] = useState<any>(null)
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const lastBroadcast = useRef<number>(0)
  const lastSave = useRef<number>(0)
  const isApplyingRemote = useRef(false)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [color, setColor] = useState('#1B6CA8')
  const [strokes, setStrokes] = useState<any[]>(initialElements)

  // Try loading Excalidraw dynamically
  useEffect(() => {
    let cancelled = false
    import('@excalidraw/excalidraw')
      .then((mod) => {
        if (cancelled) return
        setExcalidrawComp(() => mod.Excalidraw)
      })
      .catch((err) => {
        console.warn('[whiteboard] Excalidraw load failed, using fallback:', err)
        if (!cancelled) setLoadError(true)
      })
    return () => { cancelled = true }
  }, [])

  // Apply realtime updates from teacher (students only)
  useEffect(() => {
    if (isTeacher || realtimeElements.length === 0) return
    isApplyingRemote.current = true
    setStrokes(realtimeElements)
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({ elements: realtimeElements })
    }
    requestAnimationFrame(() => { isApplyingRemote.current = false })
  }, [realtimeElements, isTeacher, excalidrawAPI])

  // Listen for state requests from new joiners (teacher responds)
  useEffect(() => {
    if (!isTeacher) return
    const handler = () => {
      if (excalidrawAPI) {
        const els = excalidrawAPI.getSceneElements()
        onElementsChange(els)
      } else {
        onElementsChange(strokes)
      }
    }
    window.addEventListener('whiteboard:request-state', handler)
    return () => window.removeEventListener('whiteboard:request-state', handler)
  }, [isTeacher, excalidrawAPI, strokes, onElementsChange])

  const handleExcalidrawChange = useCallback((newElements: any[]) => {
    if (isApplyingRemote.current) return
    setStrokes(newElements)
    if (!isTeacher) return

    const now = Date.now()
    if (now - lastBroadcast.current > 100) {
      lastBroadcast.current = now
      onElementsChange(newElements)
    }
    if (now - lastSave.current > 5000) {
      lastSave.current = now
      onSave(newElements)
    }
  }, [isTeacher, onElementsChange, onSave])

  // ----- Fallback canvas drawing -----
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: any) => {
    if (!stroke.points || stroke.points.length < 2) return
    ctx.strokeStyle = stroke.color || '#1B6CA8'
    ctx.lineWidth = stroke.width || 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
    ctx.stroke()
  }

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (const stroke of strokes) {
      drawStroke(ctx, stroke)
    }
  }, [strokes])

  useEffect(() => {
    if (loadError) redrawAll()
  }, [loadError, redrawAll, strokes])

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isTeacher || loadError) return
    e.preventDefault()
    drawingRef.current = true
    const pos = getCanvasPos(e)
    lastPosRef.current = pos
    setStrokes((prev) => [...prev, {
      type: 'stroke',
      tool,
      color: tool === 'eraser' ? '#FFFFFF' : color,
      width: tool === 'eraser' ? 20 : 3,
      points: [pos],
    }])
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isTeacher || !drawingRef.current || !loadError) return
    e.preventDefault()
    const pos = getCanvasPos(e)
    setStrokes((prev) => {
      const last = prev[prev.length - 1]
      if (!last || !last.points) return prev
      const updated = [...prev]
      updated[updated.length - 1] = {
        ...last,
        points: [...last.points, pos],
      }
      return updated
    })
    // Draw incrementally
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx && lastPosRef.current) {
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color
      ctx.lineWidth = tool === 'eraser' ? 20 : 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
    lastPosRef.current = pos
  }

  const handleEnd = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPosRef.current = null
    // Broadcast + save
    const now = Date.now()
    if (now - lastBroadcast.current > 100) {
      lastBroadcast.current = now
      onElementsChange(strokes)
    }
    if (now - lastSave.current > 3000) {
      lastSave.current = now
      onSave(strokes)
    }
  }

  const handleClear = () => {
    if (!isTeacher) return
    if (!confirm('مسح كل ما على السبورة؟')) return
    setStrokes([])
    onElementsChange([])
    onSave([])
  }

  const handleSaveClick = () => {
    onSave(strokes)
  }

  // ====== Render ======
  if (loadError) {
    // Fallback: simple canvas whiteboard
    return (
      <div className="flex flex-col h-full glass rounded-2xl border border-gold/20 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            <Pen className="h-4 w-4 text-gold" />
            السبورة التفاعلية
            {!isTeacher && <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">عرض فقط</span>}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            {isTeacher && (
              <>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTool('pen')}
                    className={`h-7 w-7 rounded-md flex items-center justify-center ${tool === 'pen' ? 'bg-gold text-night' : 'bg-muted'}`}
                  ><Pen className="h-3.5 w-3.5" /></button>
                  <button
                    onClick={() => setTool('eraser')}
                    className={`h-7 w-7 rounded-md flex items-center justify-center ${tool === 'eraser' ? 'bg-gold text-night' : 'bg-muted'}`}
                  >🧹</button>
                </div>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-7 w-7 rounded-md border border-border cursor-pointer"
                  disabled={tool === 'eraser'}
                />
                <Button size="sm" variant="ghost" onClick={handleClear} className="h-7 text-xs hover:bg-destructive/10 hover:text-destructive">مسح</Button>
                <Button size="sm" variant="ghost" onClick={handleSaveClick} className="h-7 text-xs hover:bg-gold/10"><Save className="h-3 w-3" /> حفظ</Button>
              </>
            )}
          </div>
        </div>
        <div className="relative w-full overflow-hidden bg-white" style={{ height: '500px', maxHeight: '60vh' }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full h-full touch-none"
            style={{ cursor: isTeacher ? 'crosshair' : 'default' }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        </div>
      </div>
    )
  }

  // Excalidraw mode (still loading or loaded)
  if (!ExcalidrawComp) {
    return (
      <div className="flex flex-col h-full glass rounded-2xl border border-gold/20 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold mb-2" />
        <p className="text-sm text-muted-foreground">جارٍ تحميل السبورة التفاعلية...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full glass rounded-2xl border border-gold/20 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-display font-bold text-sm flex items-center gap-2">
          <Pen className="h-4 w-4 text-gold" />
          السبورة التفاعلية
          {!isTeacher && <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">عرض فقط</span>}
        </h3>
        {isTeacher && (
          <Button size="sm" variant="ghost" onClick={handleSaveClick} className="h-7 gap-1 text-xs hover:bg-gold/10">
            <Save className="h-3 w-3" /> حفظ
          </Button>
        )}
      </div>
      <div
        className="relative w-full overflow-hidden"
        style={{ height: '500px', maxHeight: '60vh' }}
      >
        <ExcalidrawComp
          excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
          initialData={{
            elements: initialElements,
            appState: { viewBackgroundColor: '#FFFFFF', gridSize: null },
          }}
          onChange={handleExcalidrawChange}
          viewModeEnabled={!isTeacher}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: isTeacher,
              clearCanvas: isTeacher,
              export: { saveAsImage: true },
              loadScene: isTeacher,
              saveToActiveFile: isTeacher,
              toggleTheme: false,
            },
            tools: { image: isTeacher },
          }}
          lang="ar"
          theme="light"
        />
      </div>
    </div>
  )
}

/* TODO(phase-5): Add AI handwriting recognition + auto-shape detection. */
