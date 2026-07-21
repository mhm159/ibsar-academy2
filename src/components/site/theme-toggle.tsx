'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

/** Theme toggle — Egyptian sun/moon inspired */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const isDark = mounted ? resolvedTheme === 'dark' : false

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="rounded-full h-10 w-10 hover:bg-gold/10"
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-5 w-5 text-gold" />
        ) : (
          <Moon className="h-5 w-5 text-azure" />
        )
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  )
}

/* TODO(phase-2): Add a settings-driven locale switch (ar/en) once i18n is wired. */
