import { APP } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: number
}

/** Dars Brand Logo - Organic overlapping leaves/pages symbolizing growth and learning */
export function Logo({ className, showText = true, size = 40 }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="شعار منصة درس"
        className="shrink-0 drop-shadow-sm transition-transform hover:scale-105"
      >
        <defs>
          <linearGradient id="darsTurquoise" x1="10" y1="50" x2="32" y2="14" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0D9488" />
            <stop offset="1" stopColor="#14B8A6" />
          </linearGradient>
          <linearGradient id="darsPurple" x1="54" y1="50" x2="32" y2="14" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7C3AED" />
            <stop offset="1" stopColor="#A78BFA" />
          </linearGradient>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.1" />
          </filter>
        </defs>
        
        {/* Left Leaf / Page (Turquoise) */}
        <path 
          d="M32 50 C 18 50, 10 38, 10 26 C 10 14, 22 14, 32 14 C 32 26, 32 38, 32 50 Z" 
          fill="url(#darsTurquoise)" 
          filter="url(#softShadow)"
        />
        
        {/* Right Leaf / Page (Purple) with overlap multiply effect */}
        <path 
          d="M32 50 C 46 50, 54 38, 54 26 C 54 14, 42 14, 32 14 C 32 26, 32 38, 32 50 Z" 
          fill="url(#darsPurple)" 
          opacity="0.9"
        />

        {/* Center ascending dots symbolizing growth/ideas */}
        <circle cx="32" cy="22" r="3.5" fill="#FFFFFF" />
        <circle cx="32" cy="34" r="2.5" fill="#FFFFFF" opacity="0.6" />
      </svg>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-display font-extrabold text-xl tracking-tight text-primary">
            درس
          </span>
          <span className="text-[0.65rem] font-bold text-secondary tracking-widest uppercase">
            {APP.nameEn}
          </span>
        </span>
      )}
    </span>
  )
}
