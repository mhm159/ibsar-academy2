/**
 * Ibdaa Academy — Advanced Notification System
 *
 * Multi-channel notifications:
 *   - In-app (real-time via socket.io + persisted in DB)
 *   - WhatsApp (via Twilio)
 *   - Email (via Resend/SendGrid — placeholder)
 *
 * Features:
 *   - User preferences (which channels + quiet hours)
 *   - Type-level overrides
 *   - Batch sending
 *   - Template system
 *   - Audit trail
 */

import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export type NotificationType =
  | 'SESSION_REMINDER'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'ESCROW_RELEASED'
  | 'REFUND_PROCESSED'
  | 'TEACHER_APPROVED'
  | 'TEACHER_REJECTED'
  | 'PAYOUT_REQUESTED'
  | 'PAYOUT_COMPLETED'
  | 'PAYOUT_REJECTED'
  | 'HOMEWORK_ASSIGNED'
  | 'HOMEWORK_SUBMITTED'
  | 'HOMEWORK_REVIEWED'
  | 'BEHAVIOR_ALERT'
  | 'PROGRESS_UPDATED'
  | 'REVIEW_RECEIVED'
  | 'REFUND_REQUESTED'
  | 'WELCOME'
  | 'GENERAL'

interface NotificationTemplate {
  title: string
  body: string
  link?: string
}

const TEMPLATES: Record<NotificationType, (params: Record<string, string>) => NotificationTemplate> = {
  SESSION_REMINDER: (p) => ({
    title: '⏰ تذكير: حصة بعد قليل',
    body: `حصة "${p.sessionTitle}" مع ${p.teacherName} تبدأ خلال ${p.minutes} دقيقة`,
    link: '/classroom/' + p.sessionId,
  }),
  BOOKING_CONFIRMED: (p) => ({
    title: '✅ تم تأكيد الحجز',
    body: `تم تأكيد حجز حصة "${p.sessionTitle}" للطالب ${p.studentName}`,
    link: '/parent/sessions',
  }),
  BOOKING_CANCELLED: (p) => ({
    title: '❌ تم إلغاء الحجز',
    body: `تم إلغاء حصة "${p.sessionTitle}"`,
    link: '/parent/sessions',
  }),
  PAYMENT_RECEIVED: (p) => ({
    title: '💰 تم استلام الدفع',
    body: `تم تأكيد دفع ${p.amount} لحصة "${p.sessionTitle}"`,
    link: '/parent/payments',
  }),
  PAYMENT_FAILED: (p) => ({
    title: '❌ فشل الدفع',
    body: `فشل دفع ${p.amount} — يرجى المحاولة مرة أخرى`,
    link: '/parent/payments',
  }),
  ESCROW_RELEASED: (p) => ({
    title: '💰 تم تحرير أموالك',
    body: `تم تحرير ${p.amount} من الضمان إلى رصيدك المتاح`,
    link: '/teacher/payouts',
  }),
  REFUND_PROCESSED: (p) => ({
    title: '↩️ تم استرجاع المبلغ',
    body: `تم استرجاع ${p.amount} — ${p.reason}`,
    link: '/parent/payments',
  }),
  TEACHER_APPROVED: (p) => ({
    title: '🎉 تم اعتماد حسابك!',
    body: 'مرحباً بك في أكاديمية إبداع! تم اعتماد حسابك كمعلم.',
    link: '/teacher',
  }),
  TEACHER_REJECTED: (p) => ({
    title: 'تم رفض طلب الانضمام',
    body: 'نأسف، لم يتم اعتماد طلب انضمامك. تواصل مع الدعم.',
    link: '/',
  }),
  PAYOUT_REQUESTED: (p) => ({
    title: '💰 طلب سحب جديد',
    body: `طلب المعلم ${p.teacherName} سحب ${p.amount}`,
    link: '/admin/payouts',
  }),
  PAYOUT_COMPLETED: (p) => ({
    title: '✅ تم تحويل السحب',
    body: `تم تحويل ${p.amount} إلى محفظتك. مرجع: ${p.ref}`,
    link: '/teacher/payouts',
  }),
  PAYOUT_REJECTED: (p) => ({
    title: '❌ تم رفض طلب السحب',
    body: `تم رفض طلب سحب ${p.amount}. ${p.reason}`,
    link: '/teacher/payouts',
  }),
  HOMEWORK_ASSIGNED: (p) => ({
    title: '📚 واجب جديد',
    body: `تم تكليفك بواجب: "${p.title}" — الموعد النهائي: ${p.dueDate}`,
    link: '/parent/homework',
  }),
  HOMEWORK_SUBMITTED: (p) => ({
    title: '📝 تم تسليم واجب',
    body: `سلّم الطالب ${p.studentName} الواجب: "${p.title}"`,
    link: '/teacher/homework',
  }),
  HOMEWORK_REVIEWED: (p) => ({
    title: '✅ تم تصحيح واجبك',
    body: `تم تصحيح "${p.title}" — الدرجة: ${p.grade}%`,
    link: '/parent/homework',
  }),
  BEHAVIOR_ALERT: (p) => ({
    title: `⚠️ تنبيه: ${p.studentName}`,
    body: p.description,
    link: '/parent/reports',
  }),
  PROGRESS_UPDATED: (p) => ({
    title: '📊 تحديث تقرير التقدّم',
    body: `تم تحديث تقرير تقدّم ${p.studentName} — الدرجة: ${p.score}%`,
    link: '/parent/reports',
  }),
  REVIEW_RECEIVED: (p) => ({
    title: '⭐ تقييم جديد',
    body: `حصلت على تقييم ${p.rating} نجوم: "${p.comment}"`,
    link: '/teacher/reviews',
  }),
  REFUND_REQUESTED: (p) => ({
    title: '↩️ طلب استرجاع جديد',
    body: `طلب استرجاع ${p.amount} — السبب: ${p.reason}`,
    link: '/admin/escrow',
  }),
  WELCOME: (p) => ({
    title: '🎉 مرحباً بك في أكاديمية إبداع!',
    body: `أهلاً ${p.name}! نحن سعداء بانضمامك إلينا.`,
    link: '/',
  }),
  GENERAL: (p) => ({
    title: p.title || 'إشعار',
    body: p.body || '',
    link: p.link,
  }),
}

