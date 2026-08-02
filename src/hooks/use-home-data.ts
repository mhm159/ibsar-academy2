'use client'

import { useEffect, useState } from 'react'
import { STATS, FEATURED_TEACHERS, TESTIMONIALS } from '@/lib/constants'

/**
 * useHomeData — single shared fetch of the landing-page dynamic data
 * (stats + featured teachers + testimonials) via GET /api/site/home.
 *
 * Instantly renders the built-in constants as a fallback, then swaps in the
 * live DB payload. Module-level in-flight dedupe ensures every section that
 * mounts at the same time shares ONE network request.
 */

export interface HomeStat {
  value: string
  label: string
}

export interface HomeTeacher {
  id: string
  name: string
  title: string
  tracks: string[]
  rating: number
  reviews: number
  students: number
  experienceYears: number
  avatar: string
  bio?: string
}

export interface HomeTestimonial {
  id?: string
  name: string
  location: string
  text: string
  rating: number
  avatar: string
}

interface HomeData {
  stats: HomeStat[]
  teachers: HomeTeacher[]
  testimonials: HomeTestimonial[]
}

const SEED_DATA: HomeData = {
  stats: STATS as unknown as HomeStat[],
  teachers: FEATURED_TEACHERS as unknown as HomeTeacher[],
  testimonials: TESTIMONIALS as unknown as HomeTestimonial[],
}

let inFlight: Promise<HomeData> | null = null

function fetchHomeData(): Promise<HomeData> {
  if (!inFlight) {
    inFlight = fetch('/api/site/home')
      .then((r) => r.json())
      .then((d) => ({
        stats: d.stats?.length ? d.stats : SEED_DATA.stats,
        teachers: d.teachers?.length ? d.teachers : SEED_DATA.teachers,
        testimonials: d.testimonials?.length ? d.testimonials : SEED_DATA.testimonials,
      }))
      .catch(() => SEED_DATA)
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}

export function useHomeData(): HomeData {
  const [data, setData] = useState<HomeData>(SEED_DATA)

  useEffect(() => {
    let cancelled = false
    fetchHomeData().then((d) => {
      if (!cancelled) setData(d)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return data
}
