"use client"

import { useState, useEffect } from "react"
import SidebarNav from "@/components/sidebar-nav"
import Header from "@/components/header"
import { 
  Brain, 
  MapPin, 
  Leaf, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Droplet, 
  Sun, 
  CloudRain, 
  ChevronRight,
  Sparkles
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { fetchScenarioSimulation, fetchFarms } from "@/lib/api"
import { pushNotification, pushFarmHistory } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type AppState = 'INITIAL' | 'SIMULATING' | 'RESULT' | 'ERROR'

interface SimulationResult {
  impact: string
  description: string
  ndvi_change: number
  moisture_change: number
  confidence: number
  scenario: string
  crop: string
  baseline: {
    avg_ndvi: number
    avg_moisture: number
    avg_precip: number
    avg_temp: number
  }
}

const localTranslations = {
  en: {
    title: "Crop Scenario Simulator",
    subtitle: "Predict the regional and agricultural impact of management choices on your fields",
    initializing: "Connecting to simulation engine...",
    gettingLocation: "Retrieving coordinates...",
    submitting: "Simulating farm actions...",
    processing: "Running prediction models...",
    systemOnline: "AI Simulation Engine Online",
    selectFarm: "Select Farm for Context",
    selectCrop: "Select Crop Type",
    selectScenario: "Select Simulation Scenario",
    runSimulation: "Run Simulation",
    simulating: "Simulating...",
    resultsTitle: "Simulation Results",
    overallImpact: "Overall Impact",
    confidence: "Confidence Level",
    ndviChange: "NDVI Change",
    moistureChange: "Soil Moisture Change",
    baselineStats: "Baseline Statistics (Nearest Region)",
    avgNdvi: "Avg. NDVI",
    avgMoisture: "Avg. Soil Moisture",
    avgPrecip: "Avg. Precipitation",
    avgTemp: "Avg. Temperature",
    scenarios: {
      increase_irrigation: "Increase Irrigation",
      reduce_irrigation: "Reduce Irrigation",
      add_fertilizer: "Add Fertilizer",
      change_crop: "Change Crop / Rotation",
    },
    crops: {
      wheat: "Wheat",
      corn: "Corn",
      rice: "Rice",
      barley: "Barley",
      soybeans: "Soybeans",
      cotton: "Cotton",
      sugarcane: "Sugarcane",
    },
    errLocation: "Failed to retrieve GPS location.",
    errSimulate: "Simulation failed. Please try again.",
    backToModels: "Back to AI Models",
    runNew: "Run New Scenario",
    gpsLocation: "Current GPS Location",
    farmSelected: "Farm Location Selected",
    impactImpact: "Projected Impact",
    summaryTitle: "Agronomist Assessment",
    whatThisMeans: "What This Means",
    metricInfo: "Projected changes relative to the baseline metrics of nearby fields.",
    loadingDesc: "Processing simulation against closest regional datasets...",
  },
  ar: {
    title: "محاكاة سيناريو المحصول",
    subtitle: "توقع التأثير الزراعي والإقليمي لخيارات الإدارة على حقولك",
    initializing: "الاتصال بمحرك المحاكاة...",
    gettingLocation: "جاري تحديد إحداثيات الموقع الجغرافي...",
    submitting: "جاري محاكاة العمليات الزراعية...",
    processing: "جاري تشغيل نماذج التوقع بالذكاء الاصطناعي...",
    systemOnline: "محرك محاكاة الذكاء الاصطناعي متصل",
    selectFarm: "اختر المزرعة للسياق",
    selectCrop: "اختر نوع المحصول",
    selectScenario: "اختر سيناريو المحاكاة",
    runSimulation: "بدء المحاكاة",
    simulating: "جاري المحاكاة...",
    resultsTitle: "نتائج المحاكاة",
    overallImpact: "التأثير الإجمالي",
    confidence: "مستوى الثقة",
    ndviChange: "تغير NDVI (مؤشر الغطاء النباتي)",
    moistureChange: "تغير رطوبة التربة",
    baselineStats: "الإحصاءات الأساسية (المنطقة الأقرب)",
    avgNdvi: "متوسط NDVI",
    avgMoisture: "متوسط رطوبة التربة",
    avgPrecip: "متوسط هطول الأمطار",
    avgTemp: "متوسط درجة الحرارة",
    scenarios: {
      increase_irrigation: "زيادة الري",
      reduce_irrigation: "تقليل الري",
      add_fertilizer: "إضافة أسمدة",
      change_crop: "تغيير المحصول / الدورة الزراعية",
    },
    crops: {
      wheat: "القمح",
      corn: "الذرة",
      rice: "الأرز",
      barley: "الشعير",
      cotton: "القطن",
      soybeans: "فول الصويا",
      sugarcane: "قصب السكر",
    },
    errLocation: "فشل في الحصول على الموقع الجغرافي.",
    errSimulate: "فشلت عملية المحاكاة. يرجى المحاولة مرة أخرى.",
    backToModels: "العودة إلى نماذج الذكاء الاصطناعي",
    runNew: "محاكاة سيناريو جديد",
    gpsLocation: "الموقع الجغرافي الحالي",
    farmSelected: "تم اختيار موقع المزرعة",
    impactImpact: "التأثير المتوقع",
    summaryTitle: "تقييم خبير زراعي",
    whatThisMeans: "ماذا يعني ذلك",
    metricInfo: "التغييرات المتوقعة مقارنة بالمعايير الأساسية للحقول المجاورة.",
    loadingDesc: "معالجة المحاكاة مقابل أقرب مجموعات البيانات الإقليمية...",
  }
}

const impactDetails: Record<string, { en: string; ar: string; color: string; iconColor: string }> = {
  positive: { en: "Positive", ar: "إيجابي", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", iconColor: "text-emerald-400" },
  negative: { en: "Negative", ar: "سلبي", color: "bg-red-500/10 text-red-400 border-red-500/20", iconColor: "text-red-400" },
  moderate: { en: "Moderate", ar: "معتدل", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", iconColor: "text-amber-400" },
  variable: { en: "Variable", ar: "متغير", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", iconColor: "text-blue-400" },
}

export default function ScenarioSimulatorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [appState, setAppState] = useState<AppState>('INITIAL')
  
  const { language, dir } = useLanguage()
  const isAr = language === 'ar'
  const L = isAr ? localTranslations.ar : localTranslations.en

  const [statusMessage, setStatusMessage] = useState(L.initializing)
  const [apiResult, setApiResult] = useState<SimulationResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [farms, setFarms] = useState<any[]>([])
  const [selectedFarmId, setSelectedFarmId] = useState<string>('')
  
  // Selection States
  const [selectedCrop, setSelectedCrop] = useState<string>('wheat')
  const [selectedScenario, setSelectedScenario] = useState<string>('increase_irrigation')

  useEffect(() => {
    fetchFarms().then(res => {
      setFarms(res)
      if (res.length > 0) setSelectedFarmId(String(res[0].id))
    }).catch(console.error)
  }, [])

  // Cycle status messages during simulation
  useEffect(() => {
    let t1: NodeJS.Timeout
    let t2: NodeJS.Timeout
    if (appState === 'SIMULATING') {
      setStatusMessage(L.gettingLocation)
      t1 = setTimeout(() => setStatusMessage(L.submitting), 1500)
      t2 = setTimeout(() => setStatusMessage(L.processing), 3500)
    }
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [appState, L])

  const handleSimulate = async () => {
    setAppState('SIMULATING')
    setErrorMsg(null)
    
    try {
      let lat = 30.0444
      let lon = 31.2357
      
      if (selectedFarmId) {
        const selectedFarm = farms.find(f => String(f.id) === selectedFarmId)
        if (selectedFarm) {
          lat = Number(selectedFarm.latitude) || lat
          lon = Number(selectedFarm.longitude) || lon
        }
      } else {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error(L.errLocation))
          } else {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
          }
        }).catch(err => {
          console.warn("Location error:", err)
          return null 
        })
        if (position) {
          lat = position.coords.latitude
          lon = position.coords.longitude
        }
      }

      const payload = {
        lat,
        lon,
        crop: selectedCrop,
        scenario: selectedScenario,
      }

      const data = await fetchScenarioSimulation(payload)
      
      setApiResult(data)
      setAppState('RESULT')

      // Push real notification and farm history
      const cropText = L.crops[selectedCrop as keyof typeof L.crops] || selectedCrop
      const scenarioText = L.scenarios[selectedScenario as keyof typeof L.scenarios] || selectedScenario
      
      pushNotification(
        "task",
        isAr ? "اكتملت محاكاة المحصول" : "Crop Simulation Completed",
        isAr
          ? `تم تشغيل محاكاة لـ (${scenarioText}) لمحصول (${cropText}) بنجاح.`
          : `Simulation of (${scenarioText}) for (${cropText}) completed successfully.`
      )

      pushFarmHistory(
        "prediction",
        isAr ? "محاكاة سيناريو محصول" : "Crop Scenario Simulation",
        isAr
          ? `المحاكاة لـ ${scenarioText} تنبأت بتأثير: ${data.impact}.`
          : `Simulation for ${scenarioText} predicted impact: ${data.impact}.`,
        selectedFarmId ? Number(selectedFarmId) : undefined
      )

    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || L.errSimulate)
      setAppState('ERROR')
    }
  }

  // Helper to format impact details
  const getImpactData = (impact: string) => {
    const key = (impact || "positive").toLowerCase()
    return impactDetails[key] || impactDetails.positive
  }

  return (
    <div dir={dir} className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background text-foreground">
      <SidebarNav isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
                  <Brain className="w-8 h-8 text-purple-400" />
                  {L.title}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">{L.subtitle}</p>
              </div>
              <Badge variant="outline" className="w-fit border-purple-500/30 bg-purple-500/10 text-purple-300 gap-1.5 py-1 px-3">
                <Sparkles className="w-3.5 h-3.5" />
                {L.systemOnline}
              </Badge>
            </div>

            {/* INITIAL / INPUT STATE */}
            {appState === 'INITIAL' && (
              <Card className="bg-[#0b2b1a] border-emerald-800/40 shadow-xl text-white">
                <CardHeader>
                  <CardTitle className="text-lg text-emerald-300 font-semibold">{L.selectFarm}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Select Farm */}
                  <div>
                    <label className="block text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mb-2">
                      {L.selectFarm}
                    </label>
                    <select
                      value={selectedFarmId}
                      onChange={(e) => setSelectedFarmId(e.target.value)}
                      className="w-full bg-[#071f13] border border-emerald-800/60 rounded-lg h-11 px-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="">-- {isAr ? "استخدام الموقع الحالي بالهاتف (GPS)" : "Use Mobile GPS Location"} --</option>
                      {farms.map((farm) => (
                        <option key={farm.id} value={farm.id}>
                          {farm.name} ({farm.latitude}, {farm.longitude})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Select Crop */}
                    <div>
                      <label className="block text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mb-2">
                        {L.selectCrop}
                      </label>
                      <select
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        className="w-full bg-[#071f13] border border-emerald-800/60 rounded-lg h-11 px-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        {Object.entries(L.crops).map(([key, name]) => (
                          <option key={key} value={key}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Select Scenario */}
                    <div>
                      <label className="block text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mb-2">
                        {L.selectScenario}
                      </label>
                      <select
                        value={selectedScenario}
                        onChange={(e) => setSelectedScenario(e.target.value)}
                        className="w-full bg-[#071f13] border border-emerald-800/60 rounded-lg h-11 px-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        {Object.entries(L.scenarios).map(([key, name]) => (
                          <option key={key} value={key}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Simulate Button */}
                  <Button
                    onClick={handleSimulate}
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-purple-500/20"
                  >
                    {L.runSimulation}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* SIMULATING / LOADING STATE */}
            {appState === 'SIMULATING' && (
              <Card className="bg-[#0b2b1a] border-emerald-800/40 shadow-xl py-12 flex flex-col items-center text-center text-white">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                  <Brain className="w-8 h-8 text-purple-400 absolute top-4 left-4 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{statusMessage}</h3>
                <p className="text-emerald-400/80 text-sm max-w-md px-4">{L.loadingDesc}</p>
              </Card>
            )}

            {/* ERROR STATE */}
            {appState === 'ERROR' && (
              <Card className="bg-[#0b2b1a] border-red-900/40 shadow-xl p-8 text-center text-white">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
                <h3 className="text-xl font-bold text-white mb-2">{L.errSimulate}</h3>
                <p className="text-red-300 text-sm mb-6">{errorMsg}</p>
                <Button
                  onClick={() => setAppState('INITIAL')}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  {L.runNew}
                </Button>
              </Card>
            )}

            {/* RESULT STATE */}
            {appState === 'RESULT' && apiResult && (
              <div className="space-y-6">
                {/* Result Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Assessment */}
                  <Card className="bg-[#0b2b1a] border-emerald-800/40 shadow-xl text-white">
                    <CardHeader className="border-b border-emerald-800/30 pb-4">
                      <CardTitle className="text-emerald-300 font-bold text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-400" />
                        {L.summaryTitle}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      {/* Scenario Summary */}
                      <div className="flex justify-between items-center bg-[#071f13] border border-emerald-850 p-4 rounded-lg">
                        <div>
                          <p className="text-xs text-emerald-400/70">{isAr ? "السيناريو المشغل" : "Scenario Executed"}</p>
                          <h4 className="font-bold text-white mt-0.5">
                            {L.scenarios[apiResult.scenario as keyof typeof L.scenarios] || apiResult.scenario}
                          </h4>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-emerald-400/70">{isAr ? "المحصول" : "Crop"}</p>
                          <h4 className="font-bold text-white mt-0.5">
                            {L.crops[apiResult.crop as keyof typeof L.crops] || apiResult.crop}
                          </h4>
                        </div>
                      </div>

                      {/* Overall Impact */}
                      <div className="space-y-2">
                        <label className="text-xs text-emerald-400/80 font-semibold uppercase tracking-wider block">
                          {L.overallImpact}
                        </label>
                        <div className="flex items-center justify-between">
                          <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getImpactData(apiResult.impact).color}`}>
                            {isAr ? getImpactData(apiResult.impact).ar : getImpactData(apiResult.impact).en}
                          </span>
                          <span className="text-sm text-emerald-300 font-semibold">
                            {L.confidence}: <strong className="text-white text-base">{Math.round(apiResult.confidence * 100)}%</strong>
                          </span>
                        </div>
                      </div>

                      {/* Agronomist Advice Text */}
                      <div className="bg-purple-950/20 border border-purple-500/20 rounded-lg p-4">
                        <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5 mb-2">
                          <Sparkles className="w-3.5 h-3.5" />
                          {L.whatThisMeans}
                        </h4>
                        <p className="text-sm text-purple-200/90 leading-relaxed">
                          {apiResult.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Right Column: Metric Changes */}
                  <Card className="bg-[#0b2b1a] border-emerald-800/40 shadow-xl text-white">
                    <CardHeader className="border-b border-emerald-800/30 pb-4">
                      <CardTitle className="text-emerald-300 font-bold text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                        {L.impactImpact}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <p className="text-xs text-emerald-400/70">{L.metricInfo}</p>
                      
                      {/* NDVI Change */}
                      <div className="bg-[#071f13] border border-emerald-850 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{L.ndviChange}</h4>
                            <p className="text-xs text-emerald-400/50">{isAr ? "مؤشّر صحة الغطاء النباتي" : "Vegetation cover health score"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xl font-black ${apiResult.ndvi_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {apiResult.ndvi_change >= 0 ? '+' : ''}{apiResult.ndvi_change}
                          </span>
                        </div>
                      </div>

                      {/* Soil Moisture Change */}
                      <div className="bg-[#071f13] border border-emerald-850 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Droplet className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{L.moistureChange}</h4>
                            <p className="text-xs text-emerald-400/50">{isAr ? "نسبة المحتوى المائي" : "Water content percentage"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xl font-black ${apiResult.moisture_change >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {apiResult.moisture_change >= 0 ? '+' : ''}{apiResult.moisture_change}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Regional Baseline Metrics */}
                <Card className="bg-[#0b2b1a] border-emerald-800/40 shadow-xl text-white">
                  <CardHeader className="border-b border-emerald-800/30 pb-4">
                    <CardTitle className="text-emerald-300 font-bold text-lg">
                      {L.baselineStats}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Baseline NDVI */}
                      <div className="bg-[#071f13] border border-emerald-850/60 p-4 rounded-lg text-center">
                        <p className="text-xs text-emerald-400/60 mb-1">{L.avgNdvi}</p>
                        <h4 className="text-lg font-black text-white">{apiResult.baseline.avg_ndvi}</h4>
                      </div>

                      {/* Baseline Moisture */}
                      <div className="bg-[#071f13] border border-emerald-850/60 p-4 rounded-lg text-center">
                        <p className="text-xs text-emerald-400/60 mb-1">{L.avgMoisture}</p>
                        <h4 className="text-lg font-black text-white">{apiResult.baseline.avg_moisture}%</h4>
                      </div>

                      {/* Baseline Precipitation */}
                      <div className="bg-[#071f13] border border-emerald-850/60 p-4 rounded-lg text-center">
                        <p className="text-xs text-emerald-400/60 mb-1">{L.avgPrecip}</p>
                        <h4 className="text-lg font-black text-white">{apiResult.baseline.avg_precip} mm</h4>
                      </div>

                      {/* Baseline Temperature */}
                      <div className="bg-[#071f13] border border-emerald-850/60 p-4 rounded-lg text-center">
                        <p className="text-xs text-emerald-400/60 mb-1">{L.avgTemp}</p>
                        <h4 className="text-lg font-black text-white">{apiResult.baseline.avg_temp}°C</h4>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reset Buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={() => setAppState('INITIAL')}
                    className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all"
                  >
                    {L.runNew}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
