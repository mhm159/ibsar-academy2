'use client'

import * as React from 'react'

const CONFETTI_COLORS = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#6C5CE7', '#FF8E53', '#FFB6C1']
const CONFETTI_EMOJIS = ['⭐', '🎉', '🌟', '✨', '🎊', '💫', '🏆']

/**
 * triggerConfetti — fires a confetti burst from the top of the screen.
 * Use for celebrations (lesson completed, achievement unlocked, etc.)
 *
 * @param count number of confetti pieces (default 50)
 * @param duration ms (default 3000)
 */
export function triggerConfetti(count = 50, duration = 3000) {
  if (typeof document === 'undefined') return

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden'
  document.body.appendChild(container)

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div')
    const useEmoji = Math.random() > 0.5
    const left = Math.random() * 100
    const delay = Math.random() * 0.5
    const animDuration = duration / 1000 + Math.random() * 1

    if (useEmoji) {
      piece.textContent = CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)]
      piece.style.cssText = `
        position: fixed;
        left: ${left}%;
        top: -50px;
        font-size: ${12 + Math.random() * 16}px;
        animation: confetti-fall ${animDuration}s linear ${delay}s forwards;
        pointer-events: none;
      `
    } else {
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
      const size = 6 + Math.random() * 8
      piece.style.cssText = `
        position: fixed;
        left: ${left}%;
        top: -50px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        animation: confetti-fall ${animDuration}s linear ${delay}s forwards;
        pointer-events: none;
      `
    }

    container.appendChild(piece)
  }

  // Cleanup
  setTimeout(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }, duration + 1000)
}

/**
 * triggerStarBurst — fires a star burst at a specific element position.
 * Use for "correct answer" or "achievement unlocked" moments.
 */
export function triggerStarBurst(element: HTMLElement, count = 8) {
  if (typeof document === 'undefined') return
  const rect = element.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  for (let i = 0; i < count; i++) {
    const star = document.createElement('div')
    const angle = (i / count) * Math.PI * 2
    const distance = 40 + Math.random() * 30
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance

    star.textContent = '⭐'
    star.style.cssText = `
      position: fixed;
      left: ${cx}px;
      top: ${cy}px;
      font-size: ${16 + Math.random() * 10}px;
      pointer-events: none;
      z-index: 9999;
      transition: transform 0.6s ease-out, opacity 0.6s ease-out;
    `
    document.body.appendChild(star)

    requestAnimationFrame(() => {
      star.style.transform = `translate(${dx}px, ${dy}px) scale(0)`
      star.style.opacity = '0'
    })

    setTimeout(() => star.remove(), 600)
  }
}

/**
 * Mascot — Ibdaa's friendly owl mascot.
 * Shows different expressions based on mood.
 */
export function Mascot({
  mood = 'happy',
  size = 80,
  className,
}: {
  mood?: 'happy' | 'thinking' | 'celebrating' | 'waving' | 'sleeping'
  size?: number
  className?: string
}) {
  const expressions: Record<string, { eyes: string; mouth: string; accessory?: string }> = {
    happy: { eyes: '😊', mouth: '🙂' },
    thinking: { eyes: '🤔', mouth: '😮' },
    celebrating: { eyes: '🤩', mouth: '😃', accessory: '🎉' },
    waving: { eyes: '😊', mouth: '😄', accessory: '👋' },
    sleeping: { eyes: '😴', mouth: '💤' },
  }
  const expr = expressions[mood] ?? expressions.happy

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      {/* Owl body */}
      <div
        className="relative rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6C5CE7] flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Eyes */}
        <div className="absolute top-[25%] flex gap-2">
          <div className="bg-white rounded-full w-3 h-3 flex items-center justify-center">
            <div className="bg-[#2D1B4E] rounded-full w-1.5 h-1.5" />
          </div>
          <div className="bg-white rounded-full w-3 h-3 flex items-center justify-center">
            <div className="bg-[#2D1B4E] rounded-full w-1.5 h-1.5" />
          </div>
        </div>
        {/* Beak */}
        <div className="absolute top-[50%] w-2 h-2 bg-[#FFA500] rotate-45" />
        {/* Belly */}
        <div className="absolute bottom-[15%] bg-[#A29BFE] rounded-full w-8 h-6" />
      </div>
      {/* Accessory */}
      {expr.accessory && (
        <div
          className="absolute -top-2 -right-2 text-2xl kids-bounce"
          style={{ fontSize: size * 0.3 }}
        >
          {expr.accessory}
        </div>
      )}
    </div>
  )
}

/* TODO: Add more mascot poses + animations for different scenarios. */
