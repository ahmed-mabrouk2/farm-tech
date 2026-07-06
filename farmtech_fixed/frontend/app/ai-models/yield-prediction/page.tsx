'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/header'
import SidebarNav from '@/components/sidebar-nav'
import { useLanguage } from "@/lib/language-context"
import { fetchYieldPrediction } from "@/lib/api"
import { pushNotification, pushFarmHistory } from '@/lib/utils'

export default function YieldPredictionPage() {
  const [formData, setFormData] = useState({
    cropType: 'wheat',
    lat: 30.0,
    lon: 31.0,
    year: 2026,
    soilType: 'loamy',
    waterIntake: 600,
    fertilizer: 150,
    temperature: 25,
    humidity: 65,
  })

  const { t, dir, language } = useLanguage()
  const L = t.yieldPrediction

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

  // AI prediction state
  const [aiResult, setAiResult] = useState<{
    crop: string; yield_value: number; unit: string; source: string
  } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const predictions = {
    wheat: { low: 4.2, avg: 5.8, high: 7.2 },
    corn: { low: 6.1, avg: 8.5, high: 10.2 },
    rice: { low: 3.8, avg: 5.2, high: 6.9 },
    cotton: { low: 2.1, avg: 3.2, high: 4.5 },
    maize: { low: 5.5, avg: 7.8, high: 9.6 },
    potato: { low: 18.5, avg: 22.0, high: 26.5 },
    tomato: { low: 12.0, avg: 15.5, high: 19.0 },
  }

  const currentPrediction = predictions[formData.cropType as keyof typeof predictions] || { low: 3.0, avg: 5.0, high: 7.0 }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Reset AI result when inputs change
    setAiResult(null)
    setAiError(null)
  }

  const runAIPrediction = useCallback(async () => {
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await fetchYieldPrediction(
        formData.lat, formData.lon, formData.year, formData.cropType
      )
      setAiResult(result)

      const isAr = language === 'ar'
      const val = result.yield_value?.toFixed(2) || 0
      const unit = result.unit || 'tons/ha'

      pushNotification(
        "task",
        isAr ? "توقع إنتاجية جديد جاهز" : "Yield Prediction Completed",
        isAr
          ? `المحصول المتوقع: (${formData.cropType}) لعام ${formData.year}. الإنتاجية المقدرة: ${val} ${unit === 'tons/ha' ? 'طن/هكتار' : unit} (المصدر: ${result.source}).`
          : `Yield prediction for (${formData.cropType}) in ${formData.year} completed. Estimated yield: ${val} ${unit} (Source: ${result.source}).`
      )

      pushFarmHistory(
        "prediction",
        isAr ? "تحليل توقعات الإنتاجية" : "Yield Prediction Analysis",
        isAr
          ? `تم حساب الإنتاجية المتوقعة لـ (${formData.cropType}): ${val} ${unit === 'tons/ha' ? 'طن/هكتار' : unit}.`
          : `Calculated predicted yield for (${formData.cropType}): ${val} ${unit}.`
      )
    } catch (e: any) {
      setAiError(e.message ?? "Prediction failed")
    } finally {
      setAiLoading(false)
    }
  }, [formData.lat, formData.lon, formData.year, formData.cropType, language])

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
            {/* Input Form */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-foreground">{L.farmData}</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{L.cropType}</label>
                    <select 
                      value={formData.cropType}
                      onChange={(e) => handleChange('cropType', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="wheat">{L.crops.wheat}</option>
                      <option value="corn">{L.crops.corn}</option>
                      <option value="rice">{L.crops.rice}</option>
                      <option value="cotton">{L.crops.cotton}</option>
                      <option value="maize">{language === 'ar' ? 'الذرة الصفراء' : 'Maize'}</option>
                      <option value="potato">{language === 'ar' ? 'البطاطس' : 'Potato'}</option>
                      <option value="tomato">{language === 'ar' ? 'الطماطم' : 'Tomato'}</option>
                    </select>
                  </div>

                  {/* Lat / Lon */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{language === 'ar' ? 'خط العرض (Latitude)' : 'Latitude'}</label>
                      <input
                        type="number" step="0.1"
                        value={formData.lat}
                        onChange={(e) => handleChange('lat', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{language === 'ar' ? 'خط الطول (Longitude)' : 'Longitude'}</label>
                      <input
                        type="number" step="0.1"
                        value={formData.lon}
                        onChange={(e) => handleChange('lon', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      />
                    </div>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{language === 'ar' ? 'السنة' : 'Year'}</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleChange('year', parseInt(e.target.value) || 2026)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{L.soilType}</label>
                    <select 
                      value={formData.soilType}
                      onChange={(e) => handleChange('soilType', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="sandy">{L.soils.sandy}</option>
                      <option value="loamy">{L.soils.loamy}</option>
                      <option value="clay">{L.soils.clay}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{L.waterIntake}</label>
                    <input 
                      type="range" min="300" max="1000" 
                      value={formData.waterIntake}
                      onChange={(e) => handleChange('waterIntake', Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground mt-1">{formData.waterIntake} mm</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{L.fertilizer}</label>
                    <input 
                      type="range" min="50" max="300" 
                      value={formData.fertilizer}
                      onChange={(e) => handleChange('fertilizer', Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground mt-1">{formData.fertilizer} kg/ha</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{L.temperature}</label>
                    <input 
                      type="range" min="10" max="35" 
                      value={formData.temperature}
                      onChange={(e) => handleChange('temperature', Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground mt-1">{formData.temperature}°C</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{L.humidity}</label>
                    <input 
                      type="range" min="30" max="95" 
                      value={formData.humidity}
                      onChange={(e) => handleChange('humidity', Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground mt-1">{formData.humidity}%</span>
                  </div>

                  {/* AI Predict Button */}
                  <button
                    onClick={runAIPrediction}
                    disabled={aiLoading}
                    className="w-full mt-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold
                               hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {aiLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        {language === 'ar' ? 'جارٍ التنبؤ...' : 'Predicting…'}
                      </>
                    ) : (
                      <>{language === 'ar' ? 'توقع الإنتاجية بالذكاء الاصطناعي 🧠' : 'Predict Yield (AI) 🧠'}</>
                    )}
                  </button>

                  {aiError && (
                    <p className="text-sm text-destructive mt-1">{aiError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Predictions */}
            <div className="lg:col-span-2">
              {/* AI Result Card — shown when prediction is available */}
              {aiResult && (
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                      {language === 'ar' ? '🧠 تنبؤ الإنتاجية بالذكاء الاصطناعي' : '🧠 AI Yield Prediction'}
                    </h2>
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/30">
                      HF Space · Live
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-background/60 rounded-xl p-5 text-center border border-border text-foreground">
                      <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'المحصول' : 'Crop'}</p>
                      <p className="text-2xl font-bold capitalize">{translateCrop(aiResult.crop)}</p>
                    </div>
                    <div className="bg-background/60 rounded-xl p-5 text-center border border-primary/40 text-foreground">
                      <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الإنتاجية المتوقعة' : 'Predicted Yield'}</p>
                      <p className="text-4xl font-bold text-primary">{aiResult.yield_value}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {aiResult.unit === 'tons/ha' && language === 'ar' ? 'طن/هكتار' : aiResult.unit === 'Tonnes/Feddan' && language === 'ar' ? 'طن/فدان' : aiResult.unit}
                      </p>
                    </div>
                    <div className="bg-background/60 rounded-xl p-5 text-center border border-border text-foreground">
                      <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الموقع' : 'Location'}</p>
                      <p className="text-lg font-bold">{formData.lat}°, {formData.lon}°</p>
                      <p className="text-xs text-muted-foreground mt-1">{language === 'ar' ? 'السنة:' : 'Year:'} {formData.year}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    {language === 'ar'
                      ? '📊 المصدر: واجهة برمجة تطبيقات إنتاجية المحاصيل المتعددة FarmTec · youssef-d1aa-yieldpredict.hf.space'
                      : '📊 Source: FarmTec Multi-Crop Yield API · youssef-d1aa-yieldpredict.hf.space'}
                  </p>
                </div>
              )}

              {/* Static estimation (always shown) */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-green-900 dark:text-green-300">{L.predictionTitle}</h2>
                  <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    {aiResult ? "100%" : "87%"} {L.confidence}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-card rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-muted-foreground mb-2">{L.lowEst}</p>
                    <p className="text-3xl font-bold text-orange-600">{currentPrediction.low}</p>
                    <p className="text-xs text-muted-foreground mt-1">{L.unit}</p>
                  </div>
                  <div className="bg-white dark:bg-card rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-muted-foreground mb-2">{L.avgEst}</p>
                    <p className="text-3xl font-bold text-green-600">
                      {aiResult ? aiResult.yield_value : currentPrediction.avg}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{L.unit}</p>
                  </div>
                  <div className="bg-white dark:bg-card rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-muted-foreground mb-2">{L.highEst}</p>
                    <p className="text-3xl font-bold text-green-700">{currentPrediction.high}</p>
                    <p className="text-xs text-muted-foreground mt-1">{L.unit}</p>
                  </div>
                </div>
              </div>

              {/* Optimization Tips */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">{L.optRecs}</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-foreground">{L.tip1}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-foreground">{L.tip2}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-foreground">{L.tip3}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-foreground">{L.tip4}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
