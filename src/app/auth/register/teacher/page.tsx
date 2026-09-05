'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COUNTRIES } from '@/lib/constants'
import { useTracks } from '@/lib/tracks-store'
import { cn } from '@/lib/utils'
import { notify } from '@/lib/notify'

export default function RegisterTeacherPage(){
  const router=useRouter(),tracks=useTracks();const[loading,setLoading]=useState(false),[error,setError]=useState(''),[show,setShow]=useState(false),[selected,setSelected]=useState<string[]>([])
  const[form,setForm]=useState({name:'',channel:'EMAIL',target:'',password:'',confirm:'',country:'EG',city:'',bio:'',experienceYears:'0'})
  const set=(key:string,value:string)=>setForm(v=>({...v,[key]:value}));const toggle=(id:string)=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])
  async function submit(e:React.FormEvent){e.preventDefault();setError('');if(!selected.length)return setError('اختر تخصصًا واحدًا على الأقل');if(form.password!==form.confirm)return setError('كلمتا المرور غير متطابقتين');setLoading(true);try{const res=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,role:'TEACHER',tracks:selected,experienceYears:Number(form.experienceYears)})});const data=await res.json();if(!res.ok)return setError(data.error||'تعذر إنشاء الحساب');notify.success('تم إنشاء حسابك وإرساله للمراجعة');router.push('/teacher')}catch{setError('تعذر الاتصال بالخادم')}finally{setLoading(false)}}
  return <AuthShell title="انضم كمعلم" subtitle="أنشئ حسابك مباشرة، ثم تستكمل الإدارة مراجعة ملفك">
    <form onSubmit={submit} className="space-y-4">
      <Field label="الاسم الكامل"><Input value={form.name} onChange={e=>set('name',e.target.value)} minLength={2} required className="h-12" autoComplete="name"/></Field>
      <Field label="التخصصات"><div className="grid gap-2">{tracks.map(t=>{const active=selected.includes(t.id);return <button key={t.id} type="button" onClick={()=>toggle(t.id)} className={cn('flex items-center gap-3 rounded-2xl border p-3 text-right transition',active?'border-primary bg-primary/10':'border-border hover:border-primary/40')}><span className="text-2xl">{t.emoji}</span><span className="flex-1"><b className="block text-sm">{t.name}</b><small className="text-muted-foreground">{t.description}</small></span><span className={cn('size-5 rounded-full border-2',active?'border-primary bg-primary':'border-muted-foreground/30')}/></button>})}</div></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="سنوات الخبرة"><Input type="number" min={0} max={60} value={form.experienceYears} onChange={e=>set('experienceYears',e.target.value)} className="h-12" required/></Field><Field label="الدولة"><Select value={form.country} onValueChange={v=>set('country',v)}><SelectTrigger className="h-12"><SelectValue/></SelectTrigger><SelectContent>{COUNTRIES.map(c=><SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}</SelectContent></Select></Field></div>
      <Field label="نبذة مهنية"><Textarea value={form.bio} onChange={e=>set('bio',e.target.value)} maxLength={2000} className="min-h-24" placeholder="خبرتك وأسلوبك في التدريس"/></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="طريقة تسجيل الدخول"><Select value={form.channel} onValueChange={v=>set('channel',v)}><SelectTrigger className="h-12"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="EMAIL">البريد الإلكتروني</SelectItem><SelectItem value="SMS">رقم الهاتف</SelectItem></SelectContent></Select></Field><Field label="المدينة"><Input value={form.city} onChange={e=>set('city',e.target.value)} className="h-12"/></Field></div>
      <Field label={form.channel==='EMAIL'?'البريد الإلكتروني':'رقم الهاتف'}><Input type={form.channel==='EMAIL'?'email':'tel'} dir="ltr" value={form.target} onChange={e=>set('target',e.target.value)} required className="h-12" autoComplete={form.channel==='EMAIL'?'email':'tel'}/></Field>
      <Field label="كلمة المرور"><div className="relative"><Input type={show?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)} minLength={10} maxLength={128} required className="h-12 pl-12" autoComplete="new-password"/><button type="button" onClick={()=>setShow(!show)} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{show?<EyeOff className="size-5"/>:<Eye className="size-5"/>}</button></div></Field>
      <Field label="تأكيد كلمة المرور"><Input type={show?'text':'password'} value={form.confirm} onChange={e=>set('confirm',e.target.value)} minLength={10} maxLength={128} required className="h-12" autoComplete="new-password"/></Field>
      <p className="text-xs text-muted-foreground">لن يظهر ملف المعلم للطلاب قبل اعتماده من الإدارة.</p>
      <label className="flex gap-2 text-xs text-muted-foreground"><input type="checkbox" required/><span>أوافق على <Link href="/terms" className="text-primary">الشروط</Link> و<Link href="/privacy-policy" className="text-primary">سياسة الخصوصية</Link></span></label>
      {error&&<p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Button disabled={loading} className="h-12 w-full text-base">{loading?<Loader2 className="animate-spin"/>:<ArrowLeft/>}إنشاء حساب المعلم</Button>
    </form>
    <p className="mt-7 text-center text-sm text-muted-foreground">لديك حساب؟ <Link href="/auth/login" className="font-bold text-primary">تسجيل الدخول</Link></p>
  </AuthShell>
}
function Field({label,children}:{label:string,children:React.ReactNode}){return <div className="space-y-2"><Label>{label}</Label>{children}</div>}
