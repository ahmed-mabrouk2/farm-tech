'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import SidebarNav from '@/components/sidebar-nav'
import { useLanguage } from "@/lib/language-context"
import { apiFetch, API } from '@/lib/api'
import { Bug, Calendar, ShieldCheck, TrendingUp, Loader2 } from 'lucide-react'

interface CropField {
  id: number
  crop_type: string
  area: number
  soil_type: string
  soil_moisture: number | null
  latitude: string
  longitude: string
  ndvi: number | null
  temperature: number | null
  humidity: number | null
  farm_name?: string
}

interface Threat {
  fieldName: string
  cropType: string
  pestName: string
  risk: string
  action: string
  image: string
}

export default function PestManagementPage() {
  const { t, dir } = useLanguage()
  const L = t.pestManagement

  const [fields, setFields] = useState<CropField[]>([])
  const [loading, setLoading] = useState(true)
  const [threats, setThreats] = useState<Threat[]>([])
  const [pestFreePercentage, setPestFreePercentage] = useState(100)

  useEffect(() => {
    async function loadFields() {
      setLoading(true)
      try {
        const res = await apiFetch(API.fields)
        if (res.ok) {
          const data = await res.json()
          const list: CropField[] = Array.isArray(data) ? data : data.results ?? []
          setFields(list)
          
          // Generate threats dynamically
          const generatedThreats: Threat[] = []
          let lowRiskCount = 0

          list.forEach((f) => {
            const ndvi = f.ndvi ?? 0.6
            const moisture = f.soil_moisture ?? 40

            let risk = "Low"
            let action = "Maintain standard crop rotation and routine monitoring."
            let pestName = "Aphids"
            let image = "🕷️"

            // Choose pest based on crop
            const crop = f.crop_type.toLowerCase()
            if (crop === "wheat") {
              pestName = "Wheat Aphids / Rust"
              image = "🌾"
            } else if (crop === "corn" || crop === "maize") {
              pestName = "Corn Rootworm / Armyworms"
              image = "🦗"
            } else if (crop === "rice") {
              pestName = "Leafhoppers / Blast"
              image = "🌾"
            } else if (crop === "tomato") {
              pestName = "Leaf Mold / Tomato Fruitworm"
              image = "🐛"
            } else if (crop === "potato") {
              pestName = "Colorado Potato Beetle"
              image = "🐞"
            }

            if (ndvi < 0.4 || moisture > 70) {
              risk = "High"
              action = "Immediate action needed: Apply target organic fungicides or chemical control. Monitor field daily."
            } else if (ndvi < 0.55 || moisture > 55) {
              risk = "Medium"
              action = "Optimize irrigation immediately to avoid mold. Apply neem oil or biological controls."
            } else {
              lowRiskCount++
            }

            generatedThreats.push({
              fieldName: `${f.crop_type.charAt(0).toUpperCase() + f.crop_type.slice(1)} Field`,
              cropType: f.crop_type,
              pestName,
              risk,
              action,
              image
            })
          })

          setThreats(generatedThreats)
          
          if (list.length > 0) {
            setPestFreePercentage(Math.round((lowRiskCount / list.length) * 100))
          } else {
            setPestFreePercentage(100)
          }
        }
      } catch (err) {
        console.error("Failed to load crop fields for pest management:", err)
      } finally {
        setLoading(false)
      }
    }
    loadFields()
  }, [])

  return (
    <div dir={dir} className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background text-foreground">
      <SidebarNav isOpen={true} onToggle={() => {}} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{L.title}</h1>
            <p className="text-muted-foreground mt-2">{L.subtitle}</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing dynamic pest threats from your active fields...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Dynamic Threats list */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Bug className="w-5 h-5 text-red-500" /> Active Dynamic Pest Threats
                  </h2>
                  {threats.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-60" />
                      <p className="font-semibold text-foreground">All fields are clear!</p>
                      <p className="text-xs">No pest/disease threats detected at this time.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {threats.map((threat, index) => (
                        <div key={index} className="border border-border rounded-lg p-4 bg-accent/30">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{threat.image}</span>
                              <div>
                                <h3 className="font-semibold text-foreground">{threat.pestName}</h3>
                                <p className="text-xs text-muted-foreground">{threat.fieldName}</p>
                              </div>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                              threat.risk === "High" ? 'bg-red-100 text-red-800 border-red-200' :
                              threat.risk === "Medium" ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-green-100 text-green-800 border-green-200'
                            }`}>
                              {threat.risk} Risk
                            </span>
                          </div>
                          <p className="text-sm text-foreground bg-background p-3 rounded border border-border/60">
                            <strong>Action Plan:</strong> {threat.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scheduling */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> Recommended Pest Monitoring
                  </h2>
                  <div className="space-y-3">
                    {threats.filter(t => t.risk !== "Low").length === 0 ? (
                      <div className="flex items-center gap-4 pb-3 border-b border-border last:border-b-0 text-sm">
                        <div className="text-center font-bold">Daily</div>
                        <p className="text-muted-foreground flex-1">Routine check of plant leaf health and moisture levels.</p>
                      </div>
                    ) : (
                      threats.filter(t => t.risk !== "Low").map((threat, idx) => (
                        <div key={idx} className="flex items-center gap-4 pb-3 border-b border-border last:border-b-0 text-sm">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Schedule</p>
                            <p className="font-semibold text-foreground">6:00 AM</p>
                          </div>
                          <p className="text-foreground flex-1">
                            Apply treatment for <strong>{threat.pestName}</strong> on <strong>{threat.fieldName}</strong>
                          </p>
                          <input type="checkbox" className="w-5 h-5 rounded border-border" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Prevention Sidebar */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">{L.prevention}</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-foreground">Rotate cereal crops with nitrogen-fixing faba beans or clover.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-foreground">Do not over-irrigate fields (excess moisture favors molds and pests).</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-foreground">Maintain a healthy crop canopy (higher NDVI correlates to higher pest resistance).</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-3">Overall Crop Health</h3>
                  <p className="text-4xl font-extrabold text-green-600 mb-2">{pestFreePercentage}%</p>
                  <p className="text-sm text-green-700 dark:text-green-400">Pest & Disease Free</p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-4 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> Healthy vegetation is less susceptible to pests
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

