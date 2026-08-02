'use client'

import { useSyncExternalStore } from 'react'
import { TRACKS, type TrackId } from '@/lib/constants'

/**
 * Client-side track registry.
 *
 * Defaults to the built-in TRACKS constant for instant first paint, then is
 * hydrated from GET /api/tracks (admin-manageable). `TrackBadge` and all
 * track-list components read from this store, so new tracks added in the
 * admin dashboard appear everywhere automatically.
 */

export interface TrackItem {
  id: string
  name: string
  nameEn: string
  icon: string
  colorVar: string
  color: string
  description: string
  descriptionEn: string
  ageRange: string
  emoji: string
  isActive?: boolean
  orderIndex?: number
}

const DEFAULT_TRACKS: TrackItem[] = TRACKS.map((t) => ({
  id: t.id,
  name: t.name,
  nameEn: t.nameEn,
  icon: t.icon,
  colorVar: t.colorVar,
  color: t.color,
  description: t.description,
  descriptionEn: t.descriptionEn,
  ageRange: t.ageRange,
  emoji: t.emoji,
  isActive: true,
}))

let current: TrackItem[] = DEFAULT_TRACKS
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): TrackItem[] {
  return current
}

/** Hydrate the registry from the API (public, cached for 5 min) */
let hydrated = false

export function hydrateTracks() {
  if (hydrated) return
  hydrated = true
  fetch('/api/tracks', { cache: 'no-store' })
    .then((r) => r.json())
    .then((d) => {
      if (!d?.tracks || !Array.isArray(d.tracks)) return
      const active = d.tracks.filter((t: TrackItem) => t.isActive !== false)
      if (active.length === 0) return
      current = active
      emit()
    })
    .catch(() => {})
}

/** React hook returning the current track list (hydrates once) */
export function useTracks(): TrackItem[] {
  hydrateTracks()
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** Find a track by id (with built-in fallbacks for known ids) */
export function findTrack(id: string): TrackItem | undefined {
  return current.find((t) => t.id === id) ?? DEFAULT_TRACKS.find((t) => t.id === (id as TrackId))
}

/** Synchronous snapshot (for non-hook usage, e.g. TrackBadge) */
export function getTracksSnapshot(): TrackItem[] {
  return current
}

/** Overwrite registry (used by admin page after CRUD) */
export function setTracks(list: TrackItem[]) {
  current = list.filter((t) => t.isActive !== false)
  if (current.length === 0) current = DEFAULT_TRACKS
  emit()
}