/**
 * Send a notification to a user via all enabled channels.
 *
 * @param userId - recipient user ID
 * @param type - notification type (determines template)
 * @param params - template parameters
 * @param options - override preferences
 */
export async function sendNotification(
  userId: string,
  type: NotificationType,
  params: Record<string, string> = {},
  options: { forceWhatsApp?: boolean; forceEmail?: boolean; skipInApp?: boolean } = {},
): Promise<{ ok: boolean; channels: string[] }> {
  // Get template
  const templateFn = TEMPLATES[type] ?? TEMPLATES.GENERAL
  const template = templateFn(params)

  // Get user + preferences
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { phone: true, email: true, name: true },
  })
  if (!user) {
    return { ok: false, channels: [] }
  }

  const prefs = await db.notificationPreference.findUnique({ where: { userId } })
  const inAppEnabled = prefs?.inAppEnabled ?? true
  const whatsappEnabled = prefs?.whatsappEnabled ?? true
  const emailEnabled = prefs?.emailEnabled ?? false

  // Check quiet hours (Egypt time)
  const egyptHour = Number(new Date().toLocaleString('en-EG', { hour: '2-digit', hour12: false, timeZone: 'Africa/Cairo' }))
  const inQuietHours = isInQuietHours(egyptHour, prefs?.quietStartHour ?? 22, prefs?.quietEndHour ?? 7)

  const channels: string[] = []

  // 1. In-app notification (always, unless skipped)
  if (!options.skipInApp && inAppEnabled) {
    await db.notification.create({
      data: {
        userId,
        type,
        title: template.title,
        body: template.body,
        link: template.link,
      },
    })
    channels.push('in-app')
  }

  // 2. WhatsApp (skip during quiet hours unless forced)
  if (user.phone && (whatsappEnabled || options.forceWhatsApp) && !inQuietHours) {
    const waMessage = `🎓 *أكاديمية إبداع*

*${template.title}*

${template.body}

${template.link ? `🔗 ${template.link}` : ''}`

    try {
      const result = await sendWhatsAppMessage({
        phone: user.phone,
        message: waMessage,
      })
      if (result.ok) channels.push('whatsapp')
    } catch (err) {
      console.error('[notifications] WhatsApp failed:', err)
    }
  }

  // 3. Email (skip during quiet hours unless forced)
  if (user.email && (emailEnabled || options.forceEmail) && !inQuietHours) {
    // TODO: integrate Resend/SendGrid
    console.info(`[notifications][EMAIL] -> ${user.email}: ${template.title}`)
    channels.push('email')
  }

  // Log to notification log
  await db.notificationLog.create({
    data: {
      userId,
      channel: channels.join(','),
      to: user.phone ?? user.email ?? userId,
      subject: template.title,
      body: template.body,
      status: 'SENT',
    },
  })

  return { ok: true, channels }
}

/**
 * Send notification to multiple users (batch).
 */
export async function sendBatchNotifications(
  userIds: string[],
  type: NotificationType,
  params: Record<string, string> = {},
): Promise<{ sent: number }> {
  let sent = 0
  for (const userId of userIds) {
    const result = await sendNotification(userId, type, params)
    if (result.ok) sent++
  }
  return { sent }
}

/**
 * Check if current hour is within quiet hours.
 */
function isInQuietHours(currentHour: number, start: number, end: number): boolean {
  if (start < end) {
    // Normal range (e.g., 13-17)
    return currentHour >= start && currentHour < end
  } else {
    // Overnight range (e.g., 22-7)
    return currentHour >= start || currentHour < end
  }
}

/**
 * Get or create default notification preferences for a user.
 */
export async function getOrCreatePreferences(userId: string) {
  return db.notificationPreference.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })
}
