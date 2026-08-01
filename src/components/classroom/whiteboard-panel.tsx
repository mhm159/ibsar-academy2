'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Pen,
  Highlighter,
  Type,
  Square,
  Circle,
  Minus,
  ArrowUpRight,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Save,
  Eye,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type WbPoint = { x: number; y: number }

type WbElement = {
  id: string
  type: 'stroke' | 'line' | 'arrow' | 'rect' | 'ellipse' | 'text' | 'image'
  tool: 'pen' | 'highlighter' | 'eraser' | 'line' | 'arrow' | 'rect' | 'ellipse' | 'text' | 'image'
  color: string
  width: number
  opacity: number
  points?: WbPoint[]
  x?: number
  y?: number
  x2?: number
  y2?: number
  text?: string
  fontSize?: number
  src?: string
}

type Tool = WbElement['tool']

interface WhiteboardPanelProps {
  initialElements: any[]
  realtimeElements: any[]
  isTeacher: boolean
  onElementsChange: (elements: any[]) => void
  onStateRequest: (callback: (toSocketId: string) => void) => void
  onSave: (elements: any[]) => void
}

const COLORS = ['#0F172A', '#1B6CA8', '#0D9488', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

const SIZES = [
  { value: 'S' as const, label: 'رفيع' },
  { value: 'M' as const, label: 'وسط' },
  { value: 'L' as const, label: 'سميك' },
]

const TOOLS: { tool: Tool; icon: any; label: string }[] = [
  { tool: 'pen', icon: Pen, label: 'قلم' },
  { tool: 'highlighter', icon: Highlighter, label: 'مميز' },
  { tool: 'line', icon: Minus, label: 'خط' },
  { tool: 'arrow', icon: ArrowUpRight, label: 'سهم' },
  { tool: 'rect', icon: Square, label: 'مربع' },
  { tool: 'ellipse', icon: Circle, label: 'دائرة' },
  { tool: 'text', icon: Type, label: 'نص' },
  { tool: 'eraser', icon: Eraser, label: 'ممحاة' },
]

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

const imageCache = new Map<string, HTMLImageElement>()

function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const MAX = 1400
      const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.max(1, Math.round(img.naturalWidth * scale))
      const h = Math.max(1, Math.round(img.naturalHeight * scale))
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('canvas unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg'
      resolve(c.toDataURL(isJpeg ? 'image/jpeg' : 'image/png', 0.85))
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image load failed'))
    }
    img.src = url
  })
}

function normalizeElements(raw: any[]): WbElement[] {
  const validTypes = ['stroke', 'line', 'arrow', 'rect', 'ellipse', 'text', 'image']
  const validTools = ['pen', 'highlighter', 'eraser', 'line', 'arrow', 'rect', 'ellipse', 'text', 'image']
  return raw.map((r, i) => {
    const type = validTypes.includes(r.type) ? r.type : 'stroke'
    const tool = validTools.includes(r.tool) ? r.tool : type === 'stroke' ? 'pen' : type
    return {
      id: r.id ?? `e-${Date.now()}-${i}`,
      type,
      tool,
      color: r.color ?? '#1B6CA8',
      width: typeof r.width === 'number' ? r.width : 4,
      opacity: typeof r.opacity === 'number' ? r.opacity : 1,
      points: r.points,
      x: r.x,
      y: r.y,
      x2: r.x2,
      y2: r.y2,
      text: r.text,
      fontSize: r.fontSize,
      src: r.src,
    }
  })
}

