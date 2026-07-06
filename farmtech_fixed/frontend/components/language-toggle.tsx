'use client'

import { useLanguage } from '@/lib/language-context'

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className={`flex gap-1 rounded-lg border border-border bg-muted/30 p-0.5 ${className}`} role="group" aria-label={t.common.language}>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
          language === 'en' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-background'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('ar')}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
          language === 'ar' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-background'
        }`}
      >
        AR
      </button>
    </div>
  )
}
