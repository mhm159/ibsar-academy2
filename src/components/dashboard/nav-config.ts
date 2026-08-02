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
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Star,
  AlertTriangle,
  Trophy,
  Medal,
  Calendar,
  BookOpen,
  Layers,
  CalendarClock,
  Images,
  FileText,
  UserCog,
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
  { href: '/parent/homework', label: 'الواجبات', icon: BookOpen },
  { href: '/parent/calendar', label: 'التقويم', icon: Calendar },
  { href: '/parent/gamification', label: 'الإنجازات', icon: Trophy },
  { href: '/parent/leaderboard', label: 'المتصدرون', icon: Medal },
  { href: '/parent/payments', label: 'المدفوعات', icon: CreditCard },
  { href: '/parent/refunds', label: 'الاسترجاعات', icon: RotateCcw },
  { href: '/parent/recommendations', label: 'توصيات AI', icon: Sparkles },
  { href: '/parent/reports', label: 'التقارير', icon: FileBarChart },
]

export const TEACHER_NAV: NavItem[] = [
  { href: '/teacher', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/teacher/schedule', label: 'جدول الحصص', icon: CalendarDays },
  { href: '/teacher/students', label: 'الطلاب', icon: Users },
  { href: '/teacher/homework', label: 'الواجبات', icon: BookOpen },
  { href: '/teacher/courses', label: 'الكورسات والمحتوى', icon: BookOpen },
  { href: '/teacher/reviews', label: 'التقييمات', icon: Star },
  { href: '/teacher/payouts', label: 'المحافظ والسحب', icon: Wallet },
  { href: '/teacher/profile', label: 'الملف الشخصي', icon: Settings },
]

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/admin/approvals', label: 'اعتماد المعلمين', icon: UserCheck },
  { href: '/admin/users', label: 'المستخدمون', icon: Users },
  { href: '/admin/transactions', label: 'المعاملات', icon: Wallet },
  { href: '/admin/escrow', label: 'الضمان (Escrow)', icon: ShieldCheck },
  { href: '/admin/payouts', label: 'طلبات السحب', icon: CreditCard },
  { href: '/admin/financials', label: 'التقارير المالية', icon: ClipboardList },
  { href: '/admin/reports', label: 'التقارير الإدارية', icon: FileBarChart },
  { href: '/admin/sessions', label: 'سجل الحصص', icon: CalendarClock },
  { href: '/admin/slider', label: 'سلايدر الواجهة', icon: Images },
  { href: '/admin/supervisors', label: 'المشرفون التربويون', icon: UserCog },
  { href: '/admin/trials', label: 'الحصص التجريبية', icon: CalendarDays },
  { href: '/admin/whatsapp-reports', label: 'تقارير واتساب', icon: FileBarChart },
  { href: '/admin/teacher-pricing', label: 'تسعير المعلمين', icon: Settings },
  { href: '/admin/reviews', label: 'التقييمات', icon: Star },
  { href: '/admin/alerts', label: 'تنبيهات AI', icon: AlertTriangle },
  { href: '/admin/tracks', label: 'المسارات', icon: Layers },
  { href: '/admin/settings', label: 'إعدادات الموقع', icon: Settings },
  { href: '/admin/posts', label: 'منشورات AI', icon: Sparkles },
]

export const SUPERVISOR_NAV: NavItem[] = [
  { href: '/supervisor', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/supervisor/sessions', label: 'الحصص والتقارير', icon: CalendarClock },
  { href: '/supervisor/reports', label: 'تقاريري', icon: FileBarChart },
  { href: '/supervisor/profile', label: 'الملف الشخصي', icon: Settings },
]

export function getNavForRole(role: string): NavItem[] {
  switch (role) {
    case 'PARENT':
      return PARENT_NAV
    case 'TEACHER':
      return TEACHER_NAV
    case 'ADMIN':
      return ADMIN_NAV
    case 'SUPERVISOR':
      return SUPERVISOR_NAV
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
  SUPERVISOR: { label: 'مشرف تربوي', emoji: '📋', home: '/supervisor' },
}
