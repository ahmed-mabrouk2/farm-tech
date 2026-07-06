'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import SidebarNav from '@/components/sidebar-nav'
import { useLanguage } from '@/lib/language-context'

export default function FarmHistoryPage() {
  const { t, language } = useLanguage()
  const L = t.farmHistory
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    function load() {
      const saved = localStorage.getItem('farmtec-history')
      if (saved) {
        try {
          setHistory(JSON.parse(saved))
          return
        } catch (e) {}
      }

      const isAr = language === 'ar'
      const defaults = [
        {
          id: 1,
          date: isAr ? '4 يوليو 2026' : 'Jul 4, 2026',
          time: '02:30 PM',
          event: isAr ? 'مسح صحة التربة' : 'Soil Health Scan',
          details: isAr ? 'تم إجراء مسح تفصيلي لقطعة الأرض رقم 3 بالدلتا.' : 'Performed high-resolution soil NPK scanning on Plot 3.',
          type: 'soil',
        },
        {
          id: 2,
          date: isAr ? '3 يوليو 2026' : 'Jul 3, 2026',
          time: '10:15 AM',
          event: isAr ? 'تشغيل ري مجدول' : 'Irrigation Cycle Run',
          details: isAr ? 'تم تشغيل نظام الري التلقائي لمدة 45 دقيقة.' : 'Automatic drip irrigation running for 45 minutes on crop fields.',
          type: 'irrigation',
        },
        {
          id: 3,
          date: isAr ? '2 يوليو 2026' : 'Jul 2, 2026',
          time: '03:45 PM',
          event: isAr ? 'كشف عن مرض بالنبات' : 'Disease Detection Scan',
          details: isAr ? 'تم فحص صورة ورقة نبات الطماطم؛ النتيجة: سليمة.' : 'Plant scan completed on Tomato Leaf: Classified as Healthy.',
          type: 'disease',
        },
        {
          id: 4,
          date: isAr ? '1 يوليو 2026' : 'Jul 1, 2026',
          time: '11:20 AM',
          event: isAr ? 'توصيات السماد المخصصة' : 'Fertilizer Optimization',
          details: isAr ? 'تم حساب كميات السماد المستهدفة لمحصول الذرة.' : 'Fertilizer target levels updated dynamically for Maize crop.',
          type: 'fertilizer',
        },
      ]
      setHistory(defaults)
      localStorage.setItem('farmtec-history', JSON.stringify(defaults))
    }

    load()
    window.addEventListener('farmtec-history-updated', load)
    return () => {
      window.removeEventListener('farmtec-history-updated', load)
    }
  }, [language])

  const getIcon = (type: string) => {
    switch (type) {
      case 'prediction':
        return '📊'
      case 'irrigation':
        return '💧'
      case 'disease':
        return '🔍'
      case 'fertilizer':
        return '🌱'
      case 'weather':
        return '🌤️'
      case 'soil':
        return '🏞️'
      default:
        return '📝'
    }
  }

  const stats = [
    { label: L.stats[0] || "Total Activities", value: history.length },
    { label: L.stats[1] || "This Month", value: history.length },
    { label: L.stats[2] || "This Week", value: Math.min(history.length, 3) },
    { label: L.stats[3] || "Today", value: history.filter(h => h.date.includes('4') || h.date.includes('Jul 4')).length },
  ]

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background">
      <SidebarNav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{L.title}</h1>
            <p className="text-muted-foreground mt-2">{L.subtitle}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-6 text-foreground">{L.timelineTitle}</h2>
            
            <div className="space-y-0">
              {history.map((item, index) => (
                <div key={item.id} className="flex gap-6 pb-6 relative">
                  {/* Timeline Line */}
                  {index !== history.length - 1 && (
                    <div className="absolute start-6 top-12 w-0.5 h-12 bg-border"></div>
                  )}
                  
                  {/* Icon */}
                  <div className="flex-shrink-0 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-accent border-2 border-border flex items-center justify-center text-lg">
                      {getIcon(item.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-foreground">{item.event}</h3>
                      <span className="text-xs text-muted-foreground bg-accent/50 px-2 py-1 rounded">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.details}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-center py-6 text-muted-foreground">No activities found.</p>
              )}
            </div>
          </div>

          {/* Load More */}
          <div className="text-center mt-6">
            <button className="px-6 py-2 border border-border rounded-lg font-semibold text-foreground hover:bg-accent transition">
              {L.loadMore}
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
