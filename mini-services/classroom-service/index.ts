/**
 * Ibsar Academy — Classroom Realtime Service
 *
 * Socket.io server on port 3003 that handles:
 *   - Realtime chat messages (per session room)
 *   - Whiteboard element sync (Excalidraw)
 *   - Presence (who's online in each session)
 *   - Synced cursor pointers (teacher → students)
 *
 * Room = session ID. Clients join room `session:<id>` to receive events
 * scoped to that session.
 *
 * Frontend connects via: io("/?XTransformPort=3003") (Caddy forwards
 * the XTransformPort query to localhost:3003).
 */

import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = 3003

const httpServer = createServer()

// Health check endpoint (must be set up BEFORE attaching socket.io)
httpServer.on('request', (req, res) => {
  if (req.url === '/health' || req.url === '/health/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, service: 'ibsar-classroom', port: PORT, uptime: process.uptime() }))
    return
  }
  // Let socket.io handle other requests
})

const io = new Server(httpServer, {
  // CRITICAL: path must be '/' so Caddy can forward based on XTransformPort
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// In-memory presence: Map<sessionId, Map<socketId, {userId, name, role, cursorColor}>>
const sessionPresence = new Map<string, Map<string, {
  userId: string
  name: string
  role: string
  cursorColor: string
  joinedAt: number
}>>()

// Cursor colors palette (assigned round-robin)
const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#2D6A4F',
  '#1B6CA8', '#C9A84C', '#9B59B6', '#E67E22',
]
let cursorColorIdx = 0

function getRoomId(sessionId: string): string {
  return `session:${sessionId}`
}

function getPresence(sessionId: string) {
  if (!sessionPresence.has(sessionId)) {
    sessionPresence.set(sessionId, new Map())
  }
  return sessionPresence.get(sessionId)!
}

function broadcastPresence(sessionId: string) {
  const presence = getPresence(sessionId)
  const users = Array.from(presence.values())
  io.to(getRoomId(sessionId)).emit('presence:update', { sessionId, users })
}

io.on('connection', (socket) => {
  console.log(`[classroom] Connected: ${socket.id}`)

  // ---- Join session room ----
  socket.on('session:join', (payload: {
    sessionId: string
    userId: string
    name: string
    role: string
  }) => {
    const { sessionId, userId, name, role } = payload
    if (!sessionId || !userId) {
      socket.emit('error', { message: 'sessionId and userId required' })
      return
    }

    const roomId = getRoomId(sessionId)
    socket.join(roomId)
    socket.data.sessionId = sessionId
    socket.data.userId = userId
    socket.data.name = name
    socket.data.role = role

    // Register presence
    const presence = getPresence(sessionId)
    const cursorColor = CURSOR_COLORS[cursorColorIdx % CURSOR_COLORS.length]
    cursorColorIdx++
    presence.set(socket.id, { userId, name, role, cursorColor, joinedAt: Date.now() })

    // Notify others
    socket.to(roomId).emit('user:joined', { userId, name, role, cursorColor })
    broadcastPresence(sessionId)

    // Send current presence to the joiner
    socket.emit('session:joined', {
      sessionId,
      users: Array.from(presence.values()),
      yourCursorColor: cursorColor,
    })

    console.log(`[classroom] ${name} (${role}) joined session ${sessionId}`)
  })

  // ---- Chat message (broadcast to room, client persists to DB) ----
  socket.on('chat:send', (payload: {
    sessionId: string
    messageId: string
    userId: string
    senderName: string
    senderRole: string
    text: string
    attachmentUrl?: string
    attachmentType?: string
    createdAt: string
  }) => {
    const roomId = getRoomId(payload.sessionId)
    // Broadcast to everyone in the room (including sender for confirmation)
    io.to(roomId).emit('chat:message', payload)
    console.log(`[classroom] Chat in ${payload.sessionId}: ${payload.senderName}: ${payload.text.slice(0, 50)}`)
  })

  // ---- Whiteboard sync (Excalidraw elements) ----
  // Only teacher broadcasts; students receive
  socket.on('whiteboard:update', (payload: {
    sessionId: string
    elements: any[]
    appState?: any
  }) => {
    const roomId = getRoomId(payload.sessionId)
    // Broadcast to everyone EXCEPT sender (sender already has the state)
    socket.to(roomId).emit('whiteboard:update', payload)
  })

  // ---- Whiteboard: request current state (new joiner asks teacher) ----
  socket.on('whiteboard:request-state', (payload: { sessionId: string }) => {
    const roomId = getRoomId(payload.sessionId)
    // Ask any teacher in the room to send current state
    socket.to(roomId).emit('whiteboard:request-state', { fromSocketId: socket.id })
  })

  // ---- Whiteboard: respond with current state ----
  socket.on('whiteboard:send-state', (payload: {
    sessionId: string
    toSocketId: string
    elements: any[]
    appState?: any
  }) => {
    io.to(payload.toSocketId).emit('whiteboard:state', {
      elements: payload.elements,
      appState: payload.appState,
    })
  })

  // ---- Live Code Sandbox: broadcast code changes ----
  socket.on('code:update', (payload: {
    sessionId: string
    code: string
    language: string
  }) => {
    const roomId = getRoomId(payload.sessionId)
    // Broadcast to everyone EXCEPT sender
    socket.to(roomId).emit('code:update', payload)
  })

  // ---- Live Code Sandbox: teacher locks/unlocks editing ----
  socket.on('code:lock', (payload: {
    sessionId: string
    locked: boolean
  }) => {
    const roomId = getRoomId(payload.sessionId)
    io.to(roomId).emit('code:lock', { locked: payload.locked })
    console.log(`[classroom] Code ${payload.locked ? 'locked' : 'unlocked'} in session ${payload.sessionId}`)
  })

  // ---- AI Focus Tracking: alert teacher ----
  socket.on('focus:alert', (payload: {
    sessionId: string
    userId: string
    name: string
  }) => {
    const roomId = getRoomId(payload.sessionId)
    // Broadcast to the whole room (only teacher will show the alert in UI)
    io.to(roomId).emit('focus:alert', payload)
    console.log(`[classroom] Focus alert: ${payload.name} in session ${payload.sessionId}`)
  })

  // ---- Cursor pointer sync (for collaborative drawing) ----
  socket.on('cursor:move', (payload: {
    sessionId: string
    x: number
    y: number
  }) => {
    const roomId = getRoomId(payload.sessionId)
    const presence = getPresence(payload.sessionId)
    const user = presence.get(socket.id)
    if (!user) return
    socket.to(roomId).emit('cursor:move', {
      userId: user.userId,
      name: user.name,
      color: user.cursorColor,
      x: payload.x,
      y: payload.y,
    })
  })

  // ---- Disconnect ----
  socket.on('disconnect', () => {
    const sessionId = socket.data.sessionId
    const name = socket.data.name
    if (sessionId) {
      const presence = getPresence(sessionId)
      presence.delete(socket.id)
      const roomId = getRoomId(sessionId)
      socket.to(roomId).emit('user:left', { userId: socket.data.userId, name })
      broadcastPresence(sessionId)
      // Clean up empty sessions
      if (presence.size === 0) {
        sessionPresence.delete(sessionId)
      }
    }
    console.log(`[classroom] Disconnected: ${socket.id} (${name ?? 'unknown'})`)
  })
})

httpServer.listen(PORT, () => {
  console.log(`✓ Ibsar Classroom Service running on port ${PORT}`)
  console.log(`  Health: http://localhost:${PORT}/health`)
})

/* TODO(phase-5): Add AI-powered content filter on chat:send to block external links + inappropriate content. */
