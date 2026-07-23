/**
 * Ibdaa Academy — AI Content Moderation for Chat
 *
 * Uses z-ai-web-dev-sdk LLM to detect:
 *   - External links (block — kid safety)
 *   - Inappropriate content (profanity, adult content)
 *   - Personal information sharing (phone, email, address)
 *   - Spam / repetitive content
 *
 * Two-tier approach:
 *   1. Fast regex filter (instant — catches obvious links/phones)
 *   2. AI moderation (for nuanced content)
 *
 * Returns: { allowed, filteredText, category, confidence, action }
 */

import ZAI from 'z-ai-web-dev-sdk'

export interface ModerationResult {
  allowed: boolean
  filteredText: string
  category: string | null // EXTERNAL_LINK | INAPPROPRIATE | PROFANITY | SPAM | PERSONAL_INFO | null
  confidence: number
  action: 'ALLOWED' | 'FILTERED' | 'BLOCKED'
  reason?: string
}

/**
 * Moderate a chat message before it's persisted + broadcast.
 *
 * @param text - the original message text
 * @param senderRole - TEACHER | PARENT | STUDENT | ADMIN
 * @returns ModerationResult
 */
export async function moderateChatMessage(
  text: string,
  senderRole: string,
): Promise<ModerationResult> {
  // Admins bypass moderation
  if (senderRole === 'ADMIN') {
    return {
      allowed: true,
      filteredText: text,
      category: null,
      confidence: 100,
      action: 'ALLOWED',
    }
  }

  // Tier 1: Fast regex filter
  const regexResult = regexFilter(text)
  if (regexResult.category) {
    return regexResult
  }

  // Tier 2: AI moderation (only for messages that pass regex but might be subtle)
  // Skip AI for very short messages (< 5 chars) to save API calls
  if (text.trim().length < 5) {
    return {
      allowed: true,
      filteredText: text,
      category: null,
      confidence: 100,
      action: 'ALLOWED',
    }
  }

  try {
    const aiResult = await aiModerate(text, senderRole)
    return aiResult
  } catch (err) {
    console.error('[ai-moderation] LLM error, falling back to regex-only:', err)
    // If AI fails, allow the message (regex already passed)
    return {
      allowed: true,
      filteredText: text,
      category: null,
      confidence: 50,
      action: 'ALLOWED',
    }
  }
}

/** Fast regex-based filter for obvious violations */
function regexFilter(text: string): ModerationResult {
  // External links (http/https/www) — block unless it's ibdaa-academy.com
  const urlRegex = /https?:\/\/(?!ibdaa-academy\.com)[^\s]+|www\.(?!ibdaa-academy\.com)[^\s]+/gi
  if (urlRegex.test(text)) {
    const filtered = text.replace(urlRegex, '[رابط محظور]')
    return {
      allowed: true, // allow filtered version
      filteredText: filtered,
      category: 'EXTERNAL_LINK',
      confidence: 95,
      action: 'FILTERED',
      reason: 'رابط خارجي محظور لحماية الأطفال',
    }
  }

  // Egyptian phone numbers (01XXXXXXXXX or +20XXXXXXXXX)
  const phoneRegex = /(\+?20)?01[0-2,5][0-9]{8}/g
  if (phoneRegex.test(text)) {
    const filtered = text.replace(phoneRegex, '[رقم محظور]')
    return {
      allowed: true,
      filteredText: filtered,
      category: 'PERSONAL_INFO',
      confidence: 90,
      action: 'FILTERED',
      reason: 'مشاركة أرقام الهواتف محظورة في الشات',
    }
  }

  // Email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  if (emailRegex.test(text)) {
    const filtered = text.replace(emailRegex, '[بريد محظور]')
    return {
      allowed: true,
      filteredText: filtered,
      category: 'PERSONAL_INFO',
      confidence: 85,
      action: 'FILTERED',
      reason: 'مشاركة البريد الإلكتروني محظورة',
    }
  }

  // No regex match → continue to AI
  return {
    allowed: true,
    filteredText: text,
    category: null,
    confidence: 100,
    action: 'ALLOWED',
  }
}

/** AI-based moderation using z-ai-web-dev-sdk */
async function aiModerate(
  text: string,
  senderRole: string,
): Promise<ModerationResult> {
  const zai = await ZAI.create()

  const systemPrompt = `أنت نظام مراقبة محتوى لمنصة تعليمية للأطفال.
مهمتك: فحص الرسائل وتحديد ما إذا كانت تحتوي على:
1. INAPPROPRIATE - محتوى غير لائق (عنف، محتوى للبالغين، تنمر)
2. PROFANITY - ألفاظ بذيئة أو مهينة
3. SPAM - رسائل متكررة أو إعلانات
4. SAFE - آمنة للأطفال

القواعد:
- الرسائل التعليمية والتحفيزية آمنة دائماً
- التعبير عن الإحباط بأسلوب لائق آمن
- الإساءة للمعلم أو زملاء الدراسة غير مسموحة

أعد الاستجابة بصيغة JSON فقط:
{
  "category": "INAPPROPRIATE" | "PROFANITY" | "SPAM" | "SAFE",
  "confidence": <0-100>,
  "filteredText": "<النص بعد التنظيف إن لزم>",
  "reason": "<سبب قصير بالعربية>"
}`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: `فحص هذه الرسالة:\n"${text}"` },
    ],
    thinking: { type: 'disabled' },
  })

  const response = completion.choices[0]?.message?.content ?? ''
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return {
      allowed: true,
      filteredText: text,
      category: null,
      confidence: 50,
      action: 'ALLOWED',
    }
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    const category = parsed.category ?? 'SAFE'
    const confidence = parsed.confidence ?? 50

    if (category === 'SAFE') {
      return {
        allowed: true,
        filteredText: text,
        category: null,
        confidence: 100,
        action: 'ALLOWED',
      }
    }

    // For INAPPROPRIATE with high confidence → block entirely
    if (category === 'INAPPROPRIATE' && confidence >= 70) {
      return {
        allowed: false,
        filteredText: '[رسالة محظورة]',
        category: 'INAPPROPRIATE',
        confidence,
        action: 'BLOCKED',
        reason: parsed.reason ?? 'محتوى غير لائق',
      }
    }

    // For PROFANITY → filter the bad words
    if (category === 'PROFANITY') {
      return {
        allowed: true,
        filteredText: parsed.filteredText ?? text.replace(/[^\s]+/g, (w) =>
          // Simple profanity mask: keep first letter, mask rest
          w.length > 2 ? w[0] + '*'.repeat(w.length - 1) : w,
        ),
        category: 'PROFANITY',
        confidence,
        action: 'FILTERED',
        reason: parsed.reason ?? 'ألفاظ غير لائقة',
      }
    }

    // For SPAM → block
    if (category === 'SPAM' && confidence >= 70) {
      return {
        allowed: false,
        filteredText: '[رسالة محظورة - سبام]',
        category: 'SPAM',
        confidence,
        action: 'BLOCKED',
        reason: parsed.reason ?? 'محتوى مكرر/إعلاني',
      }
    }

    // Default: allow
    return {
      allowed: true,
      filteredText: parsed.filteredText ?? text,
      category: null,
      confidence: 100,
      action: 'ALLOWED',
    }
  } catch {
    return {
      allowed: true,
      filteredText: text,
      category: null,
      confidence: 50,
      action: 'ALLOWED',
    }
  }
}

/* TODO(phase-5): Add image moderation for attachment uploads. */
