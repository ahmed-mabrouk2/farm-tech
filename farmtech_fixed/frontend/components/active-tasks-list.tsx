'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/language-context'
import { apiFetch, API } from '@/lib/api'
import { Loader2 } from 'lucide-react'

export default function ActiveTasksList() {
  const { t, language } = useLanguage()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTasks() {
      try {
        const [schedRes, plotsRes] = await Promise.all([
          apiFetch(API.schedules),
          apiFetch(API.plots),
        ])
        if (schedRes.ok && plotsRes.ok) {
          const schedData = await schedRes.json()
          const plotsData = await plotsRes.json()

          const schedules = Array.isArray(schedData) ? schedData : schedData.results ?? []
          const plots = Array.isArray(plotsData) ? plotsData : plotsData.results ?? []

          const plotMap = new Map(plots.map((p: any) => [p.id, p]))

          // Filter out completed ones, keep scheduled / in_progress
          const active = schedules
            .filter((s: any) => s.status !== 'completed')
            .map((s: any) => {
              const plot = plotMap.get(s.plot)
              const plotName = plot ? plot.name : `Plot #${s.plot}`
              const crop = plot ? plot.crop_type : ''

              const isAr = language === 'ar'
              const dateObj = new Date(s.scheduled_time)
              const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })

              return {
                id: s.id,
                title: isAr
                  ? `ري حقل ${plotName} (${crop})`
                  : `Irrigate ${plotName} (${crop})`,
                time: isAr
                  ? `مجدول في ${dateStr} - ${timeStr} (${s.duration_minutes} دقيقة)`
                  : `Scheduled at ${dateStr} - ${timeStr} (${s.duration_minutes} mins)`,
                status: s.status,
              }
            })
          setTasks(active)
        }
      } catch (e) {
        console.error("Failed to load active tasks:", e)
      } finally {
        setLoading(false)
      }
    }
    loadTasks()
    const interval = setInterval(loadTasks, 30000)
    return () => clearInterval(interval)
  }, [language])

  const getIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
      case 'in-progress':
        return (
          <svg className="w-5 h-5 text-amber-400 animate-spin" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        )
    }
  }

  return (
    <div className="rounded-xl overflow-hidden border border-emerald-900/60 bg-[#0a2e1f] dark:bg-[#0a1f15] p-5 shadow-lg flex flex-col gap-4 text-white">
      <h2 className="text-base font-semibold flex items-center gap-2 text-white">
        <span className="text-xl">🤖</span>
        {t.dashboard.tasks.title}
      </h2>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 bg-emerald-950/60 border border-emerald-900/60 rounded-lg hover:bg-emerald-900/40 transition-colors"
            >
              <div className="mt-0.5 shrink-0">{getIcon(task.status)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{task.title}</p>
                <p className="text-xs text-emerald-400/70 mt-1">{task.time}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-emerald-400/70">
            <p className="text-sm">{t.common.noTasks || (language === 'ar' ? 'لا توجد مهام نشطة حالياً' : 'No active tasks at the moment')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
