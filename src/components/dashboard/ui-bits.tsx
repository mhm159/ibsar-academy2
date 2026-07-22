'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

/** StatCard — metric card with icon, value, label, optional trend */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  color = 'var(--gold)',
  className,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  hint?: string
  color?: string
  className?: string
}) {
  return (
    <Card className={cn('p-5 glass border-gold/15', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="mt-1 text-2xl lg:text-3xl font-extrabold font-display text-gradient-gold">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className="inline-flex items-center justify-center h-11 w-11 rounded-xl shrink-0"
          style={{
            color,
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
          }}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
    </Card>
  )
}

/** PageHeader — section title with optional action button */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

/** EmptyState — shown when there's no data */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-muted/50 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="font-display font-bold text-lg">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** StatusBadge — colored pill for status strings */
const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'var(--emerald-egypt)',
  COMPLETED: 'var(--emerald-egypt)',
  APPROVED: 'var(--emerald-egypt)',
  PAID: 'var(--emerald-egypt)',
  PENDING: 'var(--gold)',
  SCHEDULED: 'var(--azure)',
  CANCELLED: 'var(--destructive)',
  FAILED: 'var(--destructive)',
  REJECTED: 'var(--destructive)',
  NO_SHOW: 'var(--destructive)',
  SUSPENDED: 'var(--destructive)',
  REFUNDED: 'var(--kids-teal)',
  BEGINNER: 'var(--kids-teal)',
  INTERMEDIATE: 'var(--azure)',
  ADVANCED: 'var(--kids-red)',
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const color = STATUS_COLORS[status] ?? 'var(--muted-foreground)'
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      {label ?? status}
    </span>
  )
}

/** TrackBadge — colored chip for educational track */
const TRACK_META: Record<string, { label: string; color: string; emoji: string }> = {
  PROGRAMMING: { label: 'البرمجة', color: 'var(--azure)', emoji: '💻' },
  ROBOTICS: { label: 'الروبوتيكس', color: 'var(--emerald-egypt)', emoji: '🤖' },
  MENTAL_MATH: { label: 'الحساب الذهني', color: 'var(--gold)', emoji: '🧮' },
}

export function TrackBadge({ track }: { track: string }) {
  const meta = TRACK_META[track]
  if (!meta) return <span className="text-xs">{track}</span>
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{
        color: meta.color,
        background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
      }}
    >
      <span>{meta.emoji}</span>
      {meta.label}
    </span>
  )
}

/** StarRating — display-only star rating */
export function StarRating({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value)
        return (
          <svg
            key={star}
            className={sz}
            viewBox="0 0 24 24"
            fill={filled ? 'var(--gold)' : 'none'}
            stroke={filled ? 'var(--gold)' : 'currentColor'}
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        )
      })}
    </span>
  )
}

/* TODO(phase-3): Add currency formatter that adapts to user's country (EGP vs USD). */
