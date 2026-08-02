'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SiteBanner {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string | null
  linkUrl: string | null
  emoji: string
  badge: string | null
  order: number
  isActive: boolean
}

/**
 * HeroSlider — homepage carousel of admin-managed SiteBanners.
 * Falls back to nothing when no banners are configured.
 */
export function HeroSlider() {
  const [banners, setBanners] = useState<SiteBanner[]>([])
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/site/slider')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.banners)) setBanners(d.banners)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const prev = useCallback(() => setIndex((i) => (i - 1 + banners.length) % banners.length), [banners.length])
  const next = useCallback(() => setIndex((i) => (i + 1) % banners.length), [banners.length])

  useEffect(() => {
    if (banners.length < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000)
    return () => clearInterval(t)
  }, [banners.length])

  if (loaded && banners.length === 0) return null
  if (banners.length === 0) return null

  const active = banners[index]

  return (
    <section className="relative overflow-hidden bg-pharaonic pt-6 pb-2">
      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl glass border border-gold/20 shadow-2xl">
          {/* Slide */}
          <div className="relative min-h-[200px] sm:min-h-[260px] lg:min-h-[300px] overflow-hidden">
            {banners.map((b, i) => (
              <div
                key={b.id}
                className={cn(
                  'absolute inset-0 transition-opacity duration-700 flex items-center',
                  i === index ? 'opacity-100' : 'opacity-0 pointer-events-none',
                )}
              >
                {b.imageUrl && (
                  <img
                    src={b.imageUrl}
                    alt={b.title}
                    loading={i === index ? 'eager' : 'lazy'}
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover opacity-30"
                  />
                )}
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-l',
                    b.imageUrl ? 'from-night/90 via-night/60 to-night/30' : 'from-night via-night/80 to-night/40',
                  )}
                />
                <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-2xl">
                  {b.badge && (
                    <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-bold text-gold mb-4 border border-gold/30">
                      <Sparkles className="h-3.5 w-3.5" />
                      {b.badge}
                    </div>
                  )}
                  <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
                    <span className="text-3xl sm:text-5xl lg:text-6xl align-middle ml-2">{b.emoji}</span>
                    {b.title}
                  </h2>
                  {b.subtitle && (
                    <p className="mt-3 text-sm sm:text-base lg:text-lg text-white/70 leading-relaxed">{b.subtitle}</p>
                  )}
                  {b.linkUrl && (
                    <Link
                      href={b.linkUrl}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-gold to-[#E8D488] text-night font-bold text-sm px-5 py-2.5 hover:shadow-lg hover:shadow-gold/30 transition-shadow"
                    >
                      اكتشف المزيد
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {/* Arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="الشريحة السابقة"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full glass border border-white/20 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={next}
                  aria-label="الشريحة التالية"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full glass border border-white/20 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {banners.map((b, i) => (
                  <button
                    key={b.id}
                    onClick={() => setIndex(i)}
                    aria-label={`الشريحة ${i + 1}`}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      i === index ? 'w-6 bg-gold' : 'w-2 bg-white/40 hover:bg-white/70',
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
