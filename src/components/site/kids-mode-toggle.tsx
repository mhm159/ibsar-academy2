'use client'

import * as React from 'react'
import { useMode } from '@/components/use-mode'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * KidsModeToggle — switches between professional and kids UI modes.
 *
 * In kids mode: vibrant colors, bouncy buttons, playful animations.
 * In pro mode: elegant Egyptian palette.
 *
 * Persisted in localStorage; applied via <html data-mode="kids">.
 */
export function KidsModeToggle() {
  const { mode, setMode, isKids } = useMode()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" aria-label="تبديل الوضع">
        <span className="text-lg">🎨</span>
      </Button>
    )
  }

  return (
    <div className="inline-flex items-center rounded-full p-1 bg-muted/50 border border-border">
      <button
        onClick={() => setMode('pro')}
        className={cn(
          'h-8 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1',
          !isKids
            ? 'bg-gradient-to-l from-gold to-[#E8D488] text-night shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
        aria-label="الوضع الاحترافي"
      >
        <span className="text-sm">👑</span>
        <span className="hidden sm:inline">احترافي</span>
      </button>
      <button
        onClick={() => setMode('kids')}
        className={cn(
          'h-8 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1',
          isKids
            ? 'bg-gradient-to-l from-[#FF6B6B] to-[#FF8E53] text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
        aria-label="وضع الأطفال"
      >
        <span className="text-sm">🎨</span>
        <span className="hidden sm:inline">أطفال</span>
      </button>
    </div>
  )
}

/* TODO: Add auto-detection (if student logged in → suggest kids mode). */
