'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COUNTRIES } from '@/lib/constants'
import { notify } from '@/lib/notify'

export default function RegisterStudentPage() {
  const router=useRouter(); const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [show,setShow]=useState(false)
  const [form,setForm]=useState({name:'',channel:'EMAIL',target:'',password:'',confirm:'',country:'EG',city:''})
  const set=(key:string,value:string)=>setForm(v=>({...v,[key]:value}))
  async function submit(e:React.FormEvent){e.preventDefault();setError('');if(form.password!==form.confirm)return setError('كلمتا المرور غير متطابقتين');setLoading(true);try{const res=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,role:'PARENT'})});const data=await res.json();if(!res.ok)return setError(data.error||'تعذر إنشاء الحساب');notify.success('تم إنشاء حساب ولي الأمر');router.push('/parent')}catch{setError('تعذر الاتصال بالخادم')}finally{setLoading(false)}}
  return <AuthShell title="حساب ولي أمر جديد" subtitle="تسجيل مباشر وآمن دون رموز تحقق">
    <form onSubmit={submit} className="space-y-4">
      <Field label="الاسم الكامل"><Input value={form.name} onChange={e=>set('name',e.target.value)} minLength={2} required className="h-12" autoComplete="name"/></Field>
      <Field label="طريقة تسجيل الدخول"><Select value={form.channel} onValueChange={v=>set('channel',v)}><SelectTrigger className="h-12"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="EMAIL">البريد الإلكتروني</SelectItem><SelectItem value="SMS">رقم الهاتف</SelectItem></SelectContent></Select></Field>
      <Field label={form.channel==='EMAIL'?'البريد الإلكتروني':'رقم الهاتف'}><Input type={form.channel==='EMAIL'?'email':'tel'} dir="ltr" value={form.target} onChange={e=>set('target',e.target.value)} required className="h-12" autoComplete={form.channel==='EMAIL'?'email':'tel'}/></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="الدولة"><Select value={form.country} onValueChange={v=>set('country',v)}><SelectTrigger className="h-12"><SelectValue/></SelectTrigger><SelectContent>{COUNTRIES.map(c=><SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}</SelectContent></Select></Field><Field label="المدينة"><Input value={form.city} onChange={e=>set('city',e.target.value)} className="h-12"/></Field></div>
      <Field label="كلمة المرور"><Password value={form.password} onChange={v=>set('password',v)} show={show} toggle={()=>setShow(!show)} autoComplete="new-password"/></Field>
      <Field label="تأكيد كلمة المرور"><Input type={show?'text':'password'} value={form.confirm} onChange={e=>set('confirm',e.target.value)} minLength={10} maxLength={128} required className="h-12" autoComplete="new-password"/></Field>
      <p className="text-xs text-muted-foreground">استخدم 10 أحرف على الأقل، ويفضل مزج الحروف والأرقام والرموز.</p>
      <label className="flex gap-2 text-xs text-muted-foreground"><input type="checkbox" required/><span>أوافق على <Link href="/terms" className="text-primary">الشروط</Link> و<Link href="/privacy-policy" className="text-primary">سياسة الخصوصية</Link></span></label>
      {error&&<p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Button disabled={loading} className="h-12 w-full text-base">{loading?<Loader2 className="animate-spin"/>:<ArrowLeft/>}إنشاء الحساب</Button>
    </form>
    <p className="mt-7 text-center text-sm text-muted-foreground">لديك حساب؟ <Link href="/auth/login" className="font-bold text-primary">تسجيل الدخول</Link></p>
  </AuthShell>
}
function Field({label,children}:{label:string,children:React.ReactNode}){return <div className="space-y-2"><Label>{label}</Label>{children}</div>}
function Password({value,onChange,show,toggle,autoComplete}:{value:string,onChange:(v:string)=>void,show:boolean,toggle:()=>void,autoComplete:string}){return <div className="relative"><Input type={show?'text':'password'} value={value} onChange={e=>onChange(e.target.value)} minLength={10} maxLength={128} required className="h-12 pl-12" autoComplete={autoComplete}/><button type="button" onClick={toggle} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{show?<EyeOff className="size-5"/>:<Eye className="size-5"/>}</button></div>}
