'use client'

import { showPopup, showConfirm, showPrompt } from '@/components/site/popup-notification'

interface NotifyOptions {
  duration?: number
  link?: string
}

/**
 * Unified toast/popup layer — replaces `toast` from sonner everywhere.
 * Renders through PopupNotificationContainer (mounted in layout.tsx).
 */
export const notify = {
  success: (message: string, opts?: NotifyOptions) =>
    showPopup({
      type: 'success',
      title: 'تم بنجاح',
      message,
      link: opts?.link,
      duration: opts?.duration ?? 4000,
    }),

  error: (message: string, opts?: NotifyOptions) =>
    showPopup({
      type: 'error',
      title: 'حدث خطأ',
      message,
      duration: opts?.duration ?? 7000,
    }),

  info: (message: string, opts?: NotifyOptions) =>
    showPopup({
      type: 'info',
      title: 'تنبيه',
      message,
      link: opts?.link,
      duration: opts?.duration ?? 5000,
    }),

  warning: (message: string, opts?: NotifyOptions) =>
    showPopup({
      type: 'warning',
      title: 'انتبه',
      message,
      duration: opts?.duration ?? 5000,
    }),

  /** Replaces window.confirm — resolves true/false */
  confirm: (message: string, opts?: { title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }) =>
    showConfirm({
      title: opts?.title ?? 'تأكيد',
      message,
      confirmLabel: opts?.confirmLabel,
      cancelLabel: opts?.cancelLabel,
      danger: opts?.danger,
    }),

  /** Replaces window.prompt — resolves the input value, or null on cancel */
  prompt: (message: string, opts?: { title?: string; placeholder?: string; confirmLabel?: string }) =>
    showPrompt({
      title: opts?.title ?? 'إدخال',
      message,
      placeholder: opts?.placeholder,
      confirmLabel: opts?.confirmLabel,
    }),
}
