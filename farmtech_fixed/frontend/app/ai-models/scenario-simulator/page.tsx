"use client"

import { useState, useEffect } from "react"
import SidebarNav from "@/components/sidebar-nav"
import Header from "@/components/header"
import { Brain, Leaf, ArrowRight, Activity, AlertCircle, Coins, Droplet, FlaskConical, LayoutGrid, RotateCcw } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent } from "@/components/ui/card"
import { pushNotification, pushFarmHistory } from "@/lib/utils"

type AppState = 'INITIAL' | 'LOADING_FARMS' | 'RUNNING' | 'RESULT' | 'ERROR'

interface SequenceItem {
  "Season": number
  "Recommended Crop": string
  "Est. Profit (EGP)": string | number
  "Water (mm)": string | number
  "Fertilizer (kg)": string | number
}

interface RotationResult {
  recommended_crop: string
  sequence: SequenceItem[]
  summary: Record<string, string | number>
}

export default function CropRotationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [appState, setAppState] = useState<AppState>('LOADING_FARMS')
  const [farmIds, setFarmIds] = useState<string[]>([])
  const [selectedFarmId, setSelectedFarmId] = useState<string>('')
  const [rotationResult, setRotationResult] = useState<RotationResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { t, dir, language } = useLanguage()
  const isAr = language === 'ar'

  const API_BASE = "https://y-s-r-rotation.hf.space"

  const translateCrop = (crop: string) => {
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
    if (clean === 'berseem' || clean === 'clover') return isAr ? 'البرسيم' : 'Berseem/Clover'
    if (clean === 'fallow') return isAr ? 'أرض بور (راحة)' : 'Fallow'
    return crop.charAt(0).toUpperCase() + crop.slice(1)
  }

  const translateMetricKey = (key: string) => {
    if (!isAr) return key
    const k = key.trim().toLowerCase()
    if (k.includes('net profit') || k.includes('profit')) return 'صافي الربح الإجمالي (جنيه)'
    if (k.includes('water')) return 'إجمالي المياه المستخدمة (مم)'
    if (k.includes('fertilizer')) return 'إجمالي الأسمدة (كجم)'
    if (k.includes('soil health') || k.includes('soc')) return 'مؤشر صحة التربة (SOC)'
    if (k.includes('nitrogen') || k.includes(' n ')) return 'مستوى النيتروجين في التربة'
    if (k.includes('phosphorus') || k.includes(' p ')) return 'مستوى الفوسفور في التربة'
    if (k.includes('potassium') || k.includes(' k ')) return 'مستوى البوتاسيوم في التربة'
    return key
  }

  // Load Farm IDs on Init
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        setAppState('LOADING_FARMS')
        const res = await fetch(`${API_BASE}/farm_ids`)
        if (!res.ok) throw new Error("Failed to load sample farms from the API")
        const data = await res.json()
        if (data && Array.isArray(data.farm_ids)) {
          setFarmIds(data.farm_ids.map(String))
          if (data.farm_ids.length > 0) {
            setSelectedFarmId(String(data.farm_ids[0]))
          }
          setAppState('INITIAL')
        } else {
          throw new Error("Invalid farm IDs format received from API")
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Connection to API failed")
        setAppState('ERROR')
      }
    }
    fetchFarms()
  }, [])

  const handleRunPolicy = async () => {
    if (!selectedFarmId) return
    setAppState('RUNNING')
    setErrorMsg(null)

    try {
      const res = await fetch(`${API_BASE}/predict?farm_id=${selectedFarmId}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || `Server returned error status ${res.status}`)
      }
      const data: RotationResult = await res.json()
      setRotationResult(data)
      setAppState('RESULT')

      // Push Notification and History log
      pushNotification(
        "task",
        isAr ? "تحليل تعاقب المحاصيل مكتمل" : "Crop Rotation Sequence Computed",
        isAr 
          ? `تم حساب تعاقب المحاصيل للمزرعة رقم ${selectedFarmId} بنجاح. المحصول الموصى به للموسم القادم هو: ${translateCrop(data.recommended_crop)}.`
          : `Computed optimal crop rotation policy for Farm ${selectedFarmId}. Recommended next crop: ${data.recommended_crop}.`
      )

      pushFarmHistory(
        "prediction",
        isAr ? "محاكاة تعاقب المحاصيل (RL)" : "RL Crop Rotation Simulation",
        isAr
          ? `تم حساب خطة تعاقب المحاصيل للمزرعة ${selectedFarmId} عبر نموذج التعلم التعزيزي.`
          : `Generated RL crop rotation sequence plan for Farm ${selectedFarmId}.`
      )
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to compute rotation policy")
      setAppState('ERROR')
    }
  }

  return (
    <div dir={dir} className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background text-foreground">
      <SidebarNav isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 relative">
          {/* Background Ambience */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100/50 via-slate-50 to-slate-50 dark:from-purple-900/20 dark:via-slate-950 dark:to-slate-950 pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-6 py-8 md:py-12 z-10">
            {/* Header section */}
            <div className="mb-10 text-center md:text-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-4 tracking-wide uppercase">
                <Brain className="w-4 h-4 animate-pulse" />
                <span>{isAr ? "عميل تعلم تعزيزي ذكي" : "Reinforcement Learning Agent"}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
                {isAr ? "تعاقب المحاصيل (الدورة الزراعية)" : "Crop Rotation Sequence"}
              </h1>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                {isAr 
                  ? "يستخدم هذا النموذج التجريبي عميلاً ذكياً مدرباً بالتعلم التعزيزي (Reinforcement Learning) لاقتراح تعاقب المحاصيل الأمثل، مما يضمن التوازن المثالي بين تحقيق أعلى أرباح اقتصادية والحفاظ على صحة وخصوبة التربة على المدى الطويل."
                  : "This prototype uses a calibrated Reinforcement Learning agent to recommend optimal crop rotation sequences, balancing economic profit with long-term soil health."
                }
              </p>
            </div>

            {/* Farm Selector Card */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden mb-8">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  <div className="flex-1">
                    <label htmlFor="farm-select" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      {isAr ? "اختر مزرعة نموذجية للتحليل" : "Select a Sample Farm for Analysis"}
                    </label>
                    <select
                      id="farm-select"
                      value={selectedFarmId}
                      onChange={(e) => {
                        setSelectedFarmId(e.target.value)
                        if (appState === 'RESULT' || appState === 'ERROR') {
                          setAppState('INITIAL')
                        }
                      }}
                      disabled={appState === 'LOADING_FARMS' || appState === 'RUNNING'}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {appState === 'LOADING_FARMS' ? (
                        <option value="">{isAr ? "— جاري تحميل المزارع النموذجية... —" : "— Loading sample farms... —"}</option>
                      ) : (
                        <>
                          <option value="" disabled>{isAr ? "— اختر مزرعة —" : "— Choose a farm —"}</option>
                          {farmIds.map(id => (
                            <option key={id} value={id}>
                              {isAr ? `المزرعة النموذجية #${id}` : `Sample Farm #${id}`}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  <button
                    onClick={handleRunPolicy}
                    disabled={appState === 'LOADING_FARMS' || appState === 'RUNNING' || !selectedFarmId}
                    className="h-12 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-500/30 text-white font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap min-w-[200px]"
                  >
                    {appState === 'RUNNING' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{isAr ? "جاري محاكاة السياسة..." : "Simulating Policy..."}</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-5 h-5" />
                        <span>{isAr ? "شغل سياسة الدورة الزراعية" : "Run Rotation Policy"}</span>
                      </>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Error Box */}
            {appState === 'ERROR' && errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-6 rounded-2xl text-sm font-medium flex items-start gap-4 mb-8">
                <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-500" />
                <div>
                  <h4 className="font-bold text-base mb-1">{isAr ? "فشل تحليل تعاقب المحاصيل" : "Sequence analysis failed"}</h4>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Results Section */}
            {appState === 'RESULT' && rotationResult && (
              <div className="space-y-8 animate-fade-in">
                {/* Result Hero - Recommended Next Crop */}
                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/10 border border-emerald-200 dark:border-emerald-900/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardContent className="p-8 text-center relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl" />
                    <div className="absolute left-0 bottom-0 -translate-x-12 translate-y-12 w-48 h-48 bg-green-500/5 rounded-full blur-2xl" />
                    
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800">
                      <Leaf className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                      {isAr ? "المحصول الموصى به للموسم القادم" : "Recommended Next Crop"}
                    </span>
                    <h2 className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">
                      {translateCrop(rotationResult.recommended_crop)}
                    </h2>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Multi-Season Rotation Plan Table */}
                  <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                          <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {isAr ? "خطة تعاقب المحاصيل متعددة المواسم" : "Multi-Season Rotation Plan"}
                        </h3>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px]">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                              <th className="py-3 px-4 text-start text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {isAr ? "الموسم" : "Season"}
                              </th>
                              <th className="py-3 px-4 text-start text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {isAr ? "المحصول الموصى به" : "Recommended Crop"}
                              </th>
                              <th className="py-3 px-4 text-start text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {isAr ? "الربح المتوقع (جنيه)" : "Est. Profit (EGP)"}
                              </th>
                              <th className="py-3 px-4 text-start text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {isAr ? "مياه الري (مم)" : "Water (mm)"}
                              </th>
                              <th className="py-3 px-4 text-start text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {isAr ? "السماد (كجم)" : "Fertilizer (kg)"}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {rotationResult.sequence.map((item, idx) => (
                              <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                                  {isAr ? `الموسم ${item.Season}` : `Season ${item.Season}`}
                                </td>
                                <td className="py-4 px-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                  {translateCrop(item["Recommended Crop"])}
                                </td>
                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-300 font-mono">
                                  {item["Est. Profit (EGP)"]}
                                </td>
                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-300 font-mono">
                                  {item["Water (mm)"]}
                                </td>
                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-300 font-mono">
                                  {item["Fertilizer (kg)"]}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Planning Summary Cards */}
                  <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          <LayoutGrid className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {isAr ? "ملخص نتائج التخطيط" : "Planning Summary"}
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        {Object.entries(rotationResult.summary).map(([key, val]) => {
                          const isProfit = key.toLowerCase().includes('profit')
                          const isWater = key.toLowerCase().includes('water')
                          const isFert = key.toLowerCase().includes('fertilizer')
                          
                          return (
                            <div key={key} className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {isProfit && <Coins className="w-5 h-5 text-amber-500" />}
                                {isWater && <Droplet className="w-5 h-5 text-blue-500" />}
                                {isFert && <FlaskConical className="w-5 h-5 text-teal-500" />}
                                {!isProfit && !isWater && !isFert && <Activity className="w-5 h-5 text-purple-500" />}
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
                                  {translateMetricKey(key)}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                                {val}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Empty state instruction when page loads */}
            {appState === 'INITIAL' && (
              <div className="text-center py-16 px-6 bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
                <Brain className="w-12 h-12 text-purple-400 dark:text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {isAr ? "جاهز لمحاكاة الدورة الزراعية" : "Ready for Rotation Simulation"}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  {isAr 
                    ? "اختر إحدى المزارع النموذجية من القائمة بالأعلى ثم اضغط على زر 'شغل سياسة الدورة الزراعية' لبدء التخطيط الذكي."
                    : "Select one of the sample farms from the dropdown above and click 'Run Rotation Policy' to trigger the reinforcement learning planning engine."
                  }
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-600">
              {isAr
                ? "مشروع التخرج فارم تك — نموذج بحثي تجريبي (حوالي 70% من النطاق الإنتاجي الفعلي)"
                : "FarmTec Graduation Project — Research Prototype (≈ 70% of production scope)"
              }
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
