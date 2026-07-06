'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '@/lib/language-context'
import { fetchForecast, fetchFarms } from '@/lib/api'
import { normalizeCropToEnglish } from '@/lib/utils'

export default function PriceChart() {
  const { t, language } = useLanguage()
  const P = t.dashboard.priceChart

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCrops, setActiveCrops] = useState<string[]>(['Wheat', 'Corn', 'Rice'])

  useEffect(() => {
    fetchFarms().then(farms => {
      let crops = ['Wheat', 'Corn', 'Rice']
      if (farms && farms.length > 0) {
        const plotsWithCrops = farms.flatMap(f => 
          (f.plots || []).filter((p: any) => p.crop_type)
            .map((p: any) => {
              const eng = normalizeCropToEnglish(p.crop_type)
              if (eng === 'corn') return 'Maize'
              if (eng === 'barley' || eng === 'cotton' || eng === 'soybeans' || eng === 'sugarcane') return 'Wheat'
              return eng.charAt(0).toUpperCase() + eng.slice(1)
            })
        )
        if (plotsWithCrops.length > 0) {
          crops = Array.from(new Set(plotsWithCrops)).slice(0, 3) // Max 3 crops for the chart
        }
      }
      setActiveCrops(crops)
      
      const promises = crops.map(c => fetchForecast(c).catch(() => []))
      
      Promise.all(promises).then((results) => {
        const quarters = new Set<string>()
        const map: Record<string, any> = {}

        const process = (commodityData: any, key: string) => {
          const list = Array.isArray(commodityData) ? commodityData : (commodityData?.forecast || [])
          list.forEach((item: any) => {
            const qStr = `Q${item.quarter} ${item.year}`
            quarters.add(qStr)
            if (!map[qStr]) {
              map[qStr] = { month: qStr }
              crops.forEach(c => map[qStr][c.toLowerCase()] = 0)
            }
            map[qStr][key.toLowerCase()] = Math.round(item.price)
          })
        }

        crops.forEach((c, i) => process(results[i], c))

        // Sort quarters chronologically
        const sorted = Array.from(quarters).sort((a, b) => {
          const [qa, ya] = a.split(' ')
          const [qb, yb] = b.split(' ')
          if (ya !== yb) return ya.localeCompare(yb)
          return qa.localeCompare(qb)
        })

        const finalRows = sorted.map(q => map[q])
        setData(finalRows)
      }).finally(() => setLoading(false))
    }).catch(err => {
      setLoading(false)
    })
  }, [])

  const maxValue = useMemo(() => {
    let max = 100
    data.forEach((item) => {
      activeCrops.forEach(c => {
        max = Math.max(max, item[c.toLowerCase()] || 0)
      })
    })
    return max * 1.15 // Add margin for bars
  }, [data, activeCrops])

  return (
    <div className="rounded-xl overflow-hidden border border-emerald-900/60 bg-[#0a2e1f] dark:bg-[#0a1f15] p-6 shadow-lg text-white">
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18 10 11.41l4 4 6.3-6.29L22 12v-6z" />
          </svg>
          {P.title}
        </h2>
        <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">{P.badge}</span>
      </div>

      <div className="space-y-4 min-h-[150px] flex flex-col justify-center">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-12 bg-emerald-900/40 animate-pulse rounded" />
                <div className="h-6 w-full bg-emerald-900/40 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : data.length > 0 ? (
          data.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between text-sm gap-2">
                <span className="font-semibold text-emerald-300">{item.month}</span>
                <div className="flex gap-4 text-xs flex-wrap justify-end">
                  {activeCrops.map((c, i) => (
                    <span key={c} className="flex items-center gap-1 font-semibold text-white">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${i === 0 ? 'bg-emerald-400' : i === 1 ? 'bg-teal-400' : 'bg-lime-400'}`} />
                      {P[c.toLowerCase()] || c}: {item[c.toLowerCase()] ? `${item[c.toLowerCase()].toLocaleString()} EGP` : '--'}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 h-6 bg-emerald-950/40 rounded p-1">
                {activeCrops.map((c, i) => (
                  <div
                    key={c}
                    className={`rounded opacity-90 transition-all duration-500 ${i === 0 ? 'bg-emerald-400' : i === 1 ? 'bg-teal-400' : 'bg-lime-400'}`}
                    style={{ width: `${((item[c.toLowerCase()] || 0) / maxValue) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-emerald-400/70">
            <p className="text-sm">{language === 'ar' ? 'لا توجد بيانات أسعار متاحة حالياً' : 'No market price data available'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