function drawElement(ctx: CanvasRenderingContext2D, el: WbElement, onImageLoad?: () => void) {
  ctx.save()
  ctx.globalAlpha = el.opacity
  ctx.strokeStyle = el.color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.fillStyle = el.color

  if (el.type === 'stroke') {
    if (!el.points || el.points.length < 2) {
      ctx.restore()
      return
    }
    ctx.lineWidth = el.width
    ctx.beginPath()
    ctx.moveTo(el.points[0].x, el.points[0].y)
    for (let i = 1; i < el.points.length; i++) ctx.lineTo(el.points[i].x, el.points[i].y)
    ctx.stroke()
  } else if (el.type === 'line') {
    ctx.lineWidth = el.width
    ctx.beginPath()
    ctx.moveTo(el.x ?? 0, el.y ?? 0)
    ctx.lineTo(el.x2 ?? 0, el.y2 ?? 0)
    ctx.stroke()
  } else if (el.type === 'arrow') {
    const x1 = el.x ?? 0
    const y1 = el.y ?? 0
    const x2 = el.x2 ?? 0
    const y2 = el.y2 ?? 0
    const len = Math.hypot(x2 - x1, y2 - y1)
    if (len < 1) {
      ctx.restore()
      return
    }
    ctx.lineWidth = el.width
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    const ang = Math.atan2(y2 - y1, x2 - x1)
    const hs = Math.min(12, len * 0.25)
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - hs * Math.cos(ang - Math.PI / 7), y2 - hs * Math.sin(ang - Math.PI / 7))
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - hs * Math.cos(ang + Math.PI / 7), y2 - hs * Math.sin(ang + Math.PI / 7))
    ctx.stroke()
  } else if (el.type === 'rect') {
    ctx.lineWidth = el.width
    ctx.strokeRect(Math.min(el.x ?? 0, el.x2 ?? 0), Math.min(el.y ?? 0, el.y2 ?? 0), Math.abs((el.x2 ?? 0) - (el.x ?? 0)), Math.abs((el.y2 ?? 0) - (el.y ?? 0)))
  } else if (el.type === 'ellipse') {
    ctx.lineWidth = el.width
    const rx = Math.abs((el.x2 ?? 0) - (el.x ?? 0)) / 2
    const ry = Math.abs((el.y2 ?? 0) - (el.y ?? 0)) / 2
    ctx.beginPath()
    ctx.ellipse(((el.x ?? 0) + (el.x2 ?? 0)) / 2, ((el.y ?? 0) + (el.y2 ?? 0)) / 2, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2)
    ctx.stroke()
  } else if (el.type === 'text' && el.text) {
    const fs = el.fontSize ?? 22
    ctx.font = `500 ${fs}px 'Tajawal', 'Cairo', system-ui, sans-serif`
    ctx.textBaseline = 'top'
    const lines = el.text.split('\n')
    lines.forEach((ln, i) => ctx.fillText(ln, el.x ?? 0, (el.y ?? 0) + i * fs * 1.3))
  } else if (el.type === 'image' && el.src) {
    const x1 = Math.min(el.x ?? 0, el.x2 ?? 0)
    const y1 = Math.min(el.y ?? 0, el.y2 ?? 0)
    const w = Math.abs((el.x2 ?? 0) - (el.x ?? 0))
    const h = Math.abs((el.y2 ?? 0) - (el.y ?? 0))
    if (w < 2 || h < 2) {
      ctx.restore()
      return
    }
    const cached = imageCache.get(el.src)
    if (cached && cached.complete && cached.naturalWidth > 0) {
      const natW = cached.naturalWidth
      const natH = cached.naturalHeight
      const scale = Math.min(w / natW, h / natH)
      const dw = natW * scale
      const dh = natH * scale
      ctx.drawImage(cached, x1 + (w - dw) / 2, y1 + (h - dh) / 2, dw, dh)
    } else if (onImageLoad) {
      const img = new Image()
      img.onload = () => {
        imageCache.set(el.src!, img)
        onImageLoad()
      }
      img.src = el.src
    }
  }

  ctx.restore()
}

