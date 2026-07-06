"use client"
import { useState, useEffect, useCallback } from "react"
import SidebarNav from "@/components/sidebar-nav"
import Header from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { TrendingUp, TrendingDown, CheckCircle2, BrainCircuit, Loader2, Sparkles, RefreshCw } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { fetchForecast, fetchCommodities } from "@/lib/api"

interface CropPrice {
  id: string
  name: string
  unit: string
  currentPrice: number
  dailyChange: number
  trend: "up" | "down" | "stable"
  marketRegion: string
}

interface ForecastPoint {
  commodity: string
  year: number
  quarter: number
  price: number
  label: string
}

// Quarter label helper
const quarterLabel = (year: number, quarter: number) => `Q${quarter} ${year}`

export default function MarketPricesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedRegion, setSelectedRegion] = useState("cairo")
  const { t, language } = useLanguage()
  const L = t.marketPrices

  const translateCommodity = (commodity: string) => {
    const isAr = language === 'ar'
    if (!commodity) return isAr ? 'غير محدد' : 'Unknown'
    const clean = commodity.trim().toLowerCase()
    if (clean === 'wheat') return isAr ? 'القمح' : 'Wheat'
    if (clean === 'rice') return isAr ? 'الأرز' : 'Rice'
    if (clean === 'tomato') return isAr ? 'الطماطم' : 'Tomato'
    if (clean === 'potato') return isAr ? 'البطاطس' : 'Potato'
    if (clean === 'maize' || clean === 'corn') return isAr ? 'الذرة الصفراء' : 'Maize'
    if (clean === 'mango') return isAr ? 'المانجو' : 'Mango'
    if (clean === 'green fodder') return isAr ? 'الأعلاف الخضراء' : 'Green Fodder'
    if (clean === 'jowar (sorghum)' || clean === 'jowar' || clean === 'sorghum') return isAr ? 'الذرة الرفيعة' : 'Jowar (Sorghum)'
    return commodity.charAt(0).toUpperCase() + commodity.slice(1)
  }

  const translateQuarter = (label: string) => {
    if (language !== 'ar') return label
    return label.replace('Q', 'الربع ').replace(' ', ' لعام ')
  }

  // ── AI Forecast State ────────────────────────────────────────────────────────
  const [commodities, setCommodities] = useState<string[]>([])
  const [selectedCommodity, setSelectedCommodity] = useState("Wheat")
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([])
  const [forecastLoading, setForecastLoading] = useState(false)
  const [forecastError, setForecastError] = useState<string | null>(null)
  const [forecastFetched, setForecastFetched] = useState(false)

  // Load commodity list once
  useEffect(() => {
    fetchCommodities().then((list) => {
      if (list.length > 0) setCommodities(list)
    })
  }, [])

  const runForecast = useCallback(async () => {
    setForecastLoading(true)
    setForecastError(null)
    try {
      const raw = await fetchForecast(selectedCommodity)
      const formatted: ForecastPoint[] = raw.map((p) => ({
        ...p,
        label: quarterLabel(p.year, p.quarter),
      }))
      setForecastData(formatted)
      setForecastFetched(true)
    } catch (e: any) {
      setForecastError(e.message ?? "Failed to load forecast")
    } finally {
      setForecastLoading(false)
    }
  }, [selectedCommodity])

  const categories = [
    { id: "all",        label: L.categories.all },
    { id: "grains",     label: L.categories.grains },
    { id: "fruits",     label: L.categories.fruits },
    { id: "vegetables", label: L.categories.vegetables },
  ]

  const regions = [
    { id: "cairo",   label: L.regions.cairo },
    { id: "giza",    label: L.regions.giza },
    { id: "assiut",  label: L.regions.assiut },
    { id: "sharqia", label: L.regions.sharqia },
  ]

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background text-foreground">
      <SidebarNav isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">{L.title}</h1>
              <p className="text-muted-foreground">{L.subtitle}</p>
            </div>

            {/* ── AI FORECAST CARD ──────────────────────────────────────────── */}
            <Card className="mb-8 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <BrainCircuit className="w-5 h-5" />
                  {language === 'ar' ? 'توقع الأسعار بالذكاء الاصطناعي' : 'AI Price Forecast'}
                  <Badge className="ms-2 bg-primary/20 text-primary border-primary/30 text-xs font-semibold">
                    {language === 'ar' ? 'مشغل بواسطة LightGBM · HF Space' : 'Powered by LightGBM · HF Space'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'توقعات الأسعار للفصول الأربعة القادمة للسلع الزراعية المصرية' : '4-quarter ahead price predictions for Egyptian agricultural commodities'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Controls */}
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1 text-foreground">
                    <label className="text-xs text-muted-foreground font-medium">{language === 'ar' ? 'السلعة' : 'Commodity'}</label>
                    <select
                      value={selectedCommodity}
                      onChange={(e) => { setSelectedCommodity(e.target.value); setForecastFetched(false) }}
                      className="bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary block w-full text-foreground"
                    >
                      {(commodities.length > 0 ? commodities : ["Wheat","Rice","Tomato","Potato","Maize","Mango"]).map((c) => (
                        <option key={c} value={c} className="text-foreground">{translateCommodity(c)}</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={runForecast}
                    disabled={forecastLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    {forecastLoading
                      ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> {language === 'ar' ? 'جارٍ التوقع...' : 'Forecasting…'}</>
                      : forecastFetched
                        ? <><RefreshCw className="w-4 h-4 me-2" /> {language === 'ar' ? 'تحديث' : 'Refresh'}</>
                        : <><Sparkles className="w-4 h-4 me-2" /> {language === 'ar' ? 'طلب التوقع بالذكاء الاصطناعي' : 'Get AI Forecast'}</>
                    }
                  </Button>
                </div>

                {forecastError && (
                  <p className="text-sm text-destructive">{forecastError}</p>
                )}

                {forecastFetched && forecastData.length > 0 && (
                  <div className="space-y-4">
                    {/* Forecast Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {forecastData.map((p) => (
                        <div
                          key={p.label}
                          className="bg-background/60 border border-border rounded-xl p-3 text-center"
                        >
                          <p className="text-xs text-muted-foreground mb-1">{translateQuarter(p.label)}</p>
                          <p className="text-xl font-bold text-primary">
                            {p.price.toLocaleString(language === 'ar' ? "ar-EG" : "en-EG", { maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-xs text-muted-foreground">{language === 'ar' ? 'جنيه مصري / طن' : 'EGP/Ton'}</p>
                        </div>
                      ))}
                    </div>

                    {/* Forecast Bar Chart */}
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={forecastData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="label" stroke="var(--color-muted-foreground)" tick={{ fontSize: 12 }} tickFormatter={(label) => translateQuarter(label)} />
                        <YAxis
                          stroke="var(--color-muted-foreground)"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "0.5rem",
                          }}
                          formatter={(v: number) => [`${v.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG')} ${language === 'ar' ? 'جنيه/طن' : 'EGP/Ton'}`, language === 'ar' ? 'السعر المتوقع' : "Forecast Price"]}
                        />
                        <Bar dataKey="price" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name={language === 'ar' ? 'السعر المتوقع' : "Forecast Price"} />
                      </BarChart>
                    </ResponsiveContainer>

                    <p className="text-xs text-muted-foreground text-center">
                      {language === 'ar'
                        ? '📊 المصدر: واجهة توقعات أسعار السلع FarmTech · نموذج LightGBM المدرب على بيانات السوق المصرية'
                        : '📊 Source: FarmTech Commodity Forecast API · LightGBM model trained on Egyptian market data'}
                    </p>
                  </div>
                )}

                {!forecastFetched && !forecastLoading && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    {language === 'ar'
                      ? 'اختر سلعة واضغط على «طلب التوقع بالذكاء الاصطناعي» لعرض تنبؤات الأسعار للفصول الأربعة القادمة.'
                      : 'Select a commodity and click Get AI Forecast to view 4-quarter price predictions.'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{L.cropCategory}</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-lg transition-all font-medium text-sm ${
                        selectedCategory === cat.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{L.marketRegion}</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {regions.map((reg) => (
                    <option key={reg.id} value={reg.id}>{reg.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Best Time to Sell */}
            <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                      {L.bestTimeTitle}
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-400"
                       dangerouslySetInnerHTML={{ __html: L.bestTimeDesc }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Table – populated from AI Forecast data */}
            <Card className="mb-8 bg-card border-border">
              <CardHeader>
                <CardTitle>{L.priceTableTitle}</CardTitle>
                <CardDescription>
                  {forecastFetched
                    ? (language === 'ar'
                        ? `عرض أسعار التنبؤ بالذكاء الاصطناعي لـ ${translateCommodity(selectedCommodity)} · ${regions.find((r) => r.id === selectedRegion)?.label}`
                        : `Showing AI forecast prices for ${translateCommodity(selectedCommodity)} · ${regions.find((r) => r.id === selectedRegion)?.label}`)
                    : `${L.priceTableDesc} ${regions.find((r) => r.id === selectedRegion)?.label}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {forecastFetched && forecastData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-start py-3 px-4 font-semibold text-foreground">{language === 'ar' ? 'الربع' : 'Quarter'}</th>
                          <th className="text-start py-3 px-4 font-semibold text-foreground">{language === 'ar' ? 'السنة' : 'Year'}</th>
                          <th className="text-start py-3 px-4 font-semibold text-foreground">{language === 'ar' ? 'السعر المتوقع' : 'Forecast Price'}</th>
                          <th className="text-end py-3 px-4 font-semibold text-foreground">{L.thTrend}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forecastData.map((row, idx) => {
                          const prev = idx > 0 ? forecastData[idx - 1].price : row.price
                          const change = row.price - prev
                          return (
                            <tr key={row.label} className="border-b border-border hover:bg-muted/50 transition-colors">
                              <td className="py-4 px-4 font-medium text-foreground">{language === 'ar' ? `الربع ${row.quarter}` : `Q${row.quarter}`}</td>
                              <td className="py-4 px-4 text-muted-foreground">{row.year}</td>
                              <td className="py-4 px-4">
                                <span className="text-lg font-bold text-foreground">
                                  {row.price.toLocaleString(language === 'ar' ? "ar-EG" : "en-EG", { maximumFractionDigits: 0 })} {language === 'ar' ? 'جنيه مصري / طن' : 'EGP/Ton'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-end">
                                {idx === 0 ? (
                                  <Badge className="bg-blue-600 text-white">{L.trendStable}</Badge>
                                ) : change > 0 ? (
                                  <Badge className="bg-green-600 text-white flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />{L.trendRising}
                                  </Badge>
                                ) : change < 0 ? (
                                  <Badge className="bg-red-600 text-white flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />{L.trendFalling}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-600 text-white">{L.trendStable}</Badge>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <svg className="w-14 h-14 mx-auto mb-4 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
                    </svg>
                    <p className="font-semibold text-foreground mb-1">{language === 'ar' ? 'لا توجد بيانات أسعار بعد' : 'No price data yet'}</p>
                    <p className="text-sm">{language === 'ar' ? 'استخدم أداة توقع الأسعار بالذكاء الاصطناعي أعلاه لتحميل أسعار السلع.' : 'Use the AI Price Forecast above to load commodity prices.'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Forecast Trend Chart – uses real API data */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>{L.chartTitle}</CardTitle>
                <CardDescription>
                  {forecastFetched
                    ? (language === 'ar' ? `مخطط توقعات الأسعار لـ ${translateCommodity(selectedCommodity)} للفصول الأربعة القادمة` : `4-quarter AI forecast trend for ${translateCommodity(selectedCommodity)}`)
                    : L.chartDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {forecastFetched && forecastData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="label" stroke="var(--color-muted-foreground)" tickFormatter={(label) => translateQuarter(label)} />
                      <YAxis
                        stroke="var(--color-muted-foreground)"
                        tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "0.5rem" }}
                        formatter={(v: number) => [`${v.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG')} ${language === 'ar' ? 'جنيه/طن' : 'EGP/Ton'}`, language === 'ar' ? 'السعر المتوقع' : "Forecast"]}
                      />
                      <Legend formatter={(value) => language === 'ar' ? 'سعر التوقع' : value} />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="var(--color-chart-1)"
                        strokeWidth={3}
                        dot={{ r: 6 }}
                        activeDot={{ r: 8 }}
                        name={language === 'ar' ? `سعر ${translateCommodity(selectedCommodity)}` : `${translateCommodity(selectedCommodity)} Price`}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                    <svg className="w-16 h-16 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
                    </svg>
                    <p className="text-sm">{language === 'ar' ? 'اختر سلعة واضغط على «طلب التوقع بالذكاء الاصطناعي» لعرض مخطط اتجاه الأسعار.' : 'Select a commodity and click Get AI Forecast to see the price trend chart.'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
