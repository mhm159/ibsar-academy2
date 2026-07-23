/**
 * Sound effects using Web Audio API (no external files needed).
 *
 * Generates short tones/beeps for UI feedback:
 *   - ding: message received
 *   - success: task completed
 *   - level-up: badge/level unlocked
 *   - clap: achievement celebration
 *   - pop: button click
 *   - error: wrong answer
 */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch {
      return null
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

/** Play a simple tone with envelope */
function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  delay: number = 0,
) {
  const ctx = getCtx()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.value = freq

  const start = ctx.currentTime + delay
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(start)
  osc.stop(start + duration)
}

/** Message ding — pleasant high-pitched note */
export function playDing() {
  playTone(880, 0.15, 'sine', 0.12)
  playTone(1320, 0.2, 'sine', 0.08, 0.05)
}

/** Success — ascending arpeggio */
export function playSuccess() {
  playTone(523, 0.12, 'sine', 0.15) // C
  playTone(659, 0.12, 'sine', 0.15, 0.1) // E
  playTone(784, 0.2, 'sine', 0.15, 0.2) // G
}

/** Level up — triumphant fanfare */
export function playLevelUp() {
  playTone(523, 0.1, 'square', 0.1) // C
  playTone(659, 0.1, 'square', 0.1, 0.1) // E
  playTone(784, 0.1, 'square', 0.1, 0.2) // G
  playTone(1047, 0.3, 'square', 0.12, 0.3) // C high
}

/** Clap / celebration — rapid noise burst */
export function playClap() {
  const ctx = getCtx()
  if (!ctx) return
  // Multiple short noise bursts
  for (let i = 0; i < 5; i++) {
    const delay = i * 0.08
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = 200 + Math.random() * 100
    const start = ctx.currentTime + delay
    gain.gain.setValueAtTime(0.1, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.05)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.05)
  }
}

/** Pop — button click */
export function playPop() {
  playTone(600, 0.05, 'sine', 0.08)
}

/** Error — descending tone */
export function playError() {
  playTone(400, 0.15, 'sawtooth', 0.1)
  playTone(300, 0.2, 'sawtooth', 0.1, 0.1)
}

/** Star / sparkle — quick high notes */
export function playSparkle() {
  playTone(1568, 0.08, 'sine', 0.06)
  playTone(2093, 0.08, 'sine', 0.06, 0.04)
  playTone(2637, 0.12, 'sine', 0.06, 0.08)
}

/** Coin / points — classic coin sound */
export function playCoin() {
  playTone(988, 0.08, 'square', 0.08) // B
  playTone(1319, 0.15, 'square', 0.08, 0.05) // E high
}

/** Toggle sound on/off preference in localStorage */
const SOUND_KEY = 'ibdaa-sound-enabled'

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(SOUND_KEY) !== 'false'
  } catch {
    return true
  }
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SOUND_KEY, String(enabled))
  } catch {}
}
