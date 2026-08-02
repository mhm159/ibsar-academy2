'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTracks } from '@/lib/tracks-store'
import { DAYS_AR_FULL } from '@/lib/datetime'
import { Gift, Loader2 } from 'lucide-react'
import { notify } from '@/lib/notify'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  name: string
}

interface BookTrialModalProps {
  students: Student[]
}

export function BookTrialModal({ students }: BookTrialModalProps) {
  const router = useRouter()
  const tracks = useTracks()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedTrack, setSelectedTrack] = useState('')
  const [selectedDay, setSelectedDay] = useState<number | ''>('')
  
  const [availableDays, setAvailableDays] = useState<number[]>([])
  const [fetchingDays, setFetchingDays] = useState(false)

  // Fetch available days when track changes
  useEffect(() => {
    if (!selectedTrack) return

    fetch(`/api/dashboard/parent/trials/available-slots?track=${selectedTrack}`)
      .then(r => r.json())
      .then(d => {
        if (d.availableDays) setAvailableDays(d.availableDays)
      })
      .finally(() => setFetchingDays(false))
  }, [selectedTrack])

  const handleBook = async () => {
    if (!selectedStudent || !selectedTrack || selectedDay === '') {
      notify.error('يرجى استكمال جميع البيانات')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/parent/trials/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent,
          track: selectedTrack,
          dayOfWeek: Number(selectedDay),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        notify.success('تم حجز الحصة التجريبية بنجاح!')
        setOpen(false)
        router.refresh()
      } else {
        notify.error(data.error || 'حدث خطأ أثناء الحجز')
      }
    } catch (e) {
      notify.error('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="neu w-full sm:w-auto hover-bounce text-primary flex items-center gap-2 font-bold py-6 px-8 rounded-xl bg-gold/10 border-2 border-gold/20">
          <Gift className="w-5 h-5 text-gold" />
          احجز حصة تجريبية مجانية 🎁
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rtl glass-strong rounded-3xl border-gold/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient-gold">حصة تجريبية مجانية</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            سيتم حجز حصة تلقائياً مع أقرب معلم متاح في اليوم المفضل.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 mt-2">
          {/* 1. Student */}
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-foreground">الطفل</label>
            <select 
              className="w-full rounded-xl border-border bg-card p-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold outline-none"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">-- اختر الطفل --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Track */}
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-foreground">المسار التعليمي</label>
            <div className="grid grid-cols-3 gap-2">
              {tracks.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTrack(t.id)
                    setAvailableDays([])
                    setSelectedDay('')
                    setFetchingDays(true)
                  }}
                  className={`p-2 rounded-xl border-2 text-center text-sm transition-all ${
                    selectedTrack === t.id 
                      ? 'border-gold bg-gold/10 font-bold' 
                      : 'border-border bg-card hover:bg-muted'
                  }`}
                >
                  <div className="text-2xl mb-1">{t.emoji}</div>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Day of week */}
          {selectedTrack && (
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-foreground">اليوم المفضل</label>
              {fetchingDays ? (
                <p className="text-xs text-muted-foreground animate-pulse">جاري البحث عن مواعيد...</p>
              ) : availableDays.length > 0 ? (
                <select 
                  className="w-full rounded-xl border-border bg-card p-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value === '' ? '' : Number(e.target.value))}
                >
                  <option value="">-- اختر اليوم --</option>
                  {availableDays.map(d => (
                    <option key={d} value={d}>{DAYS_AR_FULL[d]}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-destructive">عفواً، لا يوجد معلمين متاحين لهذا المسار حالياً.</p>
              )}
            </div>
          )}
        </div>

        <Button 
          onClick={handleBook} 
          disabled={loading || !selectedStudent || !selectedTrack || selectedDay === ''}
          className="w-full rounded-xl bg-gold text-gold-foreground hover:opacity-90 font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
        >
          {loading && <Loader2 className="w-5 h-5 ml-2 animate-spin" />}
          تأكيد الحجز
        </Button>
      </DialogContent>
    </Dialog>
  )
}
