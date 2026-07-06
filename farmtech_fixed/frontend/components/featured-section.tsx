'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import { apiFetch, API } from '@/lib/api'

interface DashStats {
  plots_count: number
  total_area: number
}

export default function FeaturedSection() {
  const { t } = useLanguage()
  const F = t.dashboard.featured

  const [stats, setStats] = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch(API.dashboard)
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json) setStats({ plots_count: json.plots_count ?? 0, total_area: json.total_area ?? 0 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const plotsDisplay = loading ? '…' : stats ? String(stats.plots_count) : '--'
  const areaDisplay  = loading ? '…' : stats ? `${stats.total_area.toFixed(1)} ha` : '--'

  return (
    <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-8 border border-border shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-80" />
      <img
        src="/farm-hero.jpg"
        alt={F.alt}
        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
      />

      <div className="relative h-full flex items-center justify-between px-6 md:px-8 z-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">{F.title}</h2>
          <p className="text-white/90 text-lg drop-shadow-md max-w-xl">{F.subtitle}</p>
        </div>

        <div className="hidden lg:flex gap-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 text-white text-center min-w-[100px]">
            <p className="text-sm font-semibold opacity-80 mb-1">{F.activePlots}</p>
            {loading
              ? <div className="h-9 w-12 mx-auto bg-white/20 animate-pulse rounded" />
              : <p className="text-3xl font-bold">{plotsDisplay}</p>
            }
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 text-white text-center min-w-[110px]">
            <p className="text-sm font-semibold opacity-80 mb-1">{F.totalArea}</p>
            {loading
              ? <div className="h-9 w-16 mx-auto bg-white/20 animate-pulse rounded" />
              : <p className="text-3xl font-bold">{areaDisplay}</p>
            }
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </div>
  )
}
