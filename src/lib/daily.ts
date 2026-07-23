/**
 * Abdaa Academy — Daily.co Video Provider
 *
 * Daily.co flow:
 *   1. Create room via REST API (server-side)
 *   2. Client joins via Daily.co iframe (@daily-co/daily-js or iframe URL)
 *   3. Start/stop recording via REST API
 *   4. Webhook receives recording-ready events (optional)
 *
 * Docs: https://docs.daily.co/reference/rest-api
 *
 * ENV REQUIRED:
 *   DAILY_API_KEY    — Daily.co API key
 *
 * SANDBOX MODE: if DAILY_API_KEY is not set, returns a fake room URL pointing
 * to our own /classroom/sandbox page (no real video, but UI is fully testable).
 */

const API_BASE = 'https://api.daily.co/v1'

export interface DailyRoom {
  name: string
  url: string
  privacy: 'private' | 'public'
  created_at: string
  config?: {
    start_video_off?: boolean
    start_audio_off?: boolean
    enable_recording?: 'cloud' | 'local' | 'none'
    exp?: number
  }
}

/** Whether Daily.co is configured */
export function isDailyConfigured(): boolean {
  return !!process.env.DAILY_API_KEY
}

/**
 * Create a Daily.co room for a session.
 * Room name = `abdaa-{sessionId}` (deterministic, idempotent).
 */
export async function createDailyRoom(params: {
  sessionId: string
  sessionTitle: string
  /** room expiry (epoch seconds) — defaults to session end + 2 hours */
  exp?: number
  enableRecording?: boolean
}): Promise<{ ok: true; room: DailyRoom; sandbox: boolean } | { ok: false; error: string }> {
  const roomName = `abdaa-${params.sessionId}`

  // SANDBOX: no API key → return fake URL
  if (!isDailyConfigured()) {
    const fakeUrl = `/classroom/sandbox?session=${params.sessionId}&room=${roomName}`
    return {
      ok: true,
      sandbox: true,
      room: {
        name: roomName,
        url: fakeUrl,
        privacy: 'public',
        created_at: new Date().toISOString(),
        config: {
          start_video_off: false,
          start_audio_off: false,
          enable_recording: params.enableRecording ? 'cloud' : 'none',
        },
      },
    }
  }

  try {
    // First, try to get existing room (idempotent)
    const existing = await fetch(`${API_BASE}/rooms/${roomName}`, {
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    if (existing.ok) {
      const room = await existing.json()
      return { ok: true, sandbox: false, room }
    }

    // Create new room
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          start_video_off: false,
          start_audio_off: false,
          enable_recording: params.enableRecording ? 'cloud' : 'none',
          exp: params.exp ?? Math.floor(Date.now() / 1000) + 4 * 60 * 60, // 4h default
          enable_chat: false, // we have our own chat
          enable_people_ui: true,
          enable_knock: false,
          lang: 'ar',
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { ok: false, error: `Daily.co create failed: ${res.status} ${errText}` }
    }

    const room = await res.json()
    return { ok: true, sandbox: false, room }
  } catch (err) {
    return { ok: false, error: `Daily.co error: ${(err as Error).message}` }
  }
}

/** Get an existing room */
export async function getDailyRoom(roomName: string): Promise<DailyRoom | null> {
  if (!isDailyConfigured()) {
    return null
  }
  try {
    const res = await fetch(`${API_BASE}/rooms/${roomName}`, {
      headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Create a meeting token for a specific user joining the room.
 * Used for private rooms — token contains user display name.
 */
export async function createDailyMeetingToken(params: {
  roomName: string
  userName: string
  isOwner?: boolean // teacher = owner
  exp?: number
}): Promise<{ ok: true; token: string; sandbox: boolean } | { ok: false; error: string }> {
  if (!isDailyConfigured()) {
    return { ok: true, token: `sandbox-token-${Date.now()}`, sandbox: true }
  }
  try {
    const res = await fetch(`${API_BASE}/meeting-tokens`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: params.roomName,
          user_name: params.userName,
          is_owner: params.isOwner ?? false,
          exp: params.exp ?? Math.floor(Date.now() / 1000) + 4 * 60 * 60,
        },
      }),
    })
    if (!res.ok) {
      return { ok: false, error: `Token create failed: ${res.status}` }
    }
    const data = await res.json()
    return { ok: true, token: data.token, sandbox: false }
  } catch (err) {
    return { ok: false, error: `Daily.co token error: ${(err as Error).message}` }
  }
}

/** Start cloud recording for a session */
export async function startRecording(roomName: string): Promise<{ ok: true; recordingId: string } | { ok: false; error: string }> {
  if (!isDailyConfigured()) {
    return { ok: true, recordingId: `sandbox-rec-${Date.now()}` }
  }
  try {
    const res = await fetch(`${API_BASE}/recordings/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ room_name: roomName }),
    })
    if (!res.ok) {
      const errText = await res.text()
      return { ok: false, error: `Recording start failed: ${res.status} ${errText}` }
    }
    const data = await res.json()
    return { ok: true, recordingId: data.id }
  } catch (err) {
    return { ok: false, error: `Recording error: ${(err as Error).message}` }
  }
}

/** Stop cloud recording */
export async function stopRecording(recordingId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isDailyConfigured()) {
    return { ok: true }
  }
  try {
    const res = await fetch(`${API_BASE}/recordings/${recordingId}/stop`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
    })
    if (!res.ok) {
      return { ok: false, error: `Stop failed: ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: `Stop error: ${(err as Error).message}` }
  }
}

interface DailyRecording {
  id: string
  status: string
  downloadUrl?: string
  createdAt: string
  durationMs?: number
}

/** List recordings for a room */
export async function listRecordings(roomName: string): Promise<DailyRecording[]> {
  if (!isDailyConfigured()) {
    return []
  }
  try {
    const res = await fetch(`${API_BASE}/recordings?room_name=${roomName}`, {
      headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []).map((r: any) => ({
      id: r.id,
      status: r.status,
      downloadUrl: r.download_url,
      createdAt: r.start_ts ? new Date(r.start_ts * 1000).toISOString() : new Date().toISOString(),
      durationMs: r.duration ? r.duration * 1000 : undefined,
    }))
  } catch {
    return []
  }
}

/** Delete a room (cleanup after session ends) */
export async function deleteDailyRoom(roomName: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isDailyConfigured()) {
    return { ok: true }
  }
  try {
    const res = await fetch(`${API_BASE}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
    })
    if (!res.ok && res.status !== 404) {
      return { ok: false, error: `Delete failed: ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: `Delete error: ${(err as Error).message}` }
  }
}

/* TODO(phase-4): Add Daily.co webhook handler for recording-ready events.
 * TODO(phase-5): Add AI transcription of recordings for accessibility. */
