import { useEffect, useRef, useState, useCallback } from 'react'
import Ably from 'ably/promises'
import { ChatMessagePayload, CursorPayload, PresenceUser, WhiteboardUpdatePayload } from '@/types/classroom'

const CURSOR_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899']

export function useRealtimeClassroom(sessionId?: string, userId?: string, userName?: string, userRole?: string) {
  const [connected, setConnected] = useState(false)
  const ablyRef = useRef<Ably.Realtime | null>(null)
  const channelRef = useRef<Ably.RealtimeChannel | null>(null)

  const [presence, setPresence] = useState<PresenceUser[]>([])
  const [yourCursorColor, setYourCursorColor] = useState<string>(CURSOR_COLORS[0])
  const [messages, setMessages] = useState<ChatMessagePayload[]>([])
  const [whiteboardElements, setWhiteboardElements] = useState<any[]>([])
  const [cursors, setCursors] = useState<Map<string, CursorPayload>>(new Map())
  const [codeContent, setCodeContent] = useState<string>('# مرحباً بك!\nprint("Hello, Manhal Academy!")')
  const [codeLanguage, setCodeLanguage] = useState<string>('python')
  const [codeLocked, setCodeLocked] = useState<boolean>(false)
  const [platformUrl, setPlatformUrl] = useState<string | null>(null)
  const [lessonContent, setLessonContent] = useState<string>('')

  useEffect(() => {
    if (!sessionId || !userId || !userName) return

    // Choose random color
    const color = CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]
    setYourCursorColor(color)

    const client = new Ably.Realtime({ authUrl: '/api/ably/auth' })
    ablyRef.current = client

    const channel = client.channels.get(`classroom:${sessionId}`)
    channelRef.current = channel

    client.connection.on('connected', () => setConnected(true))
    client.connection.on('disconnected', () => setConnected(false))
    client.connection.on('failed', () => setConnected(false))

    // Presence
    const presenceData = { userId, name: userName, role: userRole ?? 'PARENT', cursorColor: color }
    channel.presence.enter(presenceData)

    channel.presence.subscribe((msg) => {
      channel.presence.get((err, members) => {
        if (members) {
          const currentUsers: PresenceUser[] = members.map(m => ({
            userId: m.data.userId,
            name: m.data.name,
            role: m.data.role,
            cursorColor: m.data.cursorColor,
            isOnline: true
          }))
          setPresence(currentUsers)
        }
      })
    })

    // Subscriptions
    channel.subscribe('chat:message', (msg) => {
      const payload = msg.data as ChatMessagePayload
      setMessages((prev) => prev.some(m => m.messageId === payload.messageId) ? prev : [...prev, payload])
    })

    channel.subscribe('whiteboard:update', (msg) => {
      setWhiteboardElements(msg.data.elements)
    })

    channel.subscribe('whiteboard:state', (msg) => {
      if (msg.data.toUserId === userId) {
        setWhiteboardElements(msg.data.elements)
      }
    })

    channel.subscribe('whiteboard:request-state', (msg) => {
      window.dispatchEvent(new CustomEvent('whiteboard:request-state', { detail: { fromUserId: msg.data.fromUserId } }))
    })

    channel.subscribe('cursor:move', (msg) => {
      const payload = msg.data as CursorPayload
      if (payload.userId !== userId) {
        setCursors((prev) => {
          const next = new Map(prev)
          next.set(payload.userId, payload)
          return next
        })
      }
    })

    channel.subscribe('code:update', (msg) => {
      setCodeContent(msg.data.code)
      setCodeLanguage(msg.data.language)
    })

    channel.subscribe('code:lock', (msg) => {
      setCodeLocked(msg.data.locked)
    })

    channel.subscribe('platform:update', (msg) => {
      setPlatformUrl(msg.data.url)
    })

    channel.subscribe('lesson:update', (msg) => {
      setLessonContent(msg.data.content)
    })

    channel.subscribe('focus:alert', (msg) => {
      window.dispatchEvent(new CustomEvent('focus:alert', { detail: msg.data }))
    })

    return () => {
      channel.presence.leave()
      client.close()
      setConnected(false)
      setPresence([])
      setCursors(new Map())
    }
  }, [sessionId, userId, userName, userRole])

  const sendChatMessage = useCallback((msg: Omit<ChatMessagePayload, 'sessionId' | 'userId' | 'senderName' | 'senderRole'>) => {
      if (!channelRef.current || !sessionId || !userId || !userName) return
      const payload: ChatMessagePayload = { ...msg, sessionId, userId, senderName: userName, senderRole: userRole ?? 'PARENT' }
      channelRef.current.publish('chat:message', payload)
    }, [sessionId, userId, userName, userRole])

  const sendWhiteboardUpdate = useCallback((elements: any[], appState?: any) => {
      channelRef.current?.publish('whiteboard:update', { sessionId, elements, appState })
    }, [sessionId])

  const respondWhiteboardState = useCallback((toSocketId: string, elements: any[], appState?: any) => {
      // toSocketId is basically toUserId in Ably implementation
      channelRef.current?.publish('whiteboard:state', { sessionId, toUserId: toSocketId, elements, appState })
    }, [sessionId])

  const requestWhiteboardState = useCallback(() => {
      channelRef.current?.publish('whiteboard:request-state', { sessionId, fromUserId: userId })
    }, [sessionId, userId])

  const sendCursorMove = useCallback((x: number, y: number) => {
      channelRef.current?.publish('cursor:move', { sessionId, userId, x, y })
    }, [sessionId, userId])

  const sendCodeUpdate = useCallback((code: string, language: string) => {
      channelRef.current?.publish('code:update', { sessionId, code, language })
    }, [sessionId])

  const sendCodeLock = useCallback((locked: boolean) => {
      channelRef.current?.publish('code:lock', { sessionId, locked })
      setCodeLocked(locked)
    }, [sessionId])

  const sendFocusAlert = useCallback((name: string) => {
      channelRef.current?.publish('focus:alert', { sessionId, userId, name })
    }, [sessionId, userId])

  const sendPlatformUpdate = useCallback((url: string) => {
      channelRef.current?.publish('platform:update', { sessionId, url })
    }, [sessionId])

  const sendLessonUpdate = useCallback((content: string) => {
      channelRef.current?.publish('lesson:update', { sessionId, content })
    }, [sessionId])

  return {
    connected, presence, yourCursorColor, messages, setMessages,
    whiteboardElements, setWhiteboardElements, cursors,
    sendChatMessage, sendWhiteboardUpdate, respondWhiteboardState, requestWhiteboardState, sendCursorMove,
    codeContent, setCodeContent, codeLanguage, setCodeLanguage, codeLocked,
    sendCodeUpdate, sendCodeLock, sendFocusAlert,
    platformUrl, lessonContent, sendPlatformUpdate, sendLessonUpdate,
  }
}
