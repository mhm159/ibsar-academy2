import { APP } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: number
}

/** Ibdaa Academy brand logo — Eye of Horus inspired mark + wordmark */
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
        aria-label="شعار أكاديمية إبداع"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="ibdaaGoldLogo" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E8D488" />
            <stop offset="0.5" stopColor="#C9A84C" />
            <stop offset="1" stopColor="#A8842F" />
          </linearGradient>
          <linearGradient id="ibdaaAzureLogo" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4A9DD8" />
            <stop offset="1" stopColor="#1B6CA8" />
          </linearGradient>
        </defs>
        <path d="M4 32 C 16 16, 48 16, 60 32 C 48 48, 16 48, 4 32 Z" fill="url(#ibdaaGoldLogo)" opacity="0.18" />
        <path d="M8 32 C 18 20, 46 20, 56 32 C 46 44, 18 44, 8 32 Z" stroke="url(#ibdaaGoldLogo)" strokeWidth="2.5" fill="none" />
        <circle cx="32" cy="32" r="10" fill="url(#ibdaaAzureLogo)" />
        <circle cx="32" cy="32" r="10" stroke="#C9A84C" strokeWidth="1.5" fill="none" />
        <circle cx="32" cy="32" r="4.5" fill="#0F1923" />
        <circle cx="34.5" cy="29.5" r="1.6" fill="#FFE66D" />
        <circle cx="32" cy="10" r="2" fill="url(#ibdaaGoldLogo)" />
        <line x1="32" y1="12" x2="32" y2="18" stroke="url(#ibdaaGoldLogo)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-display font-extrabold text-lg tracking-tight">
            {APP.name}
          </span>
          <span className="text-[0.65rem] font-medium text-muted-foreground tracking-wide">
            {APP.nameEn}
          </span>
        </span>
      )}
    </span>
  )
}

/* TODO(phase-2): Add animated logo variant for auth pages and dashboard sidebar. */
