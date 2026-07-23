'use client'

import * as React from 'react'

type Mode = 'pro' | 'kids'

interface UseModeReturn {
  mode: Mode
  setMode: (mode: Mode) => void
  toggle: () => void
  isKids: boolean
}

const MODE_KEY = 'ibdaa-mode'

/**
 * useMode — manages pro/kids UI mode.
 *
 * - 'pro' (default): professional Egyptian palette for parents/teachers/admins
 * - 'kids': vibrant playful palette for children
 *
 * Mode is persisted in localStorage and applied to <html data-mode="...">.
 */
export function useMode(): UseModeReturn {
  const [mode, setModeState] = React.useState<Mode>('pro')

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY) as Mode | null
      if (saved === 'kids' || saved === 'pro') {
        setModeState(saved)
        applyMode(saved)
      }
    } catch {
      // ignore
    }
  }, [])

  const setMode = React.useCallback((newMode: Mode) => {
    setModeState(newMode)
    applyMode(newMode)
    try {
      localStorage.setItem(MODE_KEY, newMode)
    } catch {
      // ignore
    }
  }, [])

  const toggle = React.useCallback(() => {
    setMode(mode === 'pro' ? 'kids' : 'pro')
  }, [mode, setMode])

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
