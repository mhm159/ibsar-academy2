'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from 'framer-motion'

/** Shared easing — soft "designer" deceleration used across all reveals. */
export const EASE = [0.22, 1, 0.36, 1] as const

/** Container that cascades its children with a small stagger. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

/** Standard fade + rise item. */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

/** Cinematic blur-in reveal (hero headlines, prominent CTAs). */
export const blurRevealItem: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: EASE },
  },
}

/** Gentle scale-in (visuals, badges, modals). */
export const scaleInItem: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE } },
}

/**
 * Reveal — a single element that fades + rises once it scrolls into view.
 * Falls back to plain rendering when the user prefers reduced motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  duration = 0.55,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  duration?: number
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Stagger — parent container that cascades its <StaggerItem> children
 * in a smooth wave once it enters the viewport.
 */
export function Stagger({
  children,
  className,
  gap = 0.09,
  delayChildren = 0.05,
}: {
  children: ReactNode
  className?: string
  gap?: number
  delayChildren?: number
}) {
  const reduce = useReducedMotion()
  const variants = useMemo<Variants>(
    () => ({
      hidden: {},
      visible: { transition: { staggerChildren: gap, delayChildren } },
    }),
    [gap, delayChildren],
  )
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}

/**
 * StaggerItem — one child of a <Stagger> wave. Also works standalone.
 */
export function StaggerItem({
  children,
  className,
  y = 28,
  duration = 0.5,
}: {
  children: ReactNode
  className?: string
  y?: number
  duration?: number
}) {
  const reduce = useReducedMotion()
  const variants = useMemo<Variants>(
    () => ({
      hidden: { opacity: 0, y },
      visible: { opacity: 1, y: 0, transition: { duration, ease: EASE } },
    }),
    [y, duration],
  )
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  )
}

/**
 * CountUp — animates a numeric string (e.g. "+5000", "4.9/5", "12,000+")
 * from 0 to its target once it scrolls into view.
 */
export function CountUp({
  value,
  duration = 1.6,
  className,
}: {
  value: string
  duration?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(value)

  const parsed = useMemo(() => {
    const match = value.match(/^(\+)?([\d,]+(?:\.\d+)?)(.*)$/)
    if (!match) return null
    const [, prefix, digits, suffix] = match
    const target = parseFloat(digits.replace(/,/g, ''))
    if (Number.isNaN(target)) return null
    const decimals = digits.includes('.') ? digits.split('.')[1].length : 0
    return { prefix: prefix ?? '', target, suffix, decimals }
  }, [value])

  useEffect(() => {
    if (!parsed || reduce || !inView) return
    const format = (v: number) =>
      `${parsed.prefix}${v.toLocaleString('en-US', {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      })}${parsed.suffix}`
    const controls = animate(0, parsed.target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(format(v)),
    })
    return () => controls.stop()
  }, [parsed, inView, duration, reduce])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
