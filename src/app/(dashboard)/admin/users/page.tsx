'use client'

import { useEffect, useState } from 'react'
import { Search, Users, Loader2, Power, Shield } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { notify } from '@/lib/notify'

interface User {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string
  country: string | null
  city: string | null
  isActive: boolean
  emailVerified: string | null
  phoneVerified: string | null
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'إدارة',
  TEACHER: 'معلم',
  PARENT: 'ولي أمر',
  STUDENT: 'طالب',
}

export default function AdminUsersPage() {
  return (
    <DashboardShell role="ADMIN">
      <UsersManager />
    </DashboardShell>
  )
}

function UsersManager() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (roleFilter) params.set('role', roleFilter)
    fetch(`/api/dashboard/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.users) setUsers(d.users)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [q, roleFilter])

  const toggleActive = async (user: User) => {
    if (user.role === 'ADMIN') {
      notify.error('لا يمكنك تعديل حساب إدارة')
      return
    }
    setUpdating(user.id)
    try {
      const res = await fetch('/api/dashboard/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      })
      const d = await res.json()
      if (!res.ok) {
        notify.error(d.error || 'فشل التحديث')
        return
      }
      notify.success(user.isActive ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب')
      load()
    } catch {
      notify.error('تعذّر الاتصال')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <>
      <PageHeader
        title="المستخدمون"
        description={`${users.length} مستخدم`}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="بحث بالاسم أو الهاتف أو البريد..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pr-10 h-11"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px] h-11">
            <SelectValue placeholder="كل الأدوار" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">كل الأدوار</SelectItem>
            <SelectItem value="PARENT">أولياء الأمور</SelectItem>
            <SelectItem value="TEACHER">المعلمون</SelectItem>
            <SelectItem value="ADMIN">الإدارة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="glass border-gold/15">
          <EmptyState icon={Users} title="لا يوجد مستخدمون" description="جرّب تغيير معايير البحث" />
        </Card>
      ) : (
        <Card className="glass border-gold/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/50">
                <tr className="text-right">
                  <th className="px-4 py-3 font-bold text-muted-foreground">الاسم</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground hidden sm:table-cell">الهاتف</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground">الدور</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground hidden md:table-cell">الدولة</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground">الحالة</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground hidden sm:table-cell">التسجيل</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gold/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-xs font-bold shrink-0">
                          {u.name?.charAt(0) ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{u.name ?? 'بدون اسم'}</p>
                          {u.email && (
                            <p className="text-xs text-muted-foreground truncate" dir="ltr">{u.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell" dir="ltr">
                      {u.phone ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted">
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {u.country ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.isActive ? 'APPROVED' : 'SUSPENDED'} label={u.isActive ? 'نشط' : 'موقوف'} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {new Date(u.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== 'ADMIN' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={updating === u.id}
                          onClick={() => toggleActive(u)}
                          className={`h-8 gap-1.5 ${u.isActive ? 'text-destructive hover:bg-destructive/10' : 'text-emerald-egypt hover:bg-emerald-egypt/10'}`}
                        >
                          {updating === u.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}
                          {u.isActive ? 'إيقاف' : 'تفعيل'}
                        </Button>
                      )}
                      {u.role === 'ADMIN' && (
                        <Shield className="h-4 w-4 text-gold" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
