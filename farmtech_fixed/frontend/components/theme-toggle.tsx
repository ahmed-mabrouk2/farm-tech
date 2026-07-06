'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/50 ${className}`}
        aria-hidden
      />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted ${className}`}
      title={isDark ? t.common.lightMode : t.common.darkMode}
      aria-label={isDark ? t.common.lightMode : t.common.darkMode}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
