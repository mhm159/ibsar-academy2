'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  GraduationCap,
  Wallet,
  CalendarClock,
  UserCheck,
  BookOpen,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { StatCard, PageHeader, StatusBadge, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AdminOverview {
  stats: {
    totalUsers: number
    totalParents: number
    totalTeachers: number
    totalStudents: number
    pendingTeachers: number
    approvedTeachers: number
    totalCourses: number
    totalSessions: number
    upcomingSessions: number
    completedSessions: number
    totalRevenueEGP: number
    totalRevenueUSD: number
    pendingPayments: number
  }
  recentUsers: Array<{
    id: string
    name: string | null
    role: string
    phone: string | null
    country: string | null
    createdAt: string
    isActive: boolean
  }>
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'إدارة',
  TEACHER: 'معلم',
  PARENT: 'ولي أمر',
  STUDENT: 'طالب',
}

export default function AdminOverviewPage() {
  return (
    <DashboardShell role="ADMIN">
      <AdminOverviewContent />
    </DashboardShell>
  )
}

function AdminOverviewContent() {
  const [data, setData] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/admin/overview')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) return <p className="text-muted-foreground">تعذّر التحميل</p>

  return (
    <>
      <PageHeader
        title="لوحة الإدارة 👋"
        description="نظرة عامة على نشاط المنصة"
        action={
          data.stats.pendingTeachers > 0 ? (
            <Link href="/admin/approvals">
              <Button className="gap-1.5 bg-gradient-to-l from-gold to-[#E8D488] text-night">
                <UserCheck className="h-4 w-4" />
                {data.stats.pendingTeachers} طلب اعتماد معلّق
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard icon={Users} label="إجمالي المستخدمين" value={data.stats.totalUsers} color="var(--azure)" />
        <StatCard icon={GraduationCap} label="المعلمون المعتمدون" value={data.stats.approvedTeachers} hint={`${data.stats.pendingTeachers} قيد المراجعة`} color="var(--emerald-egypt)" />
        <StatCard icon={BookOpen} label="الكورسات" value={data.stats.totalCourses} color="var(--gold)" />
        <StatCard
          icon={Wallet}
          label="إجمالي الإيرادات"
          value={`${data.stats.totalRevenueEGP} ج.م`}
          hint={`$${data.stats.totalRevenueUSD}`}
          color="var(--kids-red)"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} label="أولياء الأمور" value={data.stats.totalParents} color="var(--kids-teal)" />
        <StatCard icon={Users} label="الطلاب" value={data.stats.totalStudents} color="var(--kids-yellow)" />
        <StatCard icon={CalendarClock} label="حصص قادمة" value={data.stats.upcomingSessions} color="var(--azure)" />
        <StatCard icon={TrendingUp} label="حصص مكتملة" value={data.stats.completedSessions} color="var(--emerald-egypt)" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending teachers alert */}
        {data.stats.pendingTeachers > 0 && (
          <Card className="p-5 glass border-gold/30 bg-gold/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gold/20 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h3 className="font-display font-bold">طلبات اعتماد معلّقة</h3>
                <p className="text-xs text-muted-foreground">{data.stats.pendingTeachers} معلم بانتظار المراجعة</p>
              </div>
            </div>
            <Link href="/admin/approvals">
              <Button variant="outline" className="w-full gap-1.5 glass border-gold/30 hover:bg-gold/10">
                مراجعة الطلبات
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </Card>
        )}

        {/* Recent users */}
        <Card className="p-5 glass border-gold/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">أحدث المستخدمين</h3>
            <Link href="/admin/users" className="text-xs text-gold font-bold hover:underline">
              عرض الكل
            </Link>
          </div>
          {data.recentUsers.length === 0 ? (
            <EmptyState icon={Users} title="لا يوجد مستخدمون" />
          ) : (
            <ul className="space-y-2">
              {data.recentUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-sm font-bold shrink-0">
                    {u.name?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{u.name ?? 'بدون اسم'}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{u.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-muted-foreground">{ROLE_LABELS[u.role]}</span>
                    <StatusBadge status={u.isActive ? 'APPROVED' : 'SUSPENDED'} label={u.isActive ? 'نشط' : 'موقوف'} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
