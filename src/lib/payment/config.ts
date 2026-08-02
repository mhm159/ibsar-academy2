/**
 * Manhal Academy — Currency & Country configuration
 *
 * Maps each supported country to: currency code, payment provider, flag, name.
 * Used by checkout flow to pick the right provider + currency for the parent.
 */

export interface CountryConfig {
  code: string
  name: string
  nameAr: string
  currency: string
  flag: string
  /** which payment provider to use */
  provider: 'PAYMOB' | 'STRIPE'
  /** available payment methods for this country */
  methods: PaymentMethod[]
}

export type PaymentMethod =
  | 'CARD'
  | 'FAWRY'
  | 'VODAFONE_CASH'
  | 'ETISALAT_CASH'
  | 'ORANGE_CASH'
  | 'WE_PAY'
  | 'MEZA'
  | 'APPLE_PAY'
  | 'MADA'
  | 'STC_PAY'
  | 'BANK_TRANSFER'

export const COUNTRIES_CONFIG: CountryConfig[] = [
  {
    code: 'EG',
    name: 'Egypt',
    nameAr: 'مصر',
    currency: 'EGP',
    flag: '🇪🇬',
    provider: 'PAYMOB',
    methods: ['CARD', 'FAWRY', 'VODAFONE_CASH', 'ETISALAT_CASH', 'ORANGE_CASH', 'WE_PAY', 'MEZA'],
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    nameAr: 'السعودية',
    currency: 'SAR',
    flag: '🇸🇦',
    provider: 'STRIPE',
    methods: ['CARD', 'MADA', 'STC_PAY', 'APPLE_PAY'],
  },
  {
    code: 'AE',
    name: 'UAE',
    nameAr: 'الإمارات',
    currency: 'AED',
    flag: '🇦🇪',
    provider: 'STRIPE',
    methods: ['CARD', 'APPLE_PAY'],
  },
  {
    code: 'KW',
    name: 'Kuwait',
    nameAr: 'الكويت',
    currency: 'KWD',
    flag: '🇰🇼',
    provider: 'STRIPE',
    methods: ['CARD'],
  },
  {
    code: 'QA',
    name: 'Qatar',
    nameAr: 'قطر',
    currency: 'QAR',
    flag: '🇶🇦',
    provider: 'STRIPE',
    methods: ['CARD'],
  },
  {
    code: 'BH',
    name: 'Bahrain',
    nameAr: 'البحرين',
    currency: 'BHD',
    flag: '🇧🇭',
    provider: 'STRIPE',
    methods: ['CARD'],
  },
  {
    code: 'OM',
    name: 'Oman',
    nameAr: 'عُمان',
    currency: 'OMR',
    flag: '🇴🇲',
    provider: 'STRIPE',
    methods: ['CARD'],
  },
  {
    code: 'JO',
    name: 'Jordan',
    nameAr: 'الأردن',
    currency: 'JOD',
    flag: '🇯🇴',
    provider: 'STRIPE',
    methods: ['CARD'],
  },
]

/** Get country config by code */
export function getCountryConfig(code: string): CountryConfig | undefined {
  return COUNTRIES_CONFIG.find((c) => c.code === code)
}

/** Get all supported currencies */
export const SUPPORTED_CURRENCIES = Array.from(
  new Set(COUNTRIES_CONFIG.map((c) => c.currency)),
)

/** Currency metadata */
export interface CurrencyMeta {
  code: string
  name: string
  nameAr: string
  symbol: string
  /** rate relative to USD: 1 USD = rateToUSD X */
  rateToUSD: number
  /** number of decimal places to display */
  decimals: number
}

export const CURRENCIES: Record<string, CurrencyMeta> = {
  EGP: { code: 'EGP', name: 'Egyptian Pound', nameAr: 'جنيه مصري', symbol: 'ج.م', rateToUSD: 48.5, decimals: 2 },
  SAR: { code: 'SAR', name: 'Saudi Riyal', nameAr: 'ريال سعودي', symbol: 'ر.س', rateToUSD: 3.75, decimals: 2 },
  AED: { code: 'AED', name: 'UAE Dirham', nameAr: 'درهم إماراتي', symbol: 'د.إ', rateToUSD: 3.67, decimals: 2 },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', nameAr: 'دينار كويتي', symbol: 'د.ك', rateToUSD: 0.31, decimals: 3 },
  QAR: { code: 'QAR', name: 'Qatari Riyal', nameAr: 'ريال قطري', symbol: 'ر.ق', rateToUSD: 3.64, decimals: 2 },
  BHD: { code: 'BHD', name: 'Bahraini Dinar', nameAr: 'دينار بحريني', symbol: 'د.ب', rateToUSD: 0.38, decimals: 3 },
  OMR: { code: 'OMR', name: 'Omani Rial', nameAr: 'ريال عماني', symbol: 'ر.ع', rateToUSD: 0.39, decimals: 3 },
  JOD: { code: 'JOD', name: 'Jordanian Dinar', nameAr: 'دينار أردني', symbol: 'د.أ', rateToUSD: 0.71, decimals: 2 },
  USD: { code: 'USD', name: 'US Dollar', nameAr: 'دولار أمريكي', symbol: '$', rateToUSD: 1, decimals: 2 },
}

/** Payment method labels (Arabic) */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { label: string; labelEn: string; icon: string }> = {
  CARD: { label: 'بطاقة بنكية', labelEn: 'Card', icon: '💳' },
  FAWRY: { label: 'فوري', labelEn: 'Fawry', icon: '🏪' },
  VODAFONE_CASH: { label: 'فودافون كاش', labelEn: 'Vodafone Cash', icon: '📱' },
  ETISALAT_CASH: { label: 'اتصالات كاش', labelEn: 'Etisalat Cash', icon: '📱' },
  ORANGE_CASH: { label: 'أورانج كاش', labelEn: 'Orange Cash', icon: '📱' },
  WE_PAY: { label: 'وي', labelEn: 'We Pay', icon: '📱' },
  MEZA: { label: 'ميزة', labelEn: 'Meza', icon: '💳' },
  APPLE_PAY: { label: 'Apple Pay', labelEn: 'Apple Pay', icon: '🍎' },
  MADA: { label: 'مدى', labelEn: 'Mada', icon: '💳' },
  STC_PAY: { label: 'STC Pay', labelEn: 'STC Pay', icon: '📱' },
  BANK_TRANSFER: { label: 'تحويل بنكي', labelEn: 'Bank Transfer', icon: '🏦' },
}

/** Platform commission rate (15% — goes to admin) */
export const PLATFORM_FEE_PERCENT = 0.15

/** Guarantee period: parent can request refund within first 2 sessions */
export const REFUND_GUARANTEE_SESSIONS = 2
