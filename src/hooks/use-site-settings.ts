'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings'

const CACHE_KEY = 'ibdaa:site-settings'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface SiteSettingsState {
  settings: Record<string, string>
  loaded: boolean
}

// Module-level in-flight promise so multiple components mounting at the same
// time share a single network request instead of firing N identical fetches.
let inFlight: Promise<Record<string, string>> | null = null

function fetchSettings(): Promise<Record<string, string>> {
  if (!inFlight) {
    inFlight = fetch('/api/site/settings')
      .then((r) => r.json())
      .then((d) => (d?.settings ? d.settings : DEFAULT_SITE_SETTINGS))
      .catch(() => DEFAULT_SITE_SETTINGS)
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}

function readCache(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { ts: number; settings: Record<string, string> }
    if (Date.now() - parsed.ts > CACHE_TTL) return null
    return parsed.settings
  } catch {
    return null
  }
}

/**
 * useSiteSettings — editable front-page texts.
 * Uses cached values instantly, then refreshes from the API in the background.
 * Concurrent consumers share a single request (module-level dedupe).
 */
export function useSiteSettings(): SiteSettingsState {
  const [state, setState] = useState<SiteSettingsState>(() => {
    const cached = readCache()
    return cached ? { settings: { ...DEFAULT_SITE_SETTINGS, ...cached }, loaded: true } : { settings: DEFAULT_SITE_SETTINGS, loaded: false }
  })

  useEffect(() => {
    let cancelled = false
    fetchSettings().then((settings) => {
      if (cancelled) return
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), settings }))
      } catch { /* ignore */ }
      setState({ settings, loaded: true })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
