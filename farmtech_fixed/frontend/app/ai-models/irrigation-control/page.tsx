'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/header'
import SidebarNav from '@/components/sidebar-nav'
import { useLanguage } from "@/lib/language-context"
import { apiFetch, API, analyzeIrrigation } from '@/lib/api'
import { Brain, Droplet, Sparkles, Loader2, Info } from 'lucide-react'

interface IrrigationResult {
  irrigation_need_mm_season: number
  irrigation_class: string
  confidence: number
  uncertainty_score: number
  reliability_flag: string
  season: string
  active_months: number[]
  diagnostics: string[]
}

export default function IrrigationControlPage() {
  const { t, dir } = useLanguage()
  const L = t.irrigationControl

  const [selectedCrop, setSelectedCrop] = useState('wheat')
  const [lat, setLat] = useState(30.08)
  const [lon, setLon] = useState(31.25)
  const [year, setYear] = useState(2024)

  const [fields, setFields] = useState<any[]>([])
  const [dashboard, setDashboard] = useState<any>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiResult, setApiResult] = useState<IrrigationResult | null>(null)

  // Fetch user fields and dashboard details
  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const [fieldsRes, dashRes] = await Promise.all([
          apiFetch(API.fields),
          apiFetch(API.dashboard)
        ])
        if (fieldsRes.ok) {
          const fieldsData = await fieldsRes.ok ? await fieldsRes.json() : []
          setFields(Array.isArray(fieldsData) ? fieldsData : fieldsData.results ?? [])
        }
        if (dashRes.ok) {
          const dashData = await dashRes.json()
          setDashboard(dashData)
        }
      } catch (err) {
        console.error("Failed to load irrigation dashboard stats:", err)
      }
    }
    loadDashboardStats()
  }, [])

  const runPrediction = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await analyzeIrrigation({
        lat,
        lon,
        crop: selectedCrop,
        year
      })
      if (result.error) {
        throw new Error(result.error)
      }
      setApiResult(result)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to analyze irrigation needs")
    } finally {
      setLoading(false)
    }
  }, [lat, lon, selectedCrop, year])

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Controls Form */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">AI Irrigation Predictor</h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2">Crop Type</label>
                    <select
                      value={selectedCrop}
                      onChange={(e) => { setSelectedCrop(e.target.value); setApiResult(null); }}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                    >
                      <option value="wheat">Wheat</option>
                      <option value="corn">Corn/Maize</option>
                      <option value="rice">Rice</option>
                      <option value="barley">Barley</option>
                      <option value="soybeans">Soybeans</option>
                      <option value="cotton">Cotton</option>
                      <option value="sugarcane">Sugarcane</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2">Latitude</label>
                    <input
                      type="number" step="0.01"
                      value={lat}
                      onChange={(e) => { setLat(parseFloat(e.target.value) || 0); setApiResult(null); }}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2">Longitude</label>
                    <input
                      type="number" step="0.01"
                      value={lon}
                      onChange={(e) => { setLon(parseFloat(e.target.value) || 0); setApiResult(null); }}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                    />
                  </div>
                  <button
                    onClick={runPrediction}
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm
                               hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Brain className="w-4 h-4" /> Run AI Predictor</>
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-sm text-destructive mt-3 font-semibold">{error}</p>
                )}
              </div>

              {/* Status and Active Zones */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">{L.sysStatus}</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-accent/30 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">Registered Fields</p>
                    <p className="text-3xl font-bold text-green-600">{fields.length}</p>
                  </div>
                  <div className="text-center p-4 bg-accent/30 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">Latest Schedule</p>
                    <p className="text-lg font-bold text-blue-600 truncate mt-1">
                      {dashboard?.latest_irrigation ? `${dashboard.latest_irrigation.duration_minutes || 0} min` : "None"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-accent/30 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">Soil Health</p>
                    <p className="text-3xl font-bold text-green-600">
                      {dashboard?.latest_soil_record ? `${dashboard.latest_soil_record.moisture}%` : "Good"}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Fields as Active Zones */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Active Field Zones</h2>
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No fields registered yet. Create fields under "My Farm" page.</p>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, idx) => (
                      <div key={field.id || idx} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground capitalize">{field.crop_type} Field ({field.farm_name || "Plot"})</h3>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            {field.area} feddans
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>Soil: {field.soil_type || "Loamy"}</span>
                          <span>Moisture: {field.soil_moisture ? `${field.soil_moisture}%` : "Adequate"}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all" 
                            style={{ width: `${field.soil_moisture || 40}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Predictions Sidebar Output */}
            <div>
              {apiResult ? (
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                  <div className="flex items-center justify-between border-b pb-3 border-border">
                    <h3 className="text-lg font-bold text-foreground">Irrigation Plan</h3>
                    <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full capitalize">
                      {apiResult.season}
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-5 text-center">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">RECOMMENDED WATER DEPTH</p>
                    <p className="text-4xl font-extrabold text-blue-600">{apiResult.irrigation_need_mm_season} mm</p>
                    <p className="text-sm text-blue-800 dark:text-blue-400 font-bold mt-2">{apiResult.irrigation_class}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-accent/40 rounded-lg p-3 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-0.5">Confidence</p>
                      <p className="text-lg font-bold text-foreground">{(apiResult.confidence * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-accent/40 rounded-lg p-3 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-0.5">Uncertainty</p>
                      <p className="text-lg font-bold text-foreground">{apiResult.uncertainty_score.toFixed(2)}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-blue-500" /> Growing Season Months
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Active months: {apiResult.active_months.map(m => `Month ${m}`).join(", ")}
                    </p>
                  </div>

                  {apiResult.diagnostics && apiResult.diagnostics.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-2">Agronomic Diagnostics</h4>
                      <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                        {apiResult.diagnostics.map((diag, index) => (
                          <li key={index}>{diag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                  <Droplet className="w-16 h-16 text-muted-foreground opacity-30 mb-4 animate-bounce" />
                  <p className="text-lg font-semibold text-foreground mb-1">No plan calculated</p>
                  <p className="text-sm">Enter coordinates and click <strong>Run AI Predictor</strong> to view the seasonal irrigation schedule.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

