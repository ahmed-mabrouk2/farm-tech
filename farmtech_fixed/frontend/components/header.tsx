"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { apiFetch, API } from "@/lib/api"

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick = () => {} }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { user, logout } = useAuth()
  const safeUser = user as Record<string, any>
  const router = useRouter()
  const { t } = useLanguage()
  const H = t.header

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Safe user initials
  const displayName = safeUser?.username?.trim() || safeUser?.name?.trim() || "User"
  const initials = displayName
    .split(/\s+/)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()

  return (
    <header className="bg-card border-b border-border px-6 lg:px-8 py-4 flex items-center justify-between shadow-sm">
      {/* Left: Menu & Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label={H.toggleMenu}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Search Bar */}
        <div className="hidden lg:flex items-center gap-2 bg-muted px-4 py-2 rounded-lg flex-1 max-w-md">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder={H.searchPlaceholder}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      {/* Right: Language, theme, notifications & profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <LanguageToggle className="shrink-0" />
        <ThemeToggle />

        {/* Notification Bell */}
        <NotificationBell H={H} />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label={H.profileAria}
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
              {initials}
            </div>
            <span className="hidden lg:inline lg:text-sm font-medium">
              {safeUser?.username || safeUser?.name || t.common.guestUser}
            </span>
          </button>

          {/* Profile Menu */}
          {showProfileMenu && (
            <div className="absolute end-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
              <Link
                href="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-t-lg transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-sm">{H.myProfile}</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-b-lg transition-colors text-destructive"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="text-sm">{t.common.logout}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function NotificationBell({ H }: { H: any }) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function check() {
      try {
        const res = await apiFetch(API.notifications)
        if (res.ok) {
          const data = await res.json()
          const list = Array.isArray(data) ? data : data.results ?? []
          setUnreadCount(list.filter((n: any) => !(n.read_status !== undefined ? n.read_status : n.read)).length)
        }
      } catch (e) {}
    }
    check()

    window.addEventListener('farmtec-notifications-updated', check)

    const interval = setInterval(check, 10000) // Poll every 10 seconds
    return () => {
      clearInterval(interval)
      window.removeEventListener('farmtec-notifications-updated', check)
    }
  }, [])

  return (
    <Link
      href="/notifications"
      className="relative p-2 hover:bg-muted rounded-lg transition-colors flex items-center justify-center"
      aria-label={H.notificationsAria}
    >
      <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
          {unreadCount}
        </span>
      )}
    </Link>
  )
}