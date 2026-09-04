/**
 * Dars Academy — WhatsApp OTP Provider (via Twilio)
 *
 * Sends OTP codes via WhatsApp Business API using Twilio.
 *
 * ENV REQUIRED:
 *   TWILIO_ACCOUNT_SID       — ACxxx...
 *   TWILIO_AUTH_TOKEN         — your auth token
 *   TWILIO_WHATSAPP_FROM      — whatsapp:+14155238886 (Twilio sandbox or your number)
 *
 * SANDBOX MODE: if TWILIO_ACCOUNT_SID is not set, returns fake success
 * (OTP will still show in yellow box on the page for dev/testing).
 *
 * To enable WhatsApp in production:
 * 1. Create account at https://www.twilio.com
 * 2. Enable WhatsApp Business in Twilio console
 * 3. Add env vars above
 * 4. (Optional) Register your own WhatsApp number (not sandbox)
 *
 * Template message must be pre-approved by WhatsApp for production.
 * For dev, Twilio sandbox allows any message to sandbox-joined numbers.
 */

import twilio from 'twilio'

let client: twilio.Twilio | null = null

function getClient(): twilio.Twilio | null {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null
  }
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  }
  return client
}

/** Check if WhatsApp is configured */
export function isWhatsAppConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM)
}

/** Normalize phone for WhatsApp (E.164 format) */
function normalizeForWhatsApp(phone: string): string {
  let normalized = phone.replace(/[\s\-()]/g, '')
  if (normalized.startsWith('+')) return `whatsapp:${normalized}`
  if (normalized.startsWith('00')) return `whatsapp:+${normalized.slice(2)}`
  if (normalized.startsWith('0')) return `whatsapp:+20${normalized.slice(1)}`
  return `whatsapp:+20${normalized}`
}

/**
 * Send OTP via WhatsApp
 * @returns true if sent successfully
 */
export async function sendWhatsAppOtp(params: {
  phone: string
  code: string
  purpose: string
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const { phone, code, purpose } = params

  const c = getClient()
  if (!c) {
    console.info(`[WhatsApp][SANDBOX] OTP -> ${phone}: ${code}`)
    return { ok: true, messageId: `sandbox-${Date.now()}` }
  }

  const from = process.env.TWILIO_WHATSAPP_FROM!
  const to = normalizeForWhatsApp(phone)

  // WhatsApp template message (Arabic)
  const purposeText =
    purpose === 'REGISTER' ? 'تسجيل حساب جديد'
    : purpose === 'LOGIN' ? 'تسجيل الدخول'
    : purpose === 'RESET' ? 'إعادة تعيين كلمة المرور'
    : 'التحقق'

  const body = `*🎓 منصة منهل* — Dars Academy

مرحباً بك 👋
رمز التحقق الخاص بـ ${purposeText} هو:

*${code}*

⏰ *صالح لمدة 5 دقائق فقط*
🔒 لا تشارك هذا الرمز مع أي شخص

إذا لم تطلب هذا الرمز، تجاهل هذه الرسالة فوراً.

—
تم الإرسال تلقائياً من منصة منهل | Dars Academy`

  try {
    const message = await c.messages.create({
      from,
      to,
      body,
    })
    console.info(`[WhatsApp] OTP sent to ${phone}: ${message.sid}`)
    return { ok: true, messageId: message.sid }
  } catch (err) {
    const error = err as Error
    console.error(`[WhatsApp] Failed to send to ${phone}:`, error.message)
    return { ok: false, error: error.message }
  }
}

/**
 * Send a general notification via WhatsApp
 * (e.g. session reminder, payment confirmation)
 */
export async function sendWhatsAppMessage(params: {
  phone: string
  message: string
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const c = getClient()
  if (!c) {
    console.info(`[WhatsApp][SANDBOX] Message -> ${params.phone}: ${params.message.slice(0, 50)}...`)
    return { ok: true, messageId: `sandbox-${Date.now()}` }
  }

  const from = process.env.TWILIO_WHATSAPP_FROM!
  const to = normalizeForWhatsApp(params.phone)

  try {
    const message = await c.messages.create({
      from,
      to,
      body: params.message,
    })
    return { ok: true, messageId: message.sid }
  } catch (err) {
    const error = err as Error
    console.error(`[WhatsApp] Failed:`, error.message)
    return { ok: false, error: error.message }
  }
}
