'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

type PopupType = 'success' | 'error' | 'warning' | 'info'

interface PopupNotification {
  id: string
  type: PopupType
  title: string
  message: string
  link?: string
  duration: number
}

// Global state
let popupId = 0
const listeners = new Set<(popups: PopupNotification[]) => void>()
let currentPopups: PopupNotification[] = []

function emit() {
  listeners.forEach((fn) => fn([...currentPopups]))
}

function removePopup(id: string) {
  currentPopups = currentPopups.filter((p) => p.id !== id)
  emit()
}

/** Show a popup notification */
export function showPopup(params: {
  type: PopupType
  title: string
  message: string
  link?: string
  duration?: number
}) {
  const id = `popup_${++popupId}`
  const popup: PopupNotification = {
    id,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
    duration: params.duration ?? 5000,
  }
  currentPopups = [...currentPopups, popup]
  emit()

  // Auto-dismiss
  if (popup.duration > 0) {
    setTimeout(() => removePopup(id), popup.duration)
  }

  return id
}

/** Convenience helpers */
export const popup = {
  success: (title: string, message: string, link?: string) =>
    showPopup({ type: 'success', title, message, link }),
  error: (title: string, message: string) =>
    showPopup({ type: 'error', title, message, duration: 7000 }),
  warning: (title: string, message: string) =>
    showPopup({ type: 'warning', title, message }),
  info: (title: string, message: string, link?: string) =>
    showPopup({ type: 'info', title, message, link }),
}

// ============================================================
// Unified Confirm / Prompt dialogs (replaces window.confirm/prompt)
// ============================================================

interface DialogRequest {
  id: string
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  placeholder?: string
  danger?: boolean
  prompt?: boolean
  resolve: (value: boolean | string | null) => void
}

let dialogListener: ((d: DialogRequest | null) => void) | null = null
let currentDialog: DialogRequest | null = null

function emitDialog() {
  if (dialogListener) dialogListener(currentDialog)
}

function settleDialog(value: boolean | string | null) {
  const d = currentDialog
  currentDialog = null
  emitDialog()
  if (d) d.resolve(value)
}

/** Show a confirmation dialog. Resolves true/false. */
export function showConfirm(opts: {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}): Promise<boolean> {
  return new Promise((resolve) => {
    currentDialog = {
      id: `dialog_${++popupId}`,
      title: opts.title ?? 'تأكيد',
      message: opts.message,
      confirmLabel: opts.confirmLabel ?? 'نعم، متأكد',
      cancelLabel: opts.cancelLabel ?? 'إلغاء',
      danger: opts.danger,
      prompt: false,
      resolve: (v) => resolve(Boolean(v)),
    }
    emitDialog()
  })
}

/** Show a prompt dialog. Resolves the input value, or null on cancel. */
export function showPrompt(opts: {
  title?: string
  message: string
  placeholder?: string
  confirmLabel?: string
}): Promise<string | null> {
  return new Promise((resolve) => {
    currentDialog = {
      id: `dialog_${++popupId}`,
      title: opts.title ?? 'إدخال',
      message: opts.message,
      placeholder: opts.placeholder,
      confirmLabel: opts.confirmLabel ?? 'حفظ',
      cancelLabel: 'إلغاء',
      prompt: true,
      resolve: (v) => resolve(typeof v === 'string' ? v : null),
    }
    emitDialog()
  })
}

const TYPE_CONFIG: Record<PopupType, {
  icon: typeof CheckCircle2
  color: string
  bgColor: string
  borderColor: string
}> = {
  success: {
    icon: CheckCircle2,
    color: 'var(--emerald-egypt)',
    bgColor: 'color-mix(in srgb, var(--emerald-egypt) 8%, var(--card))',
    borderColor: 'color-mix(in srgb, var(--emerald-egypt) 30%, transparent)',
  },
  error: {
    icon: AlertCircle,
    color: 'var(--destructive)',
    bgColor: 'color-mix(in srgb, var(--destructive) 8%, var(--card))',
    borderColor: 'color-mix(in srgb, var(--destructive) 30%, transparent)',
  },
  warning: {
    icon: AlertTriangle,
    color: 'var(--gold)',
    bgColor: 'color-mix(in srgb, var(--gold) 8%, var(--card))',
    borderColor: 'color-mix(in srgb, var(--gold) 30%, transparent)',
  },
  info: {
    icon: Info,
    color: 'var(--azure)',
    bgColor: 'color-mix(in srgb, var(--azure) 8%, var(--card))',
    borderColor: 'color-mix(in srgb, var(--azure) 30%, transparent)',
  },
}

