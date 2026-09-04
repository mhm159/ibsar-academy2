/**
 * Dars Academy — Shared classroom types
 * Used by the realtime classroom hook + chat panel +
 * classroom persistence layer (DB messages, whiteboard, cursors, code).
 */

export interface ChatMessagePayload {
  messageId: string
  sessionId: string
  userId: string
  senderName: string
  senderRole: string // TEACHER | PARENT | STUDENT | ADMIN
  text: string
  attachmentUrl?: string
  attachmentType?: string // IMAGE | FILE | AUDIO
  createdAt: string
}

export interface PresenceUser {
  userId: string
  name: string
  role: string
  cursorColor: string
  isOnline: boolean
}

export interface CursorPayload {
  sessionId: string
  userId: string
  x: number
  y: number
}

export interface WhiteboardUpdatePayload {
  sessionId: string
  elements: any[]
  appState?: any
  toUserId?: string
  fromUserId?: string
}