"use client"
import { useState, useEffect, useCallback } from "react"
import SidebarNav from "@/components/sidebar-nav"
import Header from "@/components/header"
import { pushNotification, pushFarmHistory } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, RefreshCw, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { apiFetch, fetchSoilHealth, API } from "@/lib/api"

interface SoilData {
  health_score: number
  status_label: string
  soil_properties: {
    ph: number
    soil_organic_carbon_g_kg: number
    nitrogen_g_kg: number
    clay_percent: number
    cec_cmol_kg: number
    soil_moisture_percent: number
  }
  component_scores: {
    ph_score: number
    organic_matter_score: number
    nitrogen_score: number
    moisture_score: number
    cec_score: number
  }
  fertility_index: number | null
  aridity_index: number | null
  nearest_field: {
    crop: string
    year: number
    lat: number
    lon: number
  }
}

export default function SoilHealthPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { t, language } = useLanguage()
  const L = t.soilHealth

  const translateCrop = (crop: string) => {
    const isAr = language === 'ar'
    if (!crop) return isAr ? 'غير محدد' : 'Unknown'
    const clean = crop.trim().toLowerCase()
    if (clean === 'wheat') return isAr ? 'القمح' : 'Wheat'
    if (clean === 'corn' || clean === 'maize') return isAr ? 'الذرة الصفراء' : 'Corn'
    if (clean === 'cotton') return isAr ? 'القطن' : 'Cotton'
    if (clean === 'rice') return isAr ? 'الأرز' : 'Rice'
    if (clean === 'tomato') return isAr ? 'الطماطم' : 'Tomato'
    if (clean === 'potato') return isAr ? 'البطاطس' : 'Potato'
    if (clean === 'barley') return isAr ? 'الشعير' : 'Barley'
    if (clean === 'soybeans') return isAr ? 'فول الصويا' : 'Soybeans'
    if (clean === 'sugarcane') return isAr ? 'قصب السكر' : 'Sugarcane'
    return crop.charAt(0).toUpperCase() + crop.slice(1)
  }

  const [soilData, setSoilData] = useState<SoilData | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Default Egypt coords (Cairo region)
  const [lat, setLat] = useState(30.0)
  const [lon, setLon] = useState(31.0)
  const [selectedCrop, setSelectedCrop] = useState("wheat")

  const [fields, setFields] = useState<any[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string>("manual")

  // Load fields on mount
  useEffect(() => {
    async function loadFields() {
      try {
        const res = await apiFetch(API.fields)
        if (res.ok) {
          const data = await res.json()
          const list = Array.isArray(data) ? data : data.results ?? []
          setFields(list)
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadFields()
  }, [])

  const handleFieldChange = (fieldId: string) => {
    setSelectedFieldId(fieldId)
    if (fieldId === "manual") return
    const field = fields.find(f => String(f.id) === fieldId)
    if (field) {
      setLat(parseFloat(field.latitude) || parseFloat(field.lat) || 30.0)
      setLon(parseFloat(field.longitude) || parseFloat(field.lon) || 31.0)
      setSelectedCrop(field.crop_type || field.crop || "wheat")
    }
  }

  const fetchData = useCallback(async (isUserClick = false) => {
    setLoading(true)
    setError(null)
    try {
      const [soilRes, dashRes] = await Promise.all([
        fetchSoilHealth({ lat, lon, crop: selectedCrop }),
        apiFetch(API.dashboard),
      ])

      setSoilData(soilRes)

      if (dashRes?.ok) {
        const dash = await dashRes.json()
        setDashboardData(dash.latest_soil_record ?? null)
      }

      if (isUserClick) {
        const activeField = fields.find(f => String(f.id) === selectedFieldId)
        pushNotification(
          "alert",
          language === "ar" ? "تحليل صحة التربة ناجح" : "Soil Health Analysis Successful",
          language === "ar"
            ? `تم تحليل صحة التربة لمحصول (${selectedCrop}) بنجاح. النتيجة الإجمالية للتربة: ${soilRes.health_score} (${soilRes.status_label}).`
            : `Soil health analysis for crop (${selectedCrop}) completed successfully. Overall score: ${soilRes.health_score} (${soilRes.status_label}).`,
          activeField?.id,
          activeField?.name
        )

        pushFarmHistory(
          "soil",
          language === "ar" ? "مسح صحة التربة" : "Soil Health Scan",
          language === "ar"
            ? `تحليل التربة لمحصول (${selectedCrop}) عند خط عرض ${lat.toFixed(2)} وخط طول ${lon.toFixed(2)}. النتيجة: ${soilRes.health_score}.`
            : `Soil health scan for (${selectedCrop}) at (${lat.toFixed(2)}, ${lon.toFixed(2)}). Result: ${soilRes.health_score}.`,
          activeField?.id,
          activeField?.name
        )
      }
    } catch (err: any) {
      setError(err.message || "Failed to load soil health data")
    } finally {
      setLoading(false)
    }
  }, [lat, lon, selectedCrop, language, fields, selectedFieldId])

  useEffect(() => {
    fetchData(false)
  }, [fetchData])

  // Build nutrient gauges from real API data
  const nutrients = soilData
    ? [
        {
          name: L.nutrients.n,
          value: Math.round(Math.min(100, (soilData.soil_properties.nitrogen_g_kg / 3.0) * 100)),
          score: soilData.component_scores.nitrogen_score,
          status: soilData.component_scores.nitrogen_score >= 60 ? "optimal" : soilData.component_scores.nitrogen_score >= 30 ? "good" : "low" as any,
          trend: "up" as const,
          raw: `${soilData.soil_properties.nitrogen_g_kg} g/kg`,
        },
        {
          name: L.nutrients.p,
          value: Math.round(soilData.component_scores.organic_matter_score),
          score: soilData.component_scores.organic_matter_score,
          status: soilData.component_scores.organic_matter_score >= 60 ? "optimal" : "good" as any,
          trend: "stable" as const,
          raw: `${soilData.soil_properties.soil_organic_carbon_g_kg} g/kg SOC`,
        },
        {
          name: L.nutrients.k,
          value: Math.round(soilData.component_scores.cec_score),
          score: soilData.component_scores.cec_score,
          status: soilData.component_scores.cec_score >= 60 ? "optimal" : "good" as any,
          trend: "up" as const,
          raw: `${soilData.soil_properties.cec_cmol_kg} cmol/kg`,
        },
      ]
    : []

  const phLevel = soilData?.soil_properties.ph ?? 7.0
  const moistureLevel = soilData?.soil_properties.soil_moisture_percent ?? 0

  // Build a simple trend chart from component scores
  const componentChartData = soilData
    ? [
        { name: "pH",     score: Math.round(soilData.component_scores.ph_score) },
        { name: "N",      score: Math.round(soilData.component_scores.nitrogen_score) },
        { name: "OM",     score: Math.round(soilData.component_scores.organic_matter_score) },
        { name: "Moist.", score: Math.round(soilData.component_scores.moisture_score) },
        { name: "CEC",    score: Math.round(soilData.component_scores.cec_score) },
      ]
    : []

  const aiRecommendations = L.recs

  const getGaugeColor = (value: number): string => {
    if (value < 40) return "text-red-600"
    if (value < 60) return "text-yellow-600"
    if (value < 80) return "text-blue-600"
    return "text-green-600"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "optimal":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
      case "good":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
      case "low":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
      case "high":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
      default:
        return ""
    }
  }

  const statusColor = soilData
    ? soilData.health_score >= 75 ? "text-green-600"
    : soilData.health_score >= 55 ? "text-blue-600"
    : soilData.health_score >= 35 ? "text-yellow-600"
    : "text-red-600"
    : "text-muted-foreground"

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
              <Button
                onClick={() => fetchData(true)}
                disabled={loading}
                variant="outline"
                className="gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </Button>
            </div>

            {/* Main Side-by-Side Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Left Column: Settings Form */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">{language === 'ar' ? 'الموقع والمحصول' : 'Location & Crop'}</CardTitle>
                    <CardDescription>{language === 'ar' ? 'أدخل معايير تحليل التربة' : 'Enter parameters for soil analysis'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Select Field Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {language === 'ar' ? 'اختر الحقل' : 'Select Field'}
                      </label>
                      <select
                        value={selectedFieldId}
                        onChange={(e) => handleFieldChange(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="manual">{language === 'ar' ? 'إدخال يدوي للإحداثيات' : 'Manual Coordinates'}</option>
                        {fields.map(f => (
                          <option key={f.id} value={String(f.id)}>{f.name} ({translateCrop(f.crop_type)})</option>
                        ))}
                      </select>
                    </div>

                    {/* Crop Selection */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{language === 'ar' ? 'نوع المحصول' : 'Crop Type'}</label>
                      <select
                        value={selectedCrop}
                        onChange={(e) => {
                          setSelectedCrop(e.target.value)
                          setSelectedFieldId("manual")
                        }}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                      >
                        <option value="wheat">{language === 'ar' ? 'القمح' : 'Wheat'}</option>
                        <option value="corn">{language === 'ar' ? 'الذرة الصفراء' : 'Corn/Maize'}</option>
                        <option value="rice">{language === 'ar' ? 'الأرز' : 'Rice'}</option>
                        <option value="cotton">{language === 'ar' ? 'القطن' : 'Cotton'}</option>
                        <option value="tomato">{language === 'ar' ? 'الطماطم' : 'Tomato'}</option>
                        <option value="potato">{language === 'ar' ? 'البطاطس' : 'Potato'}</option>
                      </select>
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{language === 'ar' ? 'خط العرض' : 'Latitude'}</label>
                        <input
                          type="number" step="0.01"
                          value={lat}
                          onChange={(e) => {
                            setLat(parseFloat(e.target.value) || 0)
                            setSelectedFieldId("manual")
                          }}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{language === 'ar' ? 'خط الطول' : 'Longitude'}</label>
                        <input
                          type="number" step="0.01"
                          value={lon}
                          onChange={(e) => {
                            setLon(parseFloat(e.target.value) || 0)
                            setSelectedFieldId("manual")
                          }}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => fetchData(true)}
                      disabled={loading}
                      className="w-full gap-2 mt-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      {language === 'ar' ? 'تحليل صحة التربة' : 'Analyze Soil Health'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Loading / Error / Results */}
              <div className="lg:col-span-3">
                {/* Loading */}
                {loading && (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">{language === 'ar' ? 'جارٍ تحليل بيانات صحة التربة...' : 'Analyzing soil health data…'}</p>
                    </div>
                  </div>
                )}

                {/* Error */}
                {!loading && error && (
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm mb-4">
                      <AlertCircle className="w-5 h-5" />
                      {error}
                    </div>
                    <br />
                    <Button onClick={fetchData} variant="outline" size="sm">{language === 'ar' ? 'المحاولة مجدداً' : 'Try Again'}</Button>
                  </div>
                )}

                {/* Content */}
                {!loading && !error && soilData && (
                  <>
                {/* Overall Health Score Banner */}
                <Card className="mb-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">{language === 'ar' ? 'مؤشر صحة التربة العام' : 'Overall Soil Health Score'}</p>
                        <p className={`text-6xl font-black ${statusColor}`}>{soilData.health_score}</p>
                        <p className={`text-lg font-bold mt-1 ${statusColor}`}>
                          {language === 'ar' ? (soilData.status_label === 'Good' ? 'جيد' : soilData.status_label === 'Optimal' ? 'مثالي' : soilData.status_label === 'Low' ? 'منخفض' : soilData.status_label) : soilData.status_label}
                        </p>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        {soilData.nearest_field && (
                          <div className="col-span-2 p-3 bg-background/60 rounded-lg border border-border text-sm text-muted-foreground">
                            {language === 'ar'
                              ? `📍 بناءً على أقرب حقل: محصول ${translateCrop(soilData.nearest_field.crop)} لعام (${soilData.nearest_field.year}) عند ${soilData.nearest_field.lat.toFixed(3)}, ${soilData.nearest_field.lon.toFixed(3)}`
                              : `📍 Based on nearest field: ${translateCrop(soilData.nearest_field.crop)} crop (${soilData.nearest_field.year}) at ${soilData.nearest_field.lat.toFixed(3)}, ${soilData.nearest_field.lon.toFixed(3)}`}
                          </div>
                        )}
                        {soilData.fertility_index !== null && (
                          <div className="p-3 bg-background/60 rounded-lg border border-border">
                            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'مؤشر الخصوبة' : 'Fertility Index'}</p>
                            <p className="font-bold text-foreground">{soilData.fertility_index?.toFixed(3)}</p>
                          </div>
                        )}
                        {soilData.aridity_index !== null && (
                          <div className="p-3 bg-background/60 rounded-lg border border-border">
                            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'مؤشر الجفاف' : 'Aridity Index'}</p>
                            <p className="font-bold text-foreground">{soilData.aridity_index?.toFixed(3)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Nutrient Gauges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {nutrients.map((nutrient) => (
                    <Card key={nutrient.name} className="bg-card border-border">
                      <CardContent className="pt-6">
                        <div className="mb-4">
                          <h3 className="font-semibold text-foreground mb-1">{nutrient.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(nutrient.status)}`}>
                              {L.statusLabels[nutrient.status as keyof typeof L.statusLabels] ?? nutrient.status}
                            </span>
                            <span className="text-xs text-muted-foreground">{nutrient.raw}</span>
                          </div>
                        </div>

                        {/* Speedometer Gauge */}
                        <div className="flex flex-col items-center mb-4">
                          <div className="relative w-32 h-32 mb-4">
                            <svg className="w-full h-full" viewBox="0 0 200 120">
                              <path d="M 30 100 A 70 70 0 0 1 170 100" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                              <path d="M 30 100 A 70 70 0 0 1 80 35" fill="none" stroke="rgb(220, 38, 38)" strokeWidth="8" />
                              <path d="M 80 35 A 70 70 0 0 1 120 35" fill="none" stroke="rgb(34, 197, 94)" strokeWidth="8" />
                              <path d="M 120 35 A 70 70 0 0 1 170 100" fill="none" stroke="rgb(234, 179, 8)" strokeWidth="8" />
                              <line
                                x1="100" y1="100"
                                x2={100 + 60 * Math.cos(Math.PI - (nutrient.value / 100) * Math.PI)}
                                y2={100 - 60 * Math.sin(Math.PI - (nutrient.value / 100) * Math.PI)}
                                stroke="currentColor" strokeWidth="3"
                                className="text-foreground"
                              />
                              <circle cx="100" cy="100" r="5" fill="currentColor" className="text-foreground" />
                            </svg>
                          </div>
                          <p className={`text-3xl font-bold ${getGaugeColor(nutrient.value)}`}>{nutrient.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{language === 'ar' ? 'الدرجة / 100' : 'Score / 100'}</p>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{L.trendLabel}</span>
                          <div className="flex items-center gap-1">
                            {nutrient.trend === "up" && (
                              <>
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-green-600 font-semibold">{L.trends.up}</span>
                              </>
                            )}
                            {nutrient.trend === "stable" && <span className="text-blue-600 font-semibold">{L.trends.stable}</span>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* pH Level & Moisture */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* pH Level */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle>{L.phTitle}</CardTitle>
                      <CardDescription>{L.phDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="relative h-8 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 p-0.5">
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-1 h-10 bg-foreground rounded-full"
                            style={{ left: `calc(${(phLevel / 14) * 100}% - 2px)` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                          <span>{L.acidic}</span>
                          <span>{L.neutral}</span>
                          <span>{L.alkaline}</span>
                        </div>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-primary">{phLevel.toFixed(1)}</p>
                          <p className="text-sm text-muted-foreground mt-1">{L.currentPh}</p>
                          <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                            phLevel >= 6.0 && phLevel <= 7.5
                              ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
                          }`}>
                            {phLevel >= 6.0 && phLevel <= 7.5 ? "Optimal Range" : phLevel < 6.0 ? "Too Acidic" : "Too Alkaline"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Soil Moisture */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle>{L.moistureTitle}</CardTitle>
                      <CardDescription>{L.moistureDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="relative w-full h-12 bg-muted rounded-lg overflow-hidden border-2 border-border">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 transition-all"
                            style={{ width: `${Math.min(100, moistureLevel)}%` }}
                          />
                          <p className="absolute inset-0 flex items-center justify-center font-bold text-foreground">
                            {moistureLevel.toFixed(1)}%
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {moistureLevel > 60 ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <p className="text-sm text-green-600 font-semibold">{L.optimalMoisture}</p>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                              <p className="text-sm text-yellow-600 font-semibold">{L.monitorClosely}</p>
                            </>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          <div className="text-center p-2 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">Clay</p>
                            <p className="font-bold text-sm">{soilData.soil_properties.clay_percent.toFixed(1)}%</p>
                          </div>
                          <div className="text-center p-2 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">Org. Carbon</p>
                            <p className="font-bold text-sm">{soilData.soil_properties.soil_organic_carbon_g_kg.toFixed(2)} g/kg</p>
                          </div>
                          <div className="text-center p-2 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">CEC</p>
                            <p className="font-bold text-sm">{soilData.soil_properties.cec_cmol_kg.toFixed(1)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Component Scores Chart */}
                <Card className="mb-6 bg-card border-border">
                  <CardHeader>
                    <CardTitle>{L.chartTitle}</CardTitle>
                    <CardDescription>Soil health component scores derived from real field data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={componentChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                        <YAxis stroke="var(--color-muted-foreground)" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "0.5rem",
                          }}
                          formatter={(v: number) => [`${v} / 100`, "Score"]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="var(--color-primary)"
                          strokeWidth={3}
                          dot={{ r: 6 }}
                          activeDot={{ r: 8 }}
                          name="Health Score"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>{L.aiRecsTitle}</CardTitle>
                    <CardDescription>{L.aiRecsDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiRecommendations.map((rec, idx) => (
                        <div key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-foreground">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
