'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole, UserRound } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { notify } from '@/lib/notify'

export default function LoginPage() {
  const router = useRouter()
  const [target, setTarget] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target, password }) })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'تعذر تسجيل الدخول')
      notify.success('مرحبًا بعودتك')
      router.push(data.user.role === 'ADMIN' ? '/admin' : data.user.role === 'TEACHER' ? '/teacher' : data.user.role === 'SUPERVISOR' ? '/supervisor' : '/parent')
    } catch { setError('تعذر الاتصال بالخادم') } finally { setLoading(false) }
  }

  return <AuthShell title="تسجيل الدخول" subtitle="أدخل بريدك أو رقم هاتفك وكلمة المرور">
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2"><Label htmlFor="target">البريد الإلكتروني أو رقم الهاتف</Label><div className="relative"><UserRound className="absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"/><Input id="target" value={target} onChange={e=>setTarget(e.target.value)} autoComplete="username" required className="h-12 pr-12" placeholder="you@example.com أو 01012345678"/></div></div>
      <div className="space-y-2"><div className="flex justify-between"><Label htmlFor="password">كلمة المرور</Label></div><div className="relative"><LockKeyhole className="absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"/><Input id="password" type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required className="h-12 px-12"/><button type="button" onClick={()=>setShow(!show)} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={show?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{show?<EyeOff className="size-5"/>:<Eye className="size-5"/>}</button></div></div>
      {error&&<p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Button disabled={loading} className="h-12 w-full text-base">{loading?<Loader2 className="animate-spin"/>:<ArrowLeft/>}دخول</Button>
    </form>
    <p className="mt-7 text-center text-sm text-muted-foreground">ليس لديك حساب؟ <Link href="/auth/register/student" className="font-bold text-primary hover:underline">سجّل الآن</Link></p>
  </AuthShell>
}
