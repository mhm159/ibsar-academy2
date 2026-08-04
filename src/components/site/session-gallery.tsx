'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera } from 'lucide-react'
import { EASE, Reveal, Stagger, StaggerItem } from './motion-reveal'

export interface GalleryMedia {
  id: string
  url: string
  type: string
  caption: string | null
  session: { id: string; title: string; track: string; teacher: { user: { name: string | null } } | null }
  createdAt: string
}

/**
 * SessionGallery — public gallery of processed session images.
 * Renders nothing when no media has been published yet.
 */
export function SessionGallery() {
  const [media, setMedia] = useState<GalleryMedia[]>([])
  const [loaded, setLoaded] = useState(false)
  const [active, setActive] = useState<GalleryMedia | null>(null)

  useEffect(() => {
    fetch('/api/site/gallery')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.media)) setMedia(d.media)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (loaded && media.length === 0) return null

  return (
    <section id="gallery" className="bg-pharaonic py-16 lg:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm font-medium mb-4">
            <Camera className="h-4 w-4 text-gold" />
            من داخل الحصص
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
            لحظات من <span className="text-gradient-gold">حصصنا الحقيقية</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            صور من حصص مباشرة داخل منصة منهل — تعليم ممتع، تفاعل حقيقي، وإبداع بلا حدود.
          </p>
        </Reveal>

        <Stagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((m) => (
            <StaggerItem key={m.id}>
              <button
                onClick={() => setActive(m)}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl glass border border-gold/15 focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <img
                  src={m.url}
                  alt={m.caption ?? m.session.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 inset-x-0 p-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-bold text-white truncate">{m.session.title}</p>
                  <p className="text-xs text-white/70 truncate">{m.caption}</p>
                </div>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="lightbox"
            className="fixed inset-0 z-50 bg-night/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActive(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <img src={active.url} alt={active.caption ?? active.session.title} className="w-full max-h-[75vh] object-contain rounded-2xl" />
              <div className="mt-4 text-center">
                <p className="font-display font-bold text-white">{active.session.title}</p>
                {active.caption && <p className="text-sm text-white/70 mt-1">{active.caption}</p>}
                <button
                  onClick={() => setActive(null)}
                  className="mt-3 rounded-full glass px-4 py-1.5 text-sm text-white/80 hover:bg-white/10"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
