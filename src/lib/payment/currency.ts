/**
 * Manhal Academy — Currency conversion + formatting utilities
 *
 * Amounts are stored in DB in TWO bases:
 *   - amountEGP (Int, in piasters: 1 EGP = 100 piasters)
 *   - amountUSD (Int, in cents: 1 USD = 100 cents)
 *
 * For display, we convert to the user's preferred currency on the fly.
 */

import { CURRENCIES, type CurrencyMeta } from './config'
import { db } from '@/lib/db'

/** Convert an amount from one currency to another using USD as the pivot */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates?: Record<string, number>,
): number {
  if (from === to) return amount
  const r = rates ?? defaultRates()
  const fromRate = r[from] ?? CURRENCIES[from]?.rateToUSD ?? 1
  const toRate = r[to] ?? CURRENCIES[to]?.rateToUSD ?? 1
  // amount in USD = amount / fromRate (fromRate = how much local = 1 USD)
  // result = amountInUSD * toRate
  return (amount / fromRate) * toRate
}

/** Default static rates (used when DB rates are not available) */
function defaultRates(): Record<string, number> {
  const rates: Record<string, number> = {}
  for (const [code, meta] of Object.entries(CURRENCIES)) {
    rates[code] = meta.rateToUSD
  }
  return rates
}

/** Get cached rates from DB (or fall back to static) */
export async function getDbRates(): Promise<Record<string, number>> {
  try {
    const rows = await db.currencyRate.findMany()
    if (rows.length === 0) return defaultRates()
    const rates: Record<string, number> = {}
    for (const r of rows) rates[r.code] = r.rateToUSD
    // ensure USD exists
    if (!rates.USD) rates.USD = 1
    return rates
  } catch {
    return defaultRates()
  }
}

/** Format an amount in a given currency for display */
export function formatCurrency(
  amount: number,
  currency: string,
  options: { showSymbol?: boolean; locale?: string } = {},
): string {
  const meta: CurrencyMeta | undefined = CURRENCIES[currency]
  const decimals = meta?.decimals ?? 2
  const symbol = meta?.symbol ?? currency
  const locale = options.locale ?? 'ar-EG'
  const showSymbol = options.showSymbol ?? true

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)

  return showSymbol ? `${formatted} ${symbol}` : formatted
}

/** Convert EGP (piasters) → display EGP (pounds) */
export function piastersToEgp(piasters: number): number {
  return piasters / 100
}

/** Convert USD (cents) → display USD (dollars) */
export function centsToUsd(cents: number): number {
  return cents / 100
}

/** Convert EGP (pounds) → piasters for storage */
export function egpToPiasters(pounds: number): number {
  return Math.round(pounds * 100)
}

/** Convert USD (dollars) → cents for storage */
export function usdToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Compute the platform fee + teacher share for a given amount.
 * Platform keeps PLATFORM_FEE_PERCENT (default 15%), teacher gets the rest.
 */
export function computeSplit(
  amountEGP: number,
  amountUSD: number,
  feePercent: number = 0.15,
): {
  platformFeeEGP: number
  platformFeeUSD: number
  teacherShareEGP: number
  teacherShareUSD: number
} {
  return {
    platformFeeEGP: Math.round(amountEGP * feePercent),
    platformFeeUSD: Math.round(amountUSD * feePercent),
    teacherShareEGP: Math.round(amountEGP * (1 - feePercent)),
    teacherShareUSD: Math.round(amountUSD * (1 - feePercent)),
  }
}

/**
 * Convert stored amounts (EGP piasters + USD cents) to a display currency.
 * Returns the amount in major units (e.g. pounds, dollars).
 */
export function storedToDisplay(
  amountEGP: number,
  amountUSD: number,
  displayCurrency: string,
  rates?: Record<string, number>,
): number {
  // Always pivot via USD (more stable)
  const usdAmount = centsToUsd(amountUSD)
  if (displayCurrency === 'USD') return usdAmount
  if (displayCurrency === 'EGP') return piastersToEgp(amountEGP)
  return convertCurrency(usdAmount, 'USD', displayCurrency, rates)
}

/** Seed default currency rates into DB */
export async function seedCurrencyRates(): Promise<void> {
  for (const [code, meta] of Object.entries(CURRENCIES)) {
    await db.currencyRate.upsert({
      where: { code },
      update: { rateToUSD: meta.rateToUSD, updatedAt: new Date() },
      create: {
        code,
        name: meta.name,
        nameAr: meta.nameAr,
        symbol: meta.symbol,
        rateToUSD: meta.rateToUSD,
        providers: code === 'EGP' ? 'PAYMOB' : 'STRIPE',
      },
    })
  }
}

/* TODO(phase-3): Add a daily cron to refresh rates from a live FX API (exchangerate-api.com). */
