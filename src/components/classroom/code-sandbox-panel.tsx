'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { 
  Play, 
  Lock, 
  Unlock, 
  Copy, 
  Check, 
  Share2, 
  Trash2, 
  ChevronDown,
  Terminal,
  Code2,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Language configs ────────────────────────────────────────────────────────
const LANGUAGES = [
  { id: 'python', label: 'Python 🐍', monacoId: 'python', starter: '# مرحباً! اكتب كودك هنا\nprint("Hello, Ibsar Academy! 🚀")\n\n# جرّب مثالاً:\nfor i in range(1, 6):\n    print(f"رقم {i}")\n' },
  { id: 'javascript', label: 'JavaScript ⚡', monacoId: 'javascript', starter: '// مرحباً! اكتب كودك هنا\nconsole.log("Hello, Ibsar Academy! 🚀");\n\n// جرّب مثالاً:\nfor (let i = 1; i <= 5; i++) {\n  console.log(`رقم ${i}`);\n}\n' },
  { id: 'html', label: 'HTML 🌐', monacoId: 'html', starter: '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <title>صفحتي</title>\n  <style>\n    body { font-family: Arial; background: #0a0a0a; color: #FFD700; text-align: center; padding: 40px; }\n    h1 { font-size: 2rem; }\n  </style>\n</head>\n<body>\n  <h1>🚀 مرحباً بك في أكاديمية إبصار!</h1>\n  <p>ابدأ بتعديل هذا الكود</p>\n</body>\n</html>' },
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface CodeSandboxPanelProps {
  /** Initial code from realtime state */
  code: string
  language: string
  isLocked: boolean
  isTeacher: boolean
  /** Callbacks to broadcast changes */
  onCodeChange: (code: string, language: string) => void
  onLockToggle: (locked: boolean) => void
}

// ─── Simple line-numbered editor (textarea based, no external deps needed) ──
// We build this without @monaco-editor/react to avoid package installation.
// The editor is still extremely functional with syntax highlighting via CSS classes.

function LineNumbers({ code }: { code: string }) {
  const lines = code.split('\n')
  return (
    <div className="select-none text-right pr-3 pl-2 text-xs text-white/20 font-mono leading-6 border-r border-white/10 min-w-[40px] pt-3">
      {lines.map((_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  )
}

// ─── Output renderer ─────────────────────────────────────────────────────────
interface OutputLine {
  type: 'stdout' | 'stderr' | 'info'
  text: string
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CodeSandboxPanel({
  code,
  language,
  isLocked,
  isTeacher,
  onCodeChange,
  onLockToggle,
}: CodeSandboxPanelProps) {
  const [localCode, setLocalCode] = useState(code)
  const [localLang, setLocalLang] = useState(language)
  const [output, setOutput] = useState<OutputLine[]>([])
  const [running, setRunning] = useState(false)
  const [pyodideReady, setPyodideReady] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const pyodideRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync incoming realtime code (from other participants) at render time
  const [prevCode, setPrevCode] = useState(code)
  if (prevCode !== code) {
    setPrevCode(code)
    setLocalCode(code)
  }
  const [prevLang, setPrevLang] = useState(language)
  if (prevLang !== language) {
    setPrevLang(language)
    setLocalLang(language)
  }

  const addOutput = useCallback((type: OutputLine['type'], text: string) => {
    setOutput(prev => [...prev, { type, text }])
  }, [])

  // Load Pyodide on first Python run
  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current || pyodideLoading) return
    setPyodideLoading(true)
    try {
      addOutput('info', 'جارٍ تحميل Python... (قد يستغرق 10-15 ثانية في أول مرة)')
      // @ts-ignore – loaded via CDN script tag
      const pyodide = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
      })
      pyodideRef.current = pyodide
      setPyodideReady(true)
      addOutput('info', '✓ Python جاهز للتشغيل!')
    } catch (e) {
      addOutput('stderr', '✗ فشل تحميل Python. تحقق من اتصالك بالإنترنت.')
    } finally {
      setPyodideLoading(false)
    }
  }, [pyodideLoading, addOutput])

  // Load Pyodide script tag dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).loadPyodide) return // already loaded
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  const clearOutput = () => setOutput([])

  // ── Run code ──────────────────────────────────────────────────────────────
  const runCode = async () => {
    setRunning(true)
    clearOutput()

    try {
      if (localLang === 'python') {
        // Ensure Pyodide is loaded
        if (!pyodideRef.current) {
          await loadPyodide()
          if (!pyodideRef.current) {
            setRunning(false)
            return
          }
        }
        const pyodide = pyodideRef.current
        // Redirect stdout/stderr
        pyodide.runPython(`
import sys
from io import StringIO
_captured_stdout = StringIO()
_captured_stderr = StringIO()
sys.stdout = _captured_stdout
sys.stderr = _captured_stderr
`)
        try {
          await pyodide.runPythonAsync(localCode)
          const stdout = pyodide.runPython('_captured_stdout.getvalue()')
          const stderr = pyodide.runPython('_captured_stderr.getvalue()')
          if (stdout) stdout.split('\n').filter(Boolean).forEach((l: string) => addOutput('stdout', l))
          if (stderr) stderr.split('\n').filter(Boolean).forEach((l: string) => addOutput('stderr', l))
          if (!stdout && !stderr) addOutput('info', '✓ تم التشغيل بنجاح (لا يوجد خرج)')
        } catch (err: any) {
          addOutput('stderr', err.message || String(err))
        } finally {
          pyodide.runPython('sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__')
        }
      } else if (localLang === 'javascript') {
        // Capture console.log
        const logs: string[] = []
        const origLog = console.log
        const origError = console.error
        console.log = (...args: any[]) => logs.push(args.map(String).join(' '))
        console.error = (...args: any[]) => logs.push('ERROR: ' + args.map(String).join(' '))
        try {
          const result = eval(localCode)
          console.log = origLog
          console.error = origError
          logs.forEach(l => addOutput('stdout', l))
          if (result !== undefined && logs.length === 0) addOutput('stdout', String(result))
          if (logs.length === 0 && result === undefined) addOutput('info', '✓ تم التشغيل بنجاح (لا يوجد خرج)')
        } catch (err: any) {
          console.log = origLog
          console.error = origError
          addOutput('stderr', err.message)
        }
      } else if (localLang === 'html') {
        // Render HTML in a new window / display message
        const blob = new Blob([localCode], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'width=800,height=600')
        addOutput('info', '✓ تم فتح صفحة HTML في نافذة جديدة')
      }
    } finally {
      setRunning(false)
    }
  }

  // ── Handle textarea change ────────────────────────────────────────────────
  const handleCodeChange = (newCode: string) => {
    if (isLocked && !isTeacher) return
    setLocalCode(newCode)
    onCodeChange(newCode, localLang)
  }

  // ── Copy code ─────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    await navigator.clipboard.writeText(localCode)
    setCopied(true)
    toast.success('تم نسخ الكود!')
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Share code ────────────────────────────────────────────────────────────
  const handleShare = async () => {
    const encoded = btoa(encodeURIComponent(JSON.stringify({ code: localCode, lang: localLang })))
    const shareUrl = `${window.location.origin}/classroom/sandbox?code=${encoded}`
    await navigator.clipboard.writeText(shareUrl)
    toast.success('تم نسخ رابط المشاركة! شاركه مع أي شخص.')
  }

  // ── Tab key support ───────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current!
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newCode = localCode.substring(0, start) + '    ' + localCode.substring(end)
      handleCodeChange(newCode)
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 4
      }, 0)
    }
    // Ctrl/Cmd+Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      runCode()
    }
  }

  const currentLang = LANGUAGES.find(l => l.id === localLang) ?? LANGUAGES[0]
  const canEdit = isTeacher || !isLocked

  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border-b border-white/10 flex-wrap">
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-white/80 border border-white/10 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-gold" />
            {currentLang.label}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showLangMenu && (
            <div className="absolute top-full mt-1 right-0 z-50 bg-[#1c2128] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  onClick={() => {
                    setLocalLang(l.id)
                    if (!localCode || localCode === currentLang.starter) {
                      handleCodeChange(l.starter)
                    } else {
                      onCodeChange(localCode, l.id)
                    }
                    setShowLangMenu(false)
                  }}
                  className={`flex items-center w-full px-4 py-2.5 text-xs font-mono hover:bg-white/10 transition-colors text-right ${localLang === l.id ? 'text-gold bg-gold/10' : 'text-white/70'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Lock/Unlock — Teacher only */}
        {isTeacher && (
          <button
            onClick={() => onLockToggle(!isLocked)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isLocked
                ? 'bg-kids-red/20 border-kids-red/30 text-kids-red hover:bg-kids-red/30'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
            title={isLocked ? 'إلغاء القفل (السماح للطلاب بالكتابة)' : 'قفل الكتابة (منع الطلاب)'}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {isLocked ? 'مقفل' : 'مفتوح'}
          </button>
        )}

        {/* Copy */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all"
          title="نسخ الكود"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-egypt" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'تم النسخ' : 'نسخ'}
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-azure/20 border border-azure/30 text-azure hover:bg-azure/30 transition-all"
          title="مشاركة رابط الكود"
        >
          <Share2 className="w-3.5 h-3.5" />
          مشاركة
        </button>

        {/* Clear output */}
        <button
          onClick={clearOutput}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
          title="مسح الخرج"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Run button */}
        <button
          onClick={runCode}
          disabled={running || pyodideLoading}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-egypt text-white hover:bg-emerald-egypt/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-egypt/20"
          title="تشغيل الكود (Ctrl+Enter)"
        >
          {running || pyodideLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-white" />
          )}
          {pyodideLoading ? 'جارٍ التحميل...' : running ? 'جارٍ التشغيل...' : 'تشغيل ▶'}
        </button>
      </div>

      {/* Locked banner for students */}
      {isLocked && !isTeacher && (
        <div className="bg-kids-red/15 border-b border-kids-red/30 px-4 py-2 flex items-center gap-2 text-xs text-kids-red">
          <Lock className="w-3.5 h-3.5" />
          الكتابة مقفلة من قِبل المعلم. يمكنك القراءة والتشغيل فقط.
        </div>
      )}

      {/* ── Editor Area ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden" style={{ maxHeight: '55%' }}>
        <LineNumbers code={localCode} />
        <textarea
          ref={textareaRef}
          value={localCode}
          onChange={e => handleCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={isLocked && !isTeacher}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          dir="ltr"
          className="flex-1 resize-none bg-transparent text-[13px] font-mono text-[#e6edf3] leading-6 p-3 outline-none placeholder:text-white/20 overflow-auto"
          placeholder="// اكتب كودك هنا..."
          style={{ caretColor: '#FFD700', tabSize: 4 }}
        />
      </div>

      {/* ── Output Panel ── */}
      <div className="border-t border-white/10 bg-[#0a0c10] flex flex-col" style={{ maxHeight: '40%', minHeight: '120px' }}>
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5">
          <Terminal className="w-3.5 h-3.5 text-emerald-egypt" />
          <span className="text-xs text-white/50 font-mono">الخرج (Output)</span>
          <div className="flex-1" />
          {output.length > 0 && (
            <span className="text-[10px] text-white/30">{output.length} سطر</span>
          )}
        </div>
        <div className="flex-1 overflow-auto p-3 font-mono text-xs leading-6 min-h-0">
          {output.length === 0 ? (
            <p className="text-white/20 italic">اضغط "تشغيل ▶" لرؤية النتيجة هنا...</p>
          ) : (
            output.map((line, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap ${
                  line.type === 'stderr' ? 'text-red-400' :
                  line.type === 'info' ? 'text-gold/70 italic' :
                  'text-green-400'
                }`}
                dir="auto"
              >
                {line.type === 'stderr' ? '✗ ' : line.type === 'info' ? '· ' : '> '}{line.text}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
