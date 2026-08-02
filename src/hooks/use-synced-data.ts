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
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<number | null>(null)
  const staleRef = useRef(staleMs)
  staleRef.current = staleMs

  const refresh = useCallback(async () => {
    try {
      const fresh = await fetcher()
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
  }, [key, fetcher])

  useEffect(() => {
    let cancelled = false
    // 1) Paint instantly from the local browser cache if available
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const cached = JSON.parse(raw) as Cached<T>
        if (cached && cached.data) {
          if (!cancelled) setData(cached.data)
          if (cached.at && Date.now() - cached.at < staleRef.current) {
            if (!cancelled) setLoading(false)
            return
          }
        }
      }
    } catch {
      /* ignore corrupted cache */
    }
    // 2) Fetch the real DB data (source of truth) — first run or stale cache
    refresh()
    return () => {
      cancelled = true
    }
  }, [refresh])

  return { data, loading, lastSync, refresh }
}