export function WhiteboardPanel({
  initialElements,
  realtimeElements,
  isTeacher,
  onElementsChange,
  onSave,
}: WhiteboardPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dprRef = useRef(1)

  const [elements, setElements] = useState<WbElement[]>(() => normalizeElements(initialElements))
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#1B6CA8')
  const [size, setSize] = useState<'S' | 'M' | 'L'>('M')
  const [textInput, setTextInput] = useState<WbPoint | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [imgTick, setImgTick] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const elementsRef = useRef<WbElement[]>(elements)
  const draftRef = useRef<WbElement | null>(null)
  const drawingRef = useRef(false)
  const pastRef = useRef<WbElement[][]>([])
  const futureRef = useRef<WbElement[][]>([])
  const lastBroadcast = useRef(0)
  const lastSave = useRef(0)
  const textValueRef = useRef('')
  const appliedInitial = useRef(false)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = dprRef.current
    const w = canvas.width / dpr
    const h = canvas.height / dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#DDE4EC'
    const gs = 26
    for (let gx = gs; gx < w; gx += gs) {
      for (let gy = gs; gy < h; gy += gs) {
        ctx.beginPath()
        ctx.arc(gx, gy, 1.1, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    for (const el of elementsRef.current) drawElement(ctx, el, () => setImgTick((t) => t + 1))
    if (draftRef.current) drawElement(ctx, draftRef.current, () => setImgTick((t) => t + 1))
  }, [])

  useEffect(() => {
    redraw()
  }, [imgTick, redraw])

  const applyElements = useCallback(
    (next: WbElement[]) => {
      setElements(next)
      elementsRef.current = next
      redraw()
    },
    [redraw],
  )

  useEffect(() => {
    const el = containerRef.current
    const canvas = canvasRef.current
    if (!el || !canvas) return
    const resize = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      dprRef.current = dpr
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      redraw()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [redraw])

  useEffect(() => {
    if (appliedInitial.current) return
    if (initialElements.length > 0) {
      appliedInitial.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect -- apply saved board once loaded
      applyElements(normalizeElements(initialElements))
    }
  }, [initialElements, applyElements])

  useEffect(() => {
    if (isTeacher || realtimeElements.length === 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror realtime board state
    applyElements(normalizeElements(realtimeElements))
  }, [realtimeElements, isTeacher, applyElements])

  useEffect(() => {
    if (!isTeacher) return
    const handler = () => {
      onElementsChange(elementsRef.current)
    }
    window.addEventListener('whiteboard:request-state', handler)
    return () => window.removeEventListener('whiteboard:request-state', handler)
  }, [isTeacher, onElementsChange])

  const broadcast = useCallback(
    (next: WbElement[]) => {
      const now = Date.now()
      if (now - lastBroadcast.current > 80) {
        lastBroadcast.current = now
        onElementsChange(next)
      }
    },
    [onElementsChange],
  )

  const scheduleSave = useCallback(
    (next: WbElement[]) => {
      const now = Date.now()
      if (now - lastSave.current > 3000) {
        lastSave.current = now
        onSave(next)
      }
    },
    [onSave],
  )

  const pushHistory = useCallback(() => {
    pastRef.current.push(elementsRef.current)
    if (pastRef.current.length > 80) pastRef.current.shift()
    futureRef.current = []
    setCanUndo(true)
    setCanRedo(false)
  }, [])

  const commitElements = useCallback(
    (next: WbElement[]) => {
      applyElements(next)
      onElementsChange(next)
      scheduleSave(next)
    },
    [applyElements, onElementsChange, scheduleSave],
  )

  const penWidth = size === 'S' ? 2 : size === 'M' ? 4 : 7
  const hlWidth = size === 'S' ? 12 : size === 'M' ? 18 : 26
  const erWidth = size === 'S' ? 14 : size === 'M' ? 22 : 32

  const getPos = (e: React.PointerEvent): WbPoint => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const pickImage = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    try {
      const src = await processImageFile(file)
      setPendingImage(src)
      setTool('image')
    } catch {
      /* ignore */
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    void pickImage(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (!isTeacher) return
    e.preventDefault()
    void pickImage(e.dataTransfer.files?.[0])
  }

  const startDraw = (e: React.PointerEvent) => {
    if (!isTeacher) return
    e.preventDefault()
    const pos = getPos(e)

    if (tool === 'text') {
      setTextInput(pos)
      return
    }

    canvasRef.current?.setPointerCapture(e.pointerId)
    drawingRef.current = true
    pushHistory()

    if (tool === 'image') {
      if (!pendingImage) {
        drawingRef.current = false
        return
      }
      draftRef.current = {
        id: uid(),
        type: 'image',
        tool: 'image',
        color: '#1B6CA8',
        width: 2,
        opacity: 1,
        src: pendingImage,
        x: pos.x,
        y: pos.y,
        x2: pos.x,
        y2: pos.y,
      }
      redraw()
      return
    }

    const base = {
      id: uid(),
      color: tool === 'eraser' ? '#FFFFFF' : color,
      opacity: tool === 'highlighter' ? 0.4 : 1,
      x: pos.x,
      y: pos.y,
      x2: pos.x,
      y2: pos.y,
    }

    let draft: WbElement
    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      draft = { ...base, type: 'stroke', tool, width: tool === 'highlighter' ? hlWidth : tool === 'eraser' ? erWidth : penWidth, points: [pos] }
    } else {
      draft = { ...base, type: tool, tool, width: penWidth }
    }

    draftRef.current = draft
    redraw()
  }

  const moveDraw = (e: React.PointerEvent) => {
    if (!drawingRef.current || !isTeacher) return
    e.preventDefault()
    const pos = getPos(e)
    const d = draftRef.current
    if (!d) return

    if (d.type === 'stroke') {
      d.points = [...(d.points ?? []), pos]
    } else {
      d.x2 = pos.x
      d.y2 = pos.y
    }
    redraw()
    broadcast([...elementsRef.current, { ...d, points: d.points ? [...d.points] : undefined }])
  }

  const endDraw = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const d = draftRef.current
    draftRef.current = null
    if (!d) return
    if (d.type === 'image' && (Math.abs((d.x2 ?? 0) - (d.x ?? 0)) < 4 || Math.abs((d.y2 ?? 0) - (d.y ?? 0)) < 4)) {
      pastRef.current.pop()
      setCanUndo(pastRef.current.length > 0)
      setPendingImage(null)
      setTool('pen')
      return
    }
    commitElements([...elementsRef.current, d])
    if (d.type === 'image') {
      setPendingImage(null)
      setTool('pen')
    }
  }

  const commitText = () => {
    const pos = textInput
    setTextInput(null)
    const val = textValueRef.current.trim()
    textValueRef.current = ''
    if (!pos || !val) return
    pushHistory()
    commitElements([
      ...elementsRef.current,
      { id: uid(), type: 'text', tool: 'text', color, opacity: 1, width: penWidth, x: pos.x, y: pos.y, text: val, fontSize: 22 },
    ])
    setTool('pen')
  }

  const handleUndo = () => {
    const past = pastRef.current
    if (!past.length) return
    futureRef.current.push(elementsRef.current)
    applyElements(past.pop()!)
    onElementsChange(elementsRef.current)
    setCanUndo(pastRef.current.length > 0)
    setCanRedo(true)
  }

  const handleRedo = () => {
    const future = futureRef.current
    if (!future.length) return
    pastRef.current.push(elementsRef.current)
    applyElements(future.pop()!)
    onElementsChange(elementsRef.current)
    setCanRedo(futureRef.current.length > 0)
    setCanUndo(true)
  }

  const handleClear = () => {
    if (!isTeacher) return
    if (!confirm('مسح كل ما على السبورة؟')) return
    pushHistory()
    commitElements([])
  }

  const handleSave = () => {
    onSave(elementsRef.current)
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'whiteboard.png'
    a.click()
  }

  return (
    <div className="flex flex-col h-full glass rounded-2xl border border-gold/20 overflow-hidden">
      <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-display font-bold text-sm flex items-center gap-2 text-white">
          <Pen className="h-4 w-4 text-gold" />
          السبورة التفاعلية
          {!isTeacher && (
            <span className="flex items-center gap-1 text-[0.65rem] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              <Eye className="h-3 w-3" /> عرض فقط
            </span>
          )}
        </h3>
        {isTeacher && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={handleSave} className="h-7 gap-1 text-xs hover:bg-gold/10">
              <Save className="h-3 w-3" /> حفظ
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDownload} className="h-7 gap-1 text-xs hover:bg-gold/10">
              <Download className="h-3 w-3" /> تنزيل
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClear} className="h-7 gap-1 text-xs hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-3 w-3" /> مسح
            </Button>
          </div>
        )}
      </div>

      {isTeacher && (
        <div className="px-2 py-1.5 border-b border-border/50 flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/10 border border-white/10">
            {TOOLS.map(({ tool: t, icon: Icon, label }) => (
              <button
                key={t}
                type="button"
                title={label}
                onClick={() => setTool(t)}
                className={cn(
                  'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
                  tool === t ? 'bg-gold text-night shadow-sm' : 'text-white/70 hover:bg-gold/25 hover:text-white',
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <button
              type="button"
              title="إضافة صورة"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'h-7 w-7 rounded-md flex items-center justify-center transition-colors border-r border-white/10',
                tool === 'image' ? 'bg-gold text-night shadow-sm' : 'text-white/70 hover:bg-gold/25 hover:text-white',
              )}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/10 border border-white/10">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => setColor(c)}
                className={cn(
                  'h-5 w-5 rounded-full border transition-transform',
                  color === c ? 'scale-110 ring-2 ring-gold ring-offset-1 ring-offset-night border-white' : 'border-black/10 hover:scale-105',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/10 border border-white/10">
            {SIZES.map((s) => (
              <button
                key={s.value}
                type="button"
                title={s.label}
                onClick={() => setSize(s.value)}
                className={cn(
                  'h-7 px-2.5 rounded-md text-[0.7rem] font-medium transition-colors',
                  size === s.value ? 'bg-gold text-night' : 'text-white/70 hover:bg-gold/25 hover:text-white',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/10 border border-white/10 ms-auto">
            <button type="button" title="تراجع" onClick={handleUndo} className="h-7 w-7 rounded-md flex items-center justify-center text-white/70 hover:bg-gold/25 hover:text-white disabled:opacity-40" disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </button>
            <button type="button" title="إعادة" onClick={handleRedo} className="h-7 w-7 rounded-md flex items-center justify-center text-white/70 hover:bg-gold/25 hover:text-white disabled:opacity-40" disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-white"
        style={{ height: 'min(58vh, 500px)' }}
        onDragOver={(e) => {
          if (isTeacher) e.preventDefault()
        }}
        onDrop={handleDrop}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none select-none"
          style={{ cursor: isTeacher ? 'crosshair' : 'default' }}
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerCancel={endDraw}
        />
        {tool === 'image' && pendingImage && isTeacher && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-night/85 text-white text-xs px-3 py-1.5 rounded-lg border border-gold/40 pointer-events-none shadow-lg">
            اسحب على السبورة لتحديد مكان الصورة وحجمها
          </div>
        )}
        {textInput && isTeacher && (
          <div className="absolute z-10" style={{ left: textInput.x, top: textInput.y, transform: 'translateY(-1.3em)' }}>
            <textarea
              autoFocus
              rows={1}
              onChange={(e) => { textValueRef.current = e.target.value }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  commitText()
                }
              }}
              onBlur={commitText}
              placeholder="اكتب النص..."
              className="bg-white border border-gold/70 rounded-lg shadow-xl px-2.5 py-1.5 text-[15px] font-medium text-night outline-none resize-none"
              style={{ minWidth: 150, maxWidth: 340 }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
