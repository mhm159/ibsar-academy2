/**
 * Manhal Academy — Date/Time formatting utilities
 *
 * All times are displayed in Egypt timezone (Africa/Cairo, UTC+2)
 * using 12-hour format with Arabic AM/PM (ص/م).
 *
 * Months are Gregorian (ميلادي) with Arabic names.
 */

const EGYPT_TZ = 'Africa/Cairo'

/** Format time in 12-hour format with AM/PM (Egypt timezone) */
export function formatTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  return date.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: EGYPT_TZ,
  })
}

/** Format date (day + month name, Gregorian) */
export function formatDate(
  iso: string | Date,
  options: { weekday?: 'short' | 'long'; year?: boolean } = {},
): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  return date.toLocaleDateString('ar-EG', {
    weekday: options.weekday,
    day: 'numeric',
    month: 'long',
    year: options.year ? 'numeric' : undefined,
    timeZone: EGYPT_TZ,
  })
}

/** Format date short (day + short month) */
export function formatDateShort(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  return date.toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: EGYPT_TZ,
  })
}

/** Format date + time together */
export function formatDateTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  return `${formatDate(iso)} - ${formatTime(iso)}`
}

/** Format weekday name only */
export function formatWeekday(iso: string | Date, short: boolean = false): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  return date.toLocaleDateString('ar-EG', {
    weekday: short ? 'short' : 'long',
    timeZone: EGYPT_TZ,
  })
}

/** Get day number (1-31) */
export function getDayNumber(iso: string | Date): number {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  return Number(date.toLocaleDateString('en-EG', { day: 'numeric', timeZone: EGYPT_TZ }))
}

/** Get month number (1-12) in Egypt timezone */
export function getMonthNumber(iso: string | Date): number {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  return Number(date.toLocaleDateString('en-EG', { month: 'numeric', timeZone: EGYPT_TZ }))
}

/** Get year in Egypt timezone */
export function getYear(iso: string | Date): number {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  return Number(date.toLocaleDateString('en-EG', { year: 'numeric', timeZone: EGYPT_TZ }))
}

/** Get day of week (0=Sunday, 6=Saturday) in Egypt timezone */
export function getDayOfWeek(iso: string | Date): number {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  // Use parts to get the weekday in Egypt TZ
  const parts = new Intl.DateTimeFormat('en-EG', {
    weekday: 'short',
    timeZone: EGYPT_TZ,
  }).formatToParts(date)
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? ''
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  return map[weekdayStr] ?? date.getDay()
}

/** Calculate age from birth date in years + months (for children) */
export function calculateAge(birthDate: string | Date): {
  years: number
  months: number
  display: string
} {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const now = new Date()

  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()

  if (months < 0) {
    years--
    months += 12
  }

  // Adjust if birthday hasn't occurred this month yet
  if (now.getDate() < birth.getDate()) {
    months--
    if (months < 0) {
      years--
      months += 12
    }
  }

  let display = ''
  if (years > 0) {
    display = `${years} سنة`
    if (months > 0) display += ` و${months} شهر`
  } else {
    display = `${months} شهر`
  }

  return { years, months, display }
}

/** Format birth date for display */
export function formatBirthDate(birthDate: string | Date): string {
  const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  return date.toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: EGYPT_TZ,
  })
}

/** Arabic month names (Gregorian) */
export const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

/** Arabic day names (short) */
export const DAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']

/** Arabic day names (full) */
export const DAYS_AR_FULL = [
  'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت',
]
