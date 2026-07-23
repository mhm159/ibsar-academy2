'use client'
import { formatTime } from '@/lib/datetime'

import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, MessageCircle, Paperclip } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChatMessagePayload, PresenceUser } from './use-realtime-classroom'

interface ChatPanelProps {
  messages: ChatMessagePayload[]
  onSend: (text: string) => void
  presence: PresenceUser[]
  currentUserId: string | null
  connected: boolean
}

const ROLE_COLORS: Record<string, string> = {
  TEACHER: 'var(--emerald-egypt)',
  PARENT: 'var(--azure)',
  ADMIN: 'var(--gold)',
  STUDENT: 'var(--kids-teal)',
}

const ROLE_LABELS: Record<string, string> = {
  TEACHER: 'معلم',
  PARENT: 'ولي أمر',
  ADMIN: 'إدارة',
  STUDENT: 'طالب',
}

export function ChatPanel({
  messages,
  onSend,
  presence,
  currentUserId,
  connected,
}: ChatPanelProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    onSend(text.trim())
    setText('')
    setSending(false)
  }

  const fmtTime = (iso: string) =>
    formatTime(iso)

  return (
    <div className="flex flex-col h-full glass rounded-2xl border border-gold/20 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-display font-bold text-sm flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-gold" />
          محادثة الحصة
        </h3>
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full font-bold',
          connected ? 'bg-emerald-egypt/15 text-emerald-egypt' : 'bg-muted text-muted-foreground',
        )}>
          {connected ? `متصل • ${presence.length}` : 'غير متصل'}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[400px] lg:max-h-none"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">لا توجد رسائل بعد</p>
            <p className="text-xs text-muted-foreground mt-1">ابدأ المحادثة مع المعلم</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUserId
            const color = ROLE_COLORS[msg.senderRole] ?? 'var(--muted-foreground)'
            return (
              <div
                key={msg.messageId}
                className={cn(
                  'flex flex-col gap-0.5',
                  isMe ? 'items-start' : 'items-end',
                )}
              >
                {!isMe && (
                  <div className="flex items-center gap-1.5 px-2">
                    <span
                      className="text-xs font-bold"
                      style={{ color }}
                    >
                      {msg.senderName}
                    </span>
                    <span
                      className="text-[0.6rem] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
                    >
                      {ROLE_LABELS[msg.senderRole] ?? msg.senderRole}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                    isMe
                      ? 'bg-gradient-to-l from-gold to-[#E8D488] text-night rounded-bl-sm'
                      : 'bg-muted text-foreground rounded-br-sm',
                  )}
                >
                  <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                  {msg.attachmentUrl && (
                    <a
                      href={msg.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-xs underline opacity-80"
                    >
                      📎 مرفق
                    </a>
                  )}
                </div>
                <span className="text-[0.6rem] text-muted-foreground px-2">
                  {fmtTime(msg.createdAt)}
                  {isMe && ' • أنت'}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-border/50 flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب رسالة..."
          disabled={!connected}
          className="h-10 flex-1"
          maxLength={500}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || sending || !connected}
          className="h-10 w-10 rounded-full bg-gradient-to-l from-gold to-[#E8D488] text-night hover:shadow-lg shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}

/* TODO(phase-4): Add file upload (images/PDF) via Supabase Storage. */
