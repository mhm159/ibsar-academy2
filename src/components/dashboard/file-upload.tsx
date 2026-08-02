'use client'

import * as React from 'react'
import { Loader2, Upload, X, FileText, Image as ImageIcon, Video } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  /** upload type: avatar, video, diploma, material, banner, session-media, track */
  type: 'avatar' | 'video' | 'diploma' | 'material' | 'banner' | 'session-media' | 'track'
  /** current URL (if any) */
  value?: string | null
  /** label */
  label: string
  /** accepted file types (mime) */
  accept?: string
  /** on upload complete */
  onUploaded: (url: string) => void
  /** on clear */
  onClear?: () => void
  /** preview style */
  previewType?: 'image' | 'video' | 'file'
  /** className */
  className?: string
}

/**
 * FileUpload — upload files (images/videos/PDFs) via /api/upload
 *
 * Converts file to base64 client-side, sends to API, returns URL.
 * Shows preview based on type (image/video/file icon).
 */
export function FileUpload({
  type,
  value,
  label,
  accept,
  onUploaded,
  onClear,
  previewType = 'image',
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      // Check size
      const maxMB = type === 'video' ? 50 : 5
      if (file.size > maxMB * 1024 * 1024) {
        setError(`حجم الملف كبير جداً (الحد الأقصى ${maxMB}MB)`)
        setUploading(false)
        return
      }

      // Convert to base64
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: base64,
              type,
              fileName: file.name,
            }),
          })
          const data = await res.json()
          if (!res.ok) {
            setError(data.error || 'فشل الرفع')
            setUploading(false)
            return
          }
          onUploaded(data.url)
          setUploading(false)
        } catch {
          setError('فشل الاتصال')
          setUploading(false)
        }
      }
      reader.onerror = () => {
        setError('فشل قراءة الملف')
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setError('خطأ غير متوقع')
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className={className}>
      <label className="text-sm font-bold mb-2 block">{label}</label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          'relative rounded-xl border-2 border-dashed p-4 transition-colors',
          error ? 'border-destructive/50 bg-destructive/5' : 'border-border hover:border-gold/40',
          value && 'border-solid',
        )}
      >
        {value ? (
          <div className="flex items-center gap-3">
            {/* Preview */}
            {previewType === 'image' && (
              <img
                src={value}
                alt={label}
                className="h-16 w-16 rounded-lg object-cover shrink-0"
              />
            )}
            {previewType === 'video' && (
              <video
                src={value}
                className="h-16 w-16 rounded-lg object-cover shrink-0"
                controls
              />
            )}
            {previewType === 'file' && (
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FileText className="h-8 w-8 text-gold" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{value}</p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-xs text-azure hover:underline"
                >
                  تغيير
                </button>
                {onClear && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={onClear}
                      className="text-xs text-destructive hover:underline"
                    >
                      حذف
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center py-4 gap-2"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-bold">اضغط لرفع {label}</p>
                <p className="text-xs text-muted-foreground">
                  أو اسحب الملف هنا
                </p>
              </>
            )}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
