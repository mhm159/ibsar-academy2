'use client'

import { useState } from 'react'

export type Season = 'default' | 'ramadan' | 'summer' | 'winter' | 'back-to-school'

interface SeasonConfig {
  name: string
  nameAr: string
  emoji: string
  banner: string
  decorationEmojis: string[]
}

const SEASONS: Record<Season, SeasonConfig> = {
  default: {
    name: 'Default',
    nameAr: 'عام',
    emoji: '✨',
    banner: '',
    decorationEmojis: ['⭐', '🌟', '✨'],
  },
  ramadan: {
    name: 'Ramadan',
    nameAr: 'رمضان كريم',
    emoji: '🌙',
    banner: 'رمضان كريم — شهر البركة والتعلم',
    decorationEmojis: ['🌙', '⭐', '🕌', '🤲'],
  },
  summer: {
    name: 'Summer',
    nameAr: 'الصيف',
    emoji: '☀️',
    banner: 'إجازة الصيف — تعلّم واستمتع!',
    decorationEmojis: ['☀️', '🏖️', '🍦', '🌊'],
  },
  winter: {
    name: 'Winter',
    nameAr: 'الشتاء',
    emoji: '❄️',
    banner: 'شتاء دافئ بالعلم',
    decorationEmojis: ['❄️', '⛄', '🧣', '🍫'],
  },
  'back-to-school': {
    name: 'Back to School',
    nameAr: 'العودة للمدارس',
    emoji: '🎒',
    banner: 'العودة للمدارس — استعد لسنة مميزة!',
    decorationEmojis: ['🎒', '📚', '✏️', '🍎'],
  },
}

/** Detect current season based on date (Gregorian + Hijri approximation for Ramadan) */
export function detectSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1 // 1-12

  // Summer: June - August
  if (month >= 6 && month <= 8) return 'summer'

  // Winter: December - February
  if (month === 12 || month <= 2) return 'winter'

  // Back to school: September - October
  if (month >= 9 && month <= 10) return 'back-to-school'

  // Ramadan: approximate (shifts ~11 days earlier each year)
  // 2025: ~Mar 1 - Mar 30, 2026: ~Feb 18 - Mar 19, 2027: ~Feb 8 - Mar 9
  const year = date.getFullYear()
  const ramadanRanges: Record<number, [number, number, number, number]> = {
    2025: [2, 1, 3, 30], // Mar 1 - Mar 30
    2026: [2, 18, 3, 19], // Feb 18 - Mar 19
    2027: [2, 8, 3, 9], // Feb 8 - Mar 9
    2028: [1, 28, 2, 27], // Jan 28 - Feb 27
  }
  const range = ramadanRanges[year]
  if (range) {
    const [startMonth, startDay, endMonth, endDay] = range
    const checkDate = date.getDate()
    const checkMonth = date.getMonth() + 1
    if (
      (checkMonth === startMonth && checkDate >= startDay) ||
      (checkMonth === endMonth && checkDate <= endDay) ||
      (checkMonth > startMonth && checkMonth < endMonth)
    ) {
      return 'ramadan'
    }
  }

  return 'default'
}

/**
 * SeasonalBanner — shows a themed banner when a season is active.
 * Auto-detects season; can be overridden via prop.
 */
export function SeasonalBanner({ season }: { season?: Season }) {
  const [currentSeason] = useState<Season>(() => season ?? detectSeason())

  if (currentSeason === 'default') return null

  const config = SEASONS[currentSeason]
  const gradients: Record<Season, string> = {
    default: '',
    ramadan: 'from-[#1a3a5c] via-[#0d5c5c] to-[#1a3a5c]',
    summer: 'from-[#FF8E53] via-[#FFE66D] to-[#FF6B6B]',
    winter: 'from-[#4ECDC4] via-[#87CEEB] to-[#6C5CE7]',
    'back-to-school': 'from-[#6C5CE7] via-[#A29BFE] to-[#4ECDC4]',
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-l ${gradients[currentSeason]} p-4 mb-4 relative overflow-hidden`}>
      {/* Floating decorations */}
      <div className="absolute top-2 left-4 text-2xl kids-float-1 opacity-60">{config.decorationEmojis[0]}</div>
      <div className="absolute top-4 left-16 text-xl kids-float-2 opacity-50">{config.decorationEmojis[1]}</div>
      <div className="absolute bottom-2 left-8 text-xl kids-float-3 opacity-40">{config.decorationEmojis[2]}</div>

      <div className="relative flex items-center gap-3 text-white">
        <span className="text-4xl kids-bounce">{config.emoji}</span>
        <div>
          <p className="font-display font-extrabold text-lg">{config.nameAr}</p>
          <p className="text-sm opacity-90">{config.banner}</p>
        </div>
      </div>
    </div>
  )
}

export { SEASONS }
