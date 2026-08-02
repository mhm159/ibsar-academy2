'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export interface PresenceUser {
  userId: string
  name: string
  role: string
  cursorColor: string
  joinedAt: number
}

export interface ChatMessagePayload {
  sessionId: string
  messageId: string
  userId: string
  senderName: string
  senderRole: string
  text: string
  attachmentUrl?: string
  attachmentType?: string
  createdAt: string
}

export interface WhiteboardUpdatePayload {
  sessionId: string
  elements: any[]
  appState?: any
}

export interface CursorPayload {
  userId: string
  name: string
  color: string
  x: number
  y: number
}

interface UseRealtimeClassroomOptions {
  sessionId: string | null
  userId: string | null
  userName: string | null
  userRole: string | null
}

/**
 * useRealtimeClassroom — connects to the socket.io classroom service
 * (port 3003 via Caddy XTransformPort) and exposes chat, presence,
 * whiteboard, and cursor events.
 */
export function useRealtimeClassroom({
  sessionId,
  userId,
  userName,
  userRole,
}: UseRealtimeClassroomOptions) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [presence, setPresence] = useState<PresenceUser[]>([])
  const [yourCursorColor, setYourCursorColor] = useState<string>('#C9A84C')
  const [messages, setMessages] = useState<ChatMessagePayload[]>([])
  const [whiteboardElements, setWhiteboardElements] = useState<any[]>([])
  const [cursors, setCursors] = useState<Map<string, CursorPayload>>(new Map())
  // Code Sandbox state
  const [codeContent, setCodeContent] = useState<string>('# مرحباً! اكتب كودك هنا\nprint("Hello, Ibsar Academy!")')
  const [codeLanguage, setCodeLanguage] = useState<string>('python')
  const [codeLocked, setCodeLocked] = useState<boolean>(false)
  // Educational platforms + lesson content (broadcast by teacher)
  const [platformUrl, setPlatformUrl] = useState<string | null>(null)
  const [lessonContent, setLessonContent] = useState<string>('')

  // Connect on mount
  useEffect(() => {
    if (!sessionId || !userId) return

    // CRITICAL: connect via Caddy with XTransformPort=3003
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      // Join the session room
      socket.emit('session:join', {
        sessionId,
        userId,
        name: userName ?? 'مشارك',
        role: userRole ?? 'PARENT',
      })
    })

    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setConnected(false))

    // Presence
    socket.on('session:joined', (payload: { users: PresenceUser[]; yourCursorColor: string }) => {
      setPresence(payload.users)
      setYourCursorColor(payload.yourCursorColor)
    })
    socket.on('presence:update', (payload: { users: PresenceUser[] }) => {
      setPresence(payload.users)
    })
    socket.on('user:joined', () => {
      // presence:update will follow
    })
    socket.on('user:left', () => {
      // presence:update will follow
    })

    // Chat
    socket.on('chat:message', (msg: ChatMessagePayload) => {
      setMessages((prev) => {
        // Dedupe by messageId
        if (prev.some((m) => m.messageId === msg.messageId)) return prev
        return [...prev, msg]
      })
    })

    // Whiteboard
    socket.on('whiteboard:update', (payload: WhiteboardUpdatePayload) => {
      setWhiteboardElements(payload.elements)
    })
    socket.on('whiteboard:state', (payload: { elements: any[]; appState?: any }) => {
      setWhiteboardElements(payload.elements)
    })
    socket.on('whiteboard:request-state', () => {
      // If we're the teacher, respond with current state (handled in component)
      // This hook just notifies via callback below
      window.dispatchEvent(new CustomEvent('whiteboard:request-state'))
    })

    // Cursors
    socket.on('cursor:move', (payload: CursorPayload) => {
      setCursors((prev) => {
        const next = new Map(prev)
        next.set(payload.userId, payload)
        return next
      })
    })

    // Code Sandbox
    socket.on('code:update', (payload: { sessionId: string; code: string; language: string }) => {
      setCodeContent(payload.code)
      setCodeLanguage(payload.language)
    })
    socket.on('code:lock', (payload: { locked: boolean }) => {
      setCodeLocked(payload.locked)
    })

    // Educational platforms + lesson content (teacher broadcasts, students receive)
    socket.on('platform:update', (payload: { url: string | null }) => {
      setPlatformUrl(payload.url)
    })
    socket.on('lesson:update', (payload: { content: string }) => {
      setLessonContent(payload.content)
    })

    // AI Focus Tracking
    socket.on('focus:alert', (payload: { sessionId: string; userId: string; name: string }) => {
      // Dispatch a custom event so the UI can show a toast
      window.dispatchEvent(new CustomEvent('focus:alert', { detail: payload }))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
      setPresence([])
      setMessages([])
      setCursors(new Map())
      setCodeLocked(false)
      setPlatformUrl(null)
      setLessonContent('')
    }
  }, [sessionId, userId, userName, userRole])

  // Send chat message (broadcast + persist handled by caller)
  const sendChatMessage = useCallback(
    (msg: Omit<ChatMessagePayload, 'sessionId' | 'userId' | 'senderName' | 'senderRole'>) => {
      if (!socketRef.current || !sessionId || !userId || !userName) return
      const payload: ChatMessagePayload = {
        ...msg,
        sessionId,
        userId,
        senderName: userName,
        senderRole: userRole ?? 'PARENT',
      }
      socketRef.current.emit('chat:send', payload)
    },
    [sessionId, userId, userName, userRole],
  )

  // Broadcast whiteboard update (teacher only)
  const sendWhiteboardUpdate = useCallback(
    (elements: any[], appState?: any) => {
      if (!socketRef.current || !sessionId) return
      socketRef.current.emit('whiteboard:update', { sessionId, elements, appState })
    },
    [sessionId],
  )

  // Respond to whiteboard state request (teacher sends state to new joiner)
  const respondWhiteboardState = useCallback(
    (toSocketId: string, elements: any[], appState?: any) => {
      if (!socketRef.current || !sessionId) return
      socketRef.current.emit('whiteboard:send-state', {
        sessionId,
        toSocketId,
        elements,
        appState,
      })
    },
    [sessionId],
  )

  // Request current whiteboard state (new joiner asks)
  const requestWhiteboardState = useCallback(() => {
    if (!socketRef.current || !sessionId) return
    socketRef.current.emit('whiteboard:request-state', { sessionId })
  }, [sessionId])

  // Broadcast cursor move
  const sendCursorMove = useCallback(
    (x: number, y: number) => {
      if (!socketRef.current || !sessionId) return
      socketRef.current.emit('cursor:move', { sessionId, x, y })
    },
    [sessionId],
  )

  // Broadcast code update (any participant can write unless locked)
  const sendCodeUpdate = useCallback(
    (code: string, language: string) => {
      if (!socketRef.current || !sessionId) return
      socketRef.current.emit('code:update', { sessionId, code, language })
    },
    [sessionId],
  )

  // Teacher locks/unlocks code editing for students
  const sendCodeLock = useCallback(
    (locked: boolean) => {
      if (!socketRef.current || !sessionId) return
      socketRef.current.emit('code:lock', { sessionId, locked })
      setCodeLocked(locked)
    },
    [sessionId],
  )

  // AI Focus Tracking: send alert when student is distracted
  const sendFocusAlert = useCallback(
    (name: string) => {
      if (!socketRef.current || !sessionId || !userId) return
      socketRef.current.emit('focus:alert', { sessionId, userId, name })
    },
    [sessionId, userId],
  )

  // Teacher broadcasts which educational platform students should open
  const sendPlatformUpdate = useCallback(
    (url: string) => {
      if (!socketRef.current || !sessionId) return
      socketRef.current.emit('platform:update', { sessionId, url })
    },
    [sessionId],
  )

  // Teacher broadcasts lesson content to students
  const sendLessonUpdate = useCallback(
    (content: string) => {
      if (!socketRef.current || !sessionId) return
      socketRef.current.emit('lesson:update', { sessionId, content })
    },
    [sessionId],
  )

  return {
    connected,
    presence,
    yourCursorColor,
    messages,
    setMessages,
    whiteboardElements,
    setWhiteboardElements,
    cursors,
    sendChatMessage,
    sendWhiteboardUpdate,
    respondWhiteboardState,
    requestWhiteboardState,
    sendCursorMove,
    // Code Sandbox
    codeContent,
    setCodeContent,
    codeLanguage,
    setCodeLanguage,
    codeLocked,
    sendCodeUpdate,
    sendCodeLock,
    sendFocusAlert,
    // Educational platforms + lesson
    platformUrl,
    lessonContent,
    sendPlatformUpdate,
    sendLessonUpdate,
  }
}
