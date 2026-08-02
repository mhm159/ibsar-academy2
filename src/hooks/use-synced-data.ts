'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseSyncedDataOptions<T> {
  /** localStorage key for this dataset */
  key: string
  /** Fetches the REAL data from the DB via API (source of truth) */
  fetcher: () => Promise<T>
  /** If cache is fresher than this, skip network fetch (ms). Default 30s. */
  staleMs?: number
}

interface Cached<T> {
  data: T
  at: number
}

/** Read + parse the cached copy from localStorage (safe against corruption). */
function readCache<T>(key: string): Cached<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const cached = JSON.parse(raw) as Cached<T>
      if (cached && cached.data) return cached
    }
  } catch {
    /* ignore corrupted cache */
  }
  return null
}

/**
 * useSyncedData — syncs real DB data (via CRUD APIs) with a local browser cache.
 *
 * Behaviour:
 *  1. First visit  → fetches real data from the API, caches it in localStorage.
 *  2. Next visits  → paints instantly from the local cache, then re-fetches in
 *     the background if the cache is older than staleMs (keeps data fresh).
 *  3. Errors      → falls back to the cached copy instead of a blank screen.
 *
 * This makes the app realistic: the DB is the source of truth and is seeded
 * only once; the browser cache just makes subsequent loads instant.
 */
export function useSyncedData<T>({
  key,
  fetcher,
  staleMs = 30_000,
}: UseSyncedDataOptions<T>): {
  data: T | null
  loading: boolean
  lastSync: number | null
  refresh: () => Promise<void>
} {
  // Paint instantly from the local browser cache via lazy initializers
  // (no effect needed → avoids setState-in-effect + infinite loop).
  const [data, setData] = useState<T | null>(() => readCache<T>(key)?.data ?? null)
  const [loading, setLoading] = useState(() => {
    const c = readCache<T>(key)
    return !(c && c.at && Date.now() - c.at < staleMs)
  })
  const [lastSync, setLastSync] = useState<number | null>(null)

  // Keep the fetcher in a ref so its identity can't change every render
  // (callers pass an inline arrow → would re-trigger the effect infinitely).
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const refresh = useCallback(async () => {
    try {
      const fresh = await fetcherRef.current()
      setData(fresh)
      const at = Date.now()
      setLastSync(at)
      try {
        localStorage.setItem(key, JSON.stringify({ data: fresh, at } satisfies Cached<T>))
      } catch {
        /* storage full/unavailable — ignore */
      }
    } catch {
      /* network/API error — keep showing the cached copy */
    } finally {
      setLoading(false)
    }
  }, [key])

  useEffect(() => {
    const cached = readCache<T>(key)
    if (!cached || !cached.at || Date.now() - cached.at >= staleMs) {
      refresh()
    }
  }, [key, refresh, staleMs])

  return { data, loading, lastSync, refresh }
}
