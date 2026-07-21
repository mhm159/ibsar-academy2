import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  FileBarChart,
  GraduationCap,
  UserCheck,
  Settings,
  Wallet,
  ClipboardList,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

export const PARENT_NAV: NavItem[] = [
  { href: '/parent', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/parent/students', label: 'أبنائي', icon: Users },
  { href: '/parent/sessions', label: 'الحصص والحجوزات', icon: CalendarDays },
  { href: '/parent/payments', label: 'المدفوعات', icon: CreditCard },
  { href: '/parent/reports', label: 'التقارير', icon: FileBarChart },
]

export const TEACHER_NAV: NavItem[] = [
  { href: '/teacher', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/teacher/schedule', label: 'جدول الحصص', icon: CalendarDays },
  { href: '/teacher/students', label: 'الطلاب', icon: Users },
  { href: '/teacher/profile', label: 'الملف الشخصي', icon: Settings },
]

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/admin/approvals', label: 'اعتماد المعلمين', icon: UserCheck },
  { href: '/admin/users', label: 'المستخدمون', icon: Users },
  { href: '/admin/transactions', label: 'المعاملات', icon: Wallet },
]

export function getNavForRole(role: string): NavItem[] {
  switch (role) {
    case 'PARENT':
      return PARENT_NAV
    case 'TEACHER':
      return TEACHER_NAV
    case 'ADMIN':
      return ADMIN_NAV
    default:
      return []
  }
}

export const ROLE_META: Record<
  string,
  { label: string; emoji: string; home: string }
> = {
  PARENT: { label: 'ولي الأمر', emoji: '👨‍👩‍👧', home: '/parent' },
  TEACHER: { label: 'المعلم', emoji: '👩‍🏫', home: '/teacher' },
  ADMIN: { label: 'الإدارة', emoji: '⚙️', home: '/admin' },
}