/**
 * PopupNotificationContainer — renders popups at the top of the screen.
 * Mount this once in your layout. Use showPopup() to trigger.
 */
export function PopupNotificationContainer() {
  const [popups, setPopups] = React.useState<PopupNotification[]>([])
  const [dialog, setDialog] = React.useState<DialogRequest | null>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
    setMounted(true)
    listeners.add(setPopups)
    dialogListener = setDialog
    return () => {
      listeners.delete(setPopups)
      dialogListener = null
    }
  }, [])

  if (!mounted) return null

  return createPortal(
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 pointer-events-none">
        <AnimatePresence>
          {popups.map((p) => {
            const config = TYPE_CONFIG[p.type]
            const Icon = config.icon
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                className="pointer-events-auto mb-2"
              >
                <div
                  className="rounded-2xl backdrop-blur-xl border-2 p-4 shadow-2xl flex items-start gap-3"
                  style={{
                    background: config.bgColor,
                    borderColor: config.borderColor,
                  }}
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in srgb, ${config.color} 15%, transparent)` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: config.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: config.color }}>
                      {p.title}
                    </p>
                    <p className="text-sm text-foreground/80 mt-0.5 leading-relaxed">
                      {p.message}
                    </p>
                    {p.link && (
                      <a
                        href={p.link}
                        onClick={() => removePopup(p.id)}
                        className="text-xs font-bold mt-1 hover:underline"
                        style={{ color: config.color }}
                      >
                        عرض التفاصيل ←
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => removePopup(p.id)}
                    className="p-1 hover:bg-muted/50 rounded-lg shrink-0 transition-colors"
                    aria-label="إغلاق"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Progress bar */}
                {p.duration > 0 && (
                  <motion.div
                    className="h-0.5 rounded-full mt-0.5"
                    style={{ background: config.color }}
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: p.duration / 1000, ease: 'linear' }}
                  />
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <DialogView dialog={dialog} />
    </>,
    document.body,
  )
}

function DialogView({ dialog }: { dialog: DialogRequest | null }) {
  const [value, setValue] = React.useState('')

  return (
    <AnimatePresence>
      {dialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => settleDialog(dialog.prompt ? null : false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative w-full max-w-md rounded-2xl border-2 shadow-2xl p-6"
            style={{
              background: 'var(--card)',
              borderColor: dialog.danger ? 'var(--destructive)' : 'var(--gold)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: dialog.danger
                    ? 'color-mix(in srgb, var(--destructive) 15%, transparent)'
                    : 'color-mix(in srgb, var(--gold) 15%, transparent)',
                }}
              >
                {dialog.danger ? (
                  <AlertCircle className="h-5 w-5" style={{ color: 'var(--destructive)' }} />
                ) : (
                  <AlertTriangle className="h-5 w-5" style={{ color: 'var(--gold)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base">{dialog.title}</p>
                <p className="text-sm text-foreground/75 mt-1 leading-relaxed">
                  {dialog.message}
                </p>
              </div>
            </div>

            {dialog.prompt && (
              <input
                key={dialog.id}
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') settleDialog(value)
                  if (e.key === 'Escape') settleDialog(null)
                }}
                placeholder={dialog.placeholder}
                className="mt-4 w-full h-11 rounded-xl border px-4 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-azure/50"
              />
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => settleDialog(dialog.prompt ? null : false)}
                className="h-10 px-4 rounded-xl text-sm font-bold border hover:bg-muted/60 transition-colors"
              >
                {dialog.cancelLabel ?? 'إلغاء'}
              </button>
              <button
                onClick={() => settleDialog(dialog.prompt ? value : true)}
                className="h-10 px-5 rounded-xl text-sm font-bold text-white transition-colors"
                style={{
                  background: dialog.danger
                    ? 'var(--destructive)'
                    : 'linear-gradient(to left, var(--emerald-egypt), #52B788)',
                }}
              >
                {dialog.confirmLabel ?? 'حفظ'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
