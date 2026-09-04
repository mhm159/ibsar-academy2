'use client'

import * as React from 'react'

type Mode = 'pro' | 'kids'

interface UseModeReturn {
  mode: Mode
  setMode: (mode: Mode) => void
  toggle: () => void
  isKids: boolean
}

const MODE_KEY = 'dars-mode'
const MODE_CHANGE_EVENT = 'dars-mode-change'

function getSnapshot(): Mode {
  if (typeof window === 'undefined') return 'pro'
  try {
    const saved = window.localStorage.getItem(MODE_KEY)
    return saved === 'kids' ? 'kids' : 'pro'
  } catch {
    return 'pro'
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(MODE_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(MODE_CHANGE_EVENT, onChange)
  }
}

/**
 * useMode — manages pro/kids UI mode.
 *
 * - 'pro' (default): professional Egyptian palette for parents/teachers/admins
 * - 'kids': vibrant playful palette for children
 *
 * Mode is persisted in localStorage and applied to <html data-mode="...">.
 */
export function useMode(): UseModeReturn {
  const mode = React.useSyncExternalStore<Mode>(subscribe, getSnapshot, () => 'pro')

  // Apply mode to <html data-mode="...">
  React.useEffect(() => {
    applyMode(mode)
  }, [mode])

  const setMode = React.useCallback((newMode: Mode) => {
    try {
      window.localStorage.setItem(MODE_KEY, newMode)
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(MODE_CHANGE_EVENT))
  }, [])

  const toggle = React.useCallback(() => {
    setMode(getSnapshot() === 'pro' ? 'kids' : 'pro')
  }, [setMode])

  return {
    mode,
    setMode,
    toggle,
    isKids: mode === 'kids',
  }
}

function applyMode(mode: Mode) {
  if (typeof document === 'undefined') return
  if (mode === 'kids') {
    document.documentElement.setAttribute('data-mode', 'kids')
  } else {
    document.documentElement.removeAttribute('data-mode')
  }
}
