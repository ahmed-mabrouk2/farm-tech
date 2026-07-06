"use client"
import { useState, useEffect } from "react"
import SidebarNav from "@/components/sidebar-nav"
import Header from "@/components/header"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { apiFetch, API } from "@/lib/api"
import dynamic from "next/dynamic"

const CropMap = dynamic(() => import("@/components/map/CropMap"), { 
  ssr: false, 
  loading: () => <div className="h-96 w-full flex items-center justify-center bg-muted/20 animate-pulse rounded-lg border-2 border-dashed border-border text-muted-foreground">Loading Map Area...</div> 
})

interface Farm {
  id: number
  name: string
  location: string
  soil_type: string
  climate_zone: string
  latitude: string | null
  longitude: string | null
  created_at: string
}

interface CropFieldRecord {
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
  status?: "healthy" | "attention"
  farm: number
}

export default function MyFarmPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>("all")
  const { t, language } = useLanguage()
  const L = t.myFarm

  const translateCrop = (crop: string) => {
    const isAr = language === 'ar'
    if (!crop) return isAr ? 'غير محدد' : 'Unknown'
    const clean = crop.trim().toLowerCase()
    if (clean === 'wheat') return isAr ? 'القمح' : 'Wheat'
    if (clean === 'corn' || clean === 'maize') return isAr ? 'الذرة' : 'Corn'
    if (clean === 'cotton') return isAr ? 'القطن' : 'Cotton'
    if (clean === 'rice') return isAr ? 'الأرز' : 'Rice'
    if (clean === 'tomato') return isAr ? 'الطماطم' : 'Tomato'
    if (clean === 'potato') return isAr ? 'البطاطس' : 'Potato'
    if (clean === 'barley') return isAr ? 'الشعير' : 'Barley'
    if (clean === 'soybeans') return isAr ? 'فول الصويا' : 'Soybeans'
    if (clean === 'sugarcane') return isAr ? 'قصب السكر' : 'Sugarcane'
    return crop.charAt(0).toUpperCase() + crop.slice(1)
  }

  const translateSoil = (soil: string) => {
    const isAr = language === 'ar'
    if (!soil) return isAr ? 'تربة غير معروفة' : 'Unknown soil'
    const clean = soil.trim().toLowerCase()
    if (clean === 'loamy' || clean.includes('loam')) return isAr ? 'تربة طينية (Loamy)' : 'Loamy'
    if (clean === 'clayey' || clean.includes('clay')) return isAr ? 'تربة صلصالية (Clayey)' : 'Clayey'
    if (clean === 'sandy' || clean.includes('sand')) return isAr ? 'تربة رملية (Sandy)' : 'Sandy'
    if (clean === 'silty' || clean.includes('silt')) return isAr ? 'تربة غرينية (Silty)' : 'Silty'
    return soil
  }

  // State
  const [farms, setFarms] = useState<Farm[]>([])
  const [fields, setFields] = useState<CropFieldRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const [farmsRes, fieldsRes] = await Promise.all([
          apiFetch(API.farms),
          apiFetch(API.fields),
        ])

        if (farmsRes.ok) {
          const farmsData = await farmsRes.json()
          const farmsList: Farm[] = Array.isArray(farmsData)
            ? farmsData
            : farmsData.results ?? []
          setFarms(farmsList)
        }

        if (fieldsRes.ok) {
          const fieldsData = await fieldsRes.json()
          const rawFields: CropFieldRecord[] = Array.isArray(fieldsData)
            ? fieldsData
            : fieldsData.results ?? []
          // Derive health status: fields with ndvi > 0.4 are healthy
          const enriched = rawFields.map((f) => ({
            ...f,
            status: ((f.ndvi ?? 0.5) > 0.4 ? "healthy" : "attention") as "healthy" | "attention",
          }))
          setFields(enriched)
          if (enriched.length > 0) setSelectedFieldId(enriched[0].id)
        }
      } catch (err: any) {
        setError(err.message || "Failed to load farm data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const activeField = fields.find((f) => f.id === selectedFieldId)

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background text-foreground">
      <SidebarNav isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">{L.title}</h1>
                <p className="text-muted-foreground">{L.subtitle}</p>
              </div>
              <a href="/add-farm">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-11">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-12C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </svg>
                  {L.addFieldBtn}
                </Button>
              </a>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading farm data…</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="py-12 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* Main Content */}
            {!loading && !error && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Interactive Map Area */}
                <div className="lg:col-span-2">
                  <Card className="h-full bg-card border-border">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 flex flex-row items-center justify-between pb-4">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z" />
                          </svg>
                          {L.mapTitle}
                        </CardTitle>
                        <CardDescription>{L.mapDesc}</CardDescription>
                      </div>
                      <div>
                        <select 
                          className="bg-background border border-input rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                          value={selectedCropFilter}
                          onChange={(e) => setSelectedCropFilter(e.target.value)}
                        >
                          <option value="all">{language === 'ar' ? 'جميع المحاصيل' : 'All Crops'}</option>
                          <option value="wheat">{language === 'ar' ? 'القمح' : 'Wheat'}</option>
                          <option value="corn">{language === 'ar' ? 'الذرة' : 'Corn'}</option>
                          <option value="cotton">{language === 'ar' ? 'القطن' : 'Cotton'}</option>
                          <option value="rice">{language === 'ar' ? 'الأرز' : 'Rice'}</option>
                          <option value="tomato">{language === 'ar' ? 'الطماطم' : 'Tomato'}</option>
                          <option value="potato">{language === 'ar' ? 'البطاطس' : 'Potato'}</option>
                        </select>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="w-full">
                        <CropMap selectedCrop={selectedCropFilter} year={2024} />
                      </div>

                      {/* Selected Field Details */}
                      {activeField && (
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                          <h3 className="font-semibold mb-2">
                            {language === 'ar' ? `حقل ${translateCrop(activeField.crop_type)}` : `${translateCrop(activeField.crop_type)} Field`}
                          </h3>
                          <p className="text-sm text-muted-foreground">{L.area} {activeField.area} {L.feddan}</p>
                          {activeField.ndvi && (
                            <p className="text-sm text-muted-foreground">NDVI: {activeField.ndvi.toFixed(3)}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Field List Sidebar */}
                <div className="lg:col-span-1">
                  <Card className="bg-card border-border h-full flex flex-col">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
                        </svg>
                        {L.yourPlots}
                      </CardTitle>
                      <CardDescription>
                        {fields.length} {L.activePlots}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-3 pt-4">
                      {fields.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                          </svg>
                          <p className="text-sm font-medium">No crop fields yet</p>
                          <p className="text-xs mt-1">Add a farm and create fields to get started</p>
                          <a href="/add-farm" className="inline-block mt-3">
                            <Button size="sm" className="bg-primary text-primary-foreground">
                              Add Farm
                            </Button>
                          </a>
                        </div>
                      ) : (
                        fields.map((field) => (
                          <button
                            key={field.id}
                            onClick={() => setSelectedFieldId(field.id)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                              selectedFieldId === field.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-foreground capitalize">{translateCrop(field.crop_type)}</h4>
                                <p className="text-sm text-muted-foreground">{translateSoil(field.soil_type)}</p>
                              </div>
                              <Badge
                                variant={field.status === "healthy" ? "default" : "destructive"}
                                className={field.status === "healthy" ? "bg-accent text-white" : "bg-orange-600 text-white"}
                              >
                                {field.status === "healthy" ? L.healthy : L.alert}
                              </Badge>
                            </div>

                            <div className="space-y-2 mt-3 pt-3 border-t border-border">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">{L.area}</span>
                                <span className="font-medium">{field.area} {L.feddan}</span>
                              </div>
                              {field.soil_moisture !== null && (
                                <div className="flex items-center gap-2 text-xs">
                                  <svg className="w-3.5 h-3.5 text-accent fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.32 0z" />
                                  </svg>
                                  <span className="text-muted-foreground">{L.moisture}</span>
                                  <span className="font-medium">{field.soil_moisture}%</span>
                                </div>
                              )}
                              {field.ndvi !== null && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">NDVI</span>
                                  <span className="font-medium">{field.ndvi?.toFixed(3)}</span>
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Field Detail Card */}
            {!loading && !error && activeField && (
              <Card className="mt-6 bg-card border-border">
                <CardHeader className={`bg-gradient-to-r ${activeField.status === "healthy" ? "from-accent/10 to-primary/10" : "from-orange-500/10 to-red-500/10"}`}>
                  <CardTitle className="flex items-center gap-2">
                    {activeField.status === "attention" && <svg className="w-5 h-5 text-orange-600 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>}
                    {activeField.status === "healthy" && <svg className="w-5 h-5 text-accent fill-current" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>}
                    <span>{language === 'ar' ? `حقل ${translateCrop(activeField.crop_type)}` : `${translateCrop(activeField.crop_type)} Field`} — {L.detailedInfo}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 8C8 10 5.9 16.17 3.82 19.83c-.37.67-.26 1.5.28 2.06C5.54 23.33 7.3 24 9 24c3.31 0 6-2.69 6-6 0-1.3-.37-2.5-1-3.53.67.35 1.33.73 1.97 1.14.63.41 1.03.46 1.03 1.39 0 1.1.9 2 2 2s2-.9 2-2c0-4.41-3.59-8-8-8z" />
                        </svg>
                        <p className="text-xs font-semibold text-muted-foreground">{L.cropTypeCard}</p>
                      </div>
                      <p className="font-bold text-lg text-foreground">{translateCrop(activeField.crop_type)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 rounded-lg hover:border-accent/50 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 3H3v4h2V3zm-2 14h2v4H3v-4zm18-14h-2v4h2V3zm-2 14h2v4h-2v-4zM16 1H8v22h8V1zm-2 19h-4v-2h4v2zm0-4h-4v-6h4v6zm0-8h-4V6h4v2z" />
                        </svg>
                        <p className="text-xs font-semibold text-muted-foreground">{L.area}</p>
                      </div>
                      <p className="font-bold text-lg text-foreground">{activeField.area} {L.feddan}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 rounded-lg hover:border-blue-500/50 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.32 0z" />
                        </svg>
                        <p className="text-xs font-semibold text-muted-foreground">{L.moistureCard}</p>
                      </div>
                      <p className="font-bold text-lg text-foreground">
                        {activeField.soil_moisture !== null ? `${activeField.soil_moisture}%` : "—"}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20 rounded-lg hover:border-secondary/50 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                        </svg>
                        <p className="text-xs font-semibold text-muted-foreground">NDVI</p>
                      </div>
                      <p className="font-bold text-lg text-foreground">
                        {activeField.ndvi !== null ? activeField.ndvi?.toFixed(3) : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Farms Summary */}
            {!loading && !error && farms.length > 0 && (
              <Card className="mt-6 bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'ar' ? 'مزارعي' : 'My Farms'}</CardTitle>
                  <CardDescription>{language === 'ar' ? `تم تسجيل ${farms.length} مزرعة` : `${farms.length} farm(s) registered`}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {farms.map((farm) => (
                      <div key={farm.id} className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors">
                        <h4 className="font-semibold text-foreground mb-1">{farm.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{farm.location}</p>
                        {farm.soil_type && (
                          <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {translateSoil(farm.soil_type)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
