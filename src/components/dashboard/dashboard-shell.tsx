'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut, Bell, ChevronLeft, Home } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { ThemeToggle } from '@/components/site/theme-toggle'
import { KidsModeToggle } from '@/components/site/kids-mode-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useDashboardUser } from './use-dashboard-user'
import { getNavForRole, ROLE_META } from './nav-config'
import type { NavItem } from './nav-config'

interface DashboardShellProps {
  role: 'PARENT' | 'TEACHER' | 'ADMIN'
  children: React.ReactNode
  /** optional page title override (defaults to matched nav label) */
  title?: string
}

/**
 * DashboardShell — shared layout for all dashboard pages.
 *
 * - Desktop: fixed sidebar on the RIGHT (RTL) + main content on left
 * - Mobile: hamburger opens Sheet drawer with nav
 * - Top bar: logo (mobile) + page title + notifications + theme + user menu
 */
export function DashboardShell({ role, children, title }: DashboardShellProps) {
  const { user, loading, logout } = useDashboardUser(role)
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [notifOpen, setNotifOpen] = React.useState(false)

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pharaonic">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-gold/30 border-t-gold animate-spin" />
          <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    )
  }

  const navItems = getNavForRole(role)
  const roleMeta = ROLE_META[role]

  // Resolve page title from nav
  const activeItem = navItems.find(
    (item) => pathname === item.href || (item.href !== `/${role.toLowerCase()}` && pathname.startsWith(item.href)),
  )
  const pageTitle = title ?? activeItem?.label ?? 'لوحة التحكم'

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen flex flex-col bg-pharaonic">
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border/50">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full"
                aria-label="فتح القائمة"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="px-4 py-4 border-b border-border/50">
                <SheetTitle className="flex items-center gap-2">
                  <Logo size={32} showText={false} />
                  <span className="font-display font-bold">{roleMeta.label}</span>
                </SheetTitle>
              </SheetHeader>
              <SidebarContent
                navItems={navItems}
                pathname={pathname}
                user={user}
                onNavigate={() => setMobileOpen(false)}
                onLogout={handleLogout}
              />
            </SheetContent>
          </Sheet>

          {/* Logo (desktop) */}
          <Link href="/" className="hidden lg:flex items-center">
            <Logo size={36} />
          </Link>

          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center">
            <Logo size={32} showText={false} />
          </Link>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-base lg:text-lg truncate">{pageTitle}</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative"
              aria-label="الإشعارات"
              onClick={() => setNotifOpen((v) => !v)}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-kids-red" />
            </Button>
            <KidsModeToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
              aria-label="تسجيل الخروج"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar (RTL: right side) */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-l border-border/50 bg-card/40 backdrop-blur-sm">
          <SidebarContent
            navItems={navItems}
            pathname={pathname}
            user={user}
            onLogout={handleLogout}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Notifications dropdown */}
      {notifOpen && (
        <NotificationsDropdown userId={user.id} onClose={() => setNotifOpen(false)} />
      )}
    </div>
  )
}

/** Sidebar inner content — used in both desktop + mobile */
function SidebarContent({
  navItems,
  pathname,
  user,
  onNavigate,
  onLogout,
}: {
  navItems: NavItem[]
  pathname: string
  user: { name: string | null; role: string }
  onNavigate?: () => void
  onLogout: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/parent' &&
              item.href !== '/teacher' &&
              item.href !== '/admin' &&
              pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-gradient-to-l from-gold/20 to-gold/5 text-foreground border border-gold/30'
                  : 'text-muted-foreground hover:bg-gold/10 hover:text-foreground',
              )}
            >
              <item.icon
                className={cn('h-5 w-5 shrink-0', isActive && 'text-gold')}
                strokeWidth={2}
              />
              <span className="truncate">{item.label}</span>
              {isActive && <ChevronLeft className="h-4 w-4 mr-auto text-gold" />}
            </Link>
          )
        })}
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-border/50">
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-base font-bold shrink-0">
              {user.name?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                {ROLE_META[user.role]?.label}
              </p>
            </div>
          </div>
          <Link
            href="/"
            onClick={onNavigate}
            className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-border/50 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            العودة للموقع
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Notifications dropdown — fetched from /api/notifications */
function NotificationsDropdown({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [notifs, setNotifs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => {
        setNotifs(data.notifications ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div className="absolute top-14 left-4 lg:left-auto lg:right-6 z-50 w-80 max-w-[calc(100vw-2rem)] glass-strong rounded-2xl border border-gold/20 shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-display font-bold text-sm">الإشعارات</h3>
          <button onClick={onClose} aria-label="إغلاق">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>
          ) : notifs.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">لا توجد إشعارات</div>
          ) : (
            <ul className="divide-y divide-border/30">
              {notifs.slice(0, 8).map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    'px-4 py-3 hover:bg-gold/5 transition-colors',
                    !n.isRead && 'bg-gold/5',
                  )}
                >
                  <p className="text-sm font-bold">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

/* TODO(phase-3): Add notification badge count in real-time via WebSocket (Phase 4). */
