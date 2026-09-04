import { APP } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: number
  variant?: 'default' | 'light'
}

/** Dars Brand Logo - official logo mark + wordmark */
export function Logo({ className, showText = true, size = 40, variant = 'default' }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src="/logo.png"
        alt="شعار منصة درس"
        width={size}
        height={size}
        className="shrink-0 object-contain drop-shadow-sm transition-transform hover:scale-105"
        style={{ width: size, height: size }}
      />
      {showText && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-display font-extrabold text-xl tracking-tight',
              variant === 'light' ? 'text-white' : 'text-primary',
            )}
          >
            درس
          </span>
          <span
            className={cn(
              'text-[0.65rem] font-bold tracking-widest uppercase',
              variant === 'light' ? 'text-white/70' : 'text-secondary',
            )}
          >
            {APP.nameEn}
          </span>
        </span>
      )}
    </span>
  )
}
