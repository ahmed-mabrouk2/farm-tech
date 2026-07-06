'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/header'
import SidebarNav from '@/components/sidebar-nav'
import { useLanguage } from "@/lib/language-context"
import { fetchFertilizerOptimizer } from '@/lib/api'
import { BrainCircuit, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { pushNotification } from '@/lib/utils'

interface OptimizerResult {
  crop: string
  predicted_yield: number
  target_yield_t_ha: number
  yield_gap: number
  soil_N_supply: number
  NHI: number
  nitrogen_status: string
  equivalent_nitrogen_kg_ha: number
  recommended_fertilizer_amount: number
  "Selected Fertilizer": string
  expected_gain_t_ha: number
  expected_gain_percent: number
  reporting: {
    predicted_production_ton: number
    target_production_ton: number
    production_gap_ton: number
  }
  current_growth_stage: string
  DAP: number
  current_application?: {
    label: string
    dap: number
    amount_kg_ha: number
    pct: number
  }
  future_applications?: Array<{
    label: string
    dap: number
    amount_kg_ha: number
    pct: number
  }>
  past_applications?: Array<{
    label: string
    dap: number
    amount_kg_ha: number
    pct: number
  }>
  schedule_summary: string
  agronomic_explanation: string
  soil_ph: number
  nearest_field: {
    crop: string
    year: number
    lat: number
    lon: number
  }
}

export default function FertilizerOptimizerPage() {
  const [selectedCrop, setSelectedCrop] = useState('wheat')
  const [lat, setLat] = useState(30.0)
  const [lon, setLon] = useState(31.0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiResult, setApiResult] = useState<OptimizerResult | null>(null)

  // Input states for HF model
  const [predictedYield, setPredictedYield] = useState(4.5)
  const [soilNitrogen, setSoilNitrogen] = useState(0.1)
  const [soilSoc, setSoilSoc] = useState(1.5)
  const [soilPh, setSoilPh] = useState(7.2)
  const [soilCec, setSoilCec] = useState(18.0)
  const [soilClay, setSoilClay] = useState(35.0)
  const [soilMoisture, setSoilMoisture] = useState(0.25)
  const [fertilityIndex, setFertilityIndex] = useState(0.6)
  const [waterBalance, setWaterBalance] = useState(0.5)
  const [waterAvailability, setWaterAvailability] = useState(0.7)
  const [heatStress, setHeatStress] = useState(0.2)
  const [fertilizerType, setFertilizerType] = useState('Urea (46% N)')
  const [plantDate, setPlantDate] = useState('2025-11-01')
  const [currentDate, setCurrentDate] = useState('2025-12-10')
  const [harvArea, setHarvArea] = useState(5.0)
  const [seasonNdre, setSeasonNdre] = useState(0.3)
  const [seasonNdvi, setSeasonNdvi] = useState(0.5)
  const [seasonEvi, setSeasonEvi] = useState(0.2)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { t, dir, language } = useLanguage()
  const L = t.fertilizerOptimizer

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

  const loadNearestFieldData = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await fetchFertilizerOptimizer({
        action: "get_nearest",
        lat,
        lon,
        crop: selectedCrop
      })
      if (data.status === "success") {
        setHarvArea(data.harv_area || 5.0)
        setSoilNitrogen(data.soil_nitrogen || 0.1)
        setSoilSoc(data.soil_soc || 1.5)
        setSoilPh(data.soil_ph || 7.2)
        setSoilCec(data.soil_cec || 18.0)
        setSoilClay(data.soil_clay || 35.0)
        setSoilMoisture(data.soil_moisture || 0.25)
        setFertilityIndex(data.fertility_index || 0.6)
        setWaterBalance(data.water_balance || 0.5)
        setSeasonNdre(data.season_ndre_mean || 0.3)
        setSeasonNdvi(data.season_ndvi_mean || 0.5)
        setSeasonEvi(data.season_evi_mean || 0.2)
        
        pushNotification(
          "task",
          language === 'ar' ? "تم تحميل بيانات التربة بنجاح" : "Soil data loaded successfully",
          language === 'ar' 
            ? `تم استيراد خصائص التربة والساتل من أقرب حقل بموقع (${lat}, ${lon}).`
            : `Imported soil and satellite properties from the nearest field at (${lat}, ${lon}).`
        )
      }
    } catch (err: any) {
      console.error(err)
      setError(language === 'ar' ? "فشل تحميل بيانات التربة" : "Failed to load soil data")
    } finally {
      setLoading(false)
    }
  }

  const runOptimization = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchFertilizerOptimizer({
        action: "optimize",
        lat,
        lon,
        crop: selectedCrop,
        predicted_yield: predictedYield,
        soil_nitrogen: soilNitrogen,
        soil_soc: soilSoc,
        soil_ph: soilPh,
        soil_cec: soilCec,
        soil_clay: soilClay,
        soil_moisture: soilMoisture,
        fertility_index: fertilityIndex,
        water_balance: waterBalance,
        water_availability: waterAvailability,
        heat_stress: heatStress,
        fertilizer_type: fertilizerType,
        plant_date: plantDate,
        current_date: currentDate,
        harvarea: harvArea,
        season_ndre_mean: seasonNdre,
        season_ndvi_mean: seasonNdvi,
        season_evi_mean: seasonEvi,
      })
      if (data.status === "success" || data.recommended_fertilizer_amount !== undefined) {
        setApiResult(data)
        
        const isAr = language === 'ar'
        const desc = isAr 
          ? `تم توليد خطة تسميد مخصصة لـ ${selectedCrop} بمعدل سماد ${data.recommended_fertilizer_amount?.toFixed(1) || 0} كجم/هكتار من ${data['Selected Fertilizer'] || 'اليوريا'}.`
          : `Custom fertilization plan generated for ${selectedCrop} at ${data.recommended_fertilizer_amount?.toFixed(1) || 0} kg/ha of ${data['Selected Fertilizer'] || 'Urea'}.`
        
        pushNotification(
          "task",
          isAr ? "تم تحديث خطة السماد بنجاح" : "Fertilizer Optimizer Plan Generated",
          desc
        )
      } else {
        throw new Error(data.message || "Failed to fetch optimizer recommendations")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to fetch optimizer recommendations")
    } finally {
      setLoading(false)
    }
  }, [
    lat, lon, selectedCrop, language, predictedYield, soilNitrogen, soilSoc,
    soilPh, soilCec, soilClay, soilMoisture, fertilityIndex, waterBalance,
    waterAvailability, heatStress, fertilizerType, plantDate, currentDate,
    harvArea, seasonNdre, seasonNdvi, seasonEvi
  ])

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
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">{language === 'ar' ? 'الإعدادات' : 'Settings'}</h3>
                <div className="space-y-4">
                  {/* Crop Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{language === 'ar' ? 'نوع المحصول' : 'Crop Type'}</label>
                    <select
                      value={selectedCrop}
                      onChange={(e) => { setSelectedCrop(e.target.value); setApiResult(null); }}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
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
                      <label className="block text-sm font-medium text-foreground mb-2">{language === 'ar' ? 'خط العرض (Latitude)' : 'Latitude'}</label>
                      <input
                        type="number" step="0.1"
                        value={lat}
                        onChange={(e) => { setLat(parseFloat(e.target.value) || 0); setApiResult(null); }}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{language === 'ar' ? 'خط الطول (Longitude)' : 'Longitude'}</label>
                      <input
                        type="number" step="0.1"
                        value={lon}
                        onChange={(e) => { setLon(parseFloat(e.target.value) || 0); setApiResult(null); }}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      />
                    </div>
                  </div>

                  {/* Load nearest DB record button */}
                  <button
                    onClick={loadNearestFieldData}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-primary/40 text-primary hover:bg-primary/10 rounded-lg text-xs font-semibold
                               transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🔄</span>
                    {language === 'ar' ? 'تحميل بيانات الحقل الأقرب تلقائياً' : 'Load Nearest Field Data Automatically'}
                  </button>

                  {/* Advanced settings toggle */}
                  <div className="pt-2 border-t border-border">
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full flex items-center justify-between text-sm font-semibold text-primary py-2 hover:underline cursor-pointer"
                    >
                      <span>{showAdvanced ? (language === 'ar' ? '⚙️ إخفاء الإعدادات المتقدمة' : '⚙️ Hide Advanced Settings') : (language === 'ar' ? '⚙️ عرض الإعدادات المتقدمة' : '⚙️ Show Advanced Settings')}</span>
                      <span>{showAdvanced ? '▲' : '▼'}</span>
                    </button>
                    
                    {showAdvanced && (
                      <div className="space-y-4 pt-4 animate-in fade-in duration-200">
                        {/* Section: Soil Properties */}
                        <div className="border border-border/60 bg-muted/20 rounded-lg p-3 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {language === 'ar' ? 'خصائص التربة' : 'Soil Properties'}
                          </h4>
                          
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{language === 'ar' ? 'حموضة التربة (pH)' : 'Soil pH'}</span>
                              <span className="font-bold text-primary">{soilPh.toFixed(1)}</span>
                            </div>
                            <input
                              type="range" min="4.0" max="9.0" step="0.1"
                              value={soilPh}
                              onChange={(e) => setSoilPh(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{language === 'ar' ? 'النيتروجين (%)' : 'Soil Nitrogen (%)'}</span>
                              <span className="font-bold text-primary">{soilNitrogen.toFixed(2)}%</span>
                            </div>
                            <input
                              type="range" min="0.0" max="0.5" step="0.01"
                              value={soilNitrogen}
                              onChange={(e) => setSoilNitrogen(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{language === 'ar' ? 'الكربون العضوي (%)' : 'Soil SOC (%)'}</span>
                              <span className="font-bold text-primary">{soilSoc.toFixed(1)}%</span>
                            </div>
                            <input
                              type="range" min="0.0" max="5.0" step="0.1"
                              value={soilSoc}
                              onChange={(e) => setSoilSoc(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{language === 'ar' ? 'القدرة التبادلية (CEC)' : 'Soil CEC'}</span>
                              <span className="font-bold text-primary">{soilCec.toFixed(1)}</span>
                            </div>
                            <input
                              type="range" min="0" max="50" step="1"
                              value={soilCec}
                              onChange={(e) => setSoilCec(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{language === 'ar' ? 'الطين (%)' : 'Soil Clay (%)'}</span>
                              <span className="font-bold text-primary">{soilClay.toFixed(0)}%</span>
                            </div>
                            <input
                              type="range" min="0" max="100" step="5"
                              value={soilClay}
                              onChange={(e) => setSoilClay(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{language === 'ar' ? 'الرطوبة (0 - 0.5)' : 'Soil Moisture'}</span>
                              <span className="font-bold text-primary">{soilMoisture.toFixed(2)}</span>
                            </div>
                            <input
                              type="range" min="0.0" max="0.5" step="0.01"
                              value={soilMoisture}
                              onChange={(e) => setSoilMoisture(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{language === 'ar' ? 'مؤشر الخصوبة (0 - 1)' : 'Fertility Index'}</span>
                              <span className="font-bold text-primary">{fertilityIndex.toFixed(2)}</span>
                            </div>
                            <input
                              type="range" min="0.0" max="1.0" step="0.05"
                              value={fertilityIndex}
                              onChange={(e) => setFertilityIndex(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>
                        </div>

                        {/* Section: Yield & Crop metadata */}
                        <div className="border border-border/60 bg-muted/20 rounded-lg p-3 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {language === 'ar' ? 'الإنتاجية والمساحة' : 'Yield & Area'}
                          </h4>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{language === 'ar' ? 'الإنتاجية المتوقعة (طن/هكتار)' : 'Predicted Yield (t/ha)'}</span>
                              <span className="font-bold text-primary">{predictedYield.toFixed(1)}</span>
                            </div>
                            <input
                              type="range" min="0" max="15" step="0.5"
                              value={predictedYield}
                              onChange={(e) => setPredictedYield(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{language === 'ar' ? 'مساحة الحقل (هكتار)' : 'Harvest Area (ha)'}</span>
                              <span className="font-bold text-primary">{harvArea.toFixed(1)}</span>
                            </div>
                            <input
                              type="range" min="0.5" max="100" step="0.5"
                              value={harvArea}
                              onChange={(e) => setHarvArea(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>
                        </div>

                        {/* Section: Climate & Water */}
                        <div className="border border-border/60 bg-muted/20 rounded-lg p-3 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {language === 'ar' ? 'المناخ والماء' : 'Climate & Water'}
                          </h4>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{language === 'ar' ? 'توازن المياه (0 - 1)' : 'Water Balance'}</span>
                              <span className="font-bold text-primary">{waterBalance.toFixed(2)}</span>
                            </div>
                            <input
                              type="range" min="0.0" max="1.0" step="0.05"
                              value={waterBalance}
                              onChange={(e) => setWaterBalance(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{language === 'ar' ? 'وفرة المياه (0 - 1)' : 'Water Availability'}</span>
                              <span className="font-bold text-primary">{waterAvailability.toFixed(2)}</span>
                            </div>
                            <input
                              type="range" min="0.0" max="1.0" step="0.05"
                              value={waterAvailability}
                              onChange={(e) => setWaterAvailability(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{language === 'ar' ? 'الإجهاد الحراري (0 - 1)' : 'Heat Stress'}</span>
                              <span className="font-bold text-primary">{heatStress.toFixed(2)}</span>
                            </div>
                            <input
                              type="range" min="0.0" max="1.0" step="0.05"
                              value={heatStress}
                              onChange={(e) => setHeatStress(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>
                        </div>

                        {/* Section: Satellite Summaries */}
                        <div className="border border-border/60 bg-muted/20 rounded-lg p-3 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {language === 'ar' ? 'مؤشرات الأقمار الصناعية' : 'Satellite Averages'}
                          </h4>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>NDRE (-1 to 1)</span>
                              <span className="font-bold text-primary">{seasonNdre.toFixed(2)}</span>
                            </div>
                            <input
                              type="range" min="-1.0" max="1.0" step="0.05"
                              value={seasonNdre}
                              onChange={(e) => setSeasonNdre(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>NDVI (-1 to 1)</span>
                              <span className="font-bold text-primary">{seasonNdvi.toFixed(2)}</span>
                            </div>
                            <input
                              type="range" min="-1.0" max="1.0" step="0.05"
                              value={seasonNdvi}
                              onChange={(e) => setSeasonNdvi(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>EVI (-1 to 1)</span>
                              <span className="font-bold text-primary">{seasonEvi.toFixed(2)}</span>
                            </div>
                            <input
                              type="range" min="-1.0" max="1.0" step="0.05"
                              value={seasonEvi}
                              onChange={(e) => setSeasonEvi(parseFloat(e.target.value))}
                              className="w-full accent-primary h-1 bg-muted rounded"
                            />
                          </div>
                        </div>

                        {/* Section: Dates & Fertilizer */}
                        <div className="border border-border/60 bg-muted/20 rounded-lg p-3 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {language === 'ar' ? 'السماد وتواريخ الدورة' : 'Fertilizer & Schedule'}
                          </h4>
                          <div>
                            <label className="block text-xs font-medium mb-1">{language === 'ar' ? 'نوع السماد المفضل' : 'Selected Fertilizer'}</label>
                            <select
                              value={fertilizerType}
                              onChange={(e) => setFertilizerType(e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background text-foreground"
                            >
                              <option value="Urea (46% N)">Urea (46% N)</option>
                              <option value="Ammonium Nitrate (33.5% N)">Ammonium Nitrate (33.5% N)</option>
                              <option value="Ammonium Sulfate (20.6% N)">Ammonium Sulfate (20.6% N)</option>
                              <option value="Calcium Nitrate (15.5% N)">Calcium Nitrate (15.5% N)</option>
                              <option value="Calcium Ammonium Nitrate (27% N)">Calcium Ammonium Nitrate (27% N)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">{language === 'ar' ? 'تاريخ الزراعة' : 'Planting Date'}</label>
                            <input
                              type="date"
                              value={plantDate}
                              onChange={(e) => setPlantDate(e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background text-foreground"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">{language === 'ar' ? 'تاريخ التحليل الحالي' : 'Current Analysis Date'}</label>
                            <input
                              type="date"
                              value={currentDate}
                              onChange={(e) => setCurrentDate(e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background text-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={runOptimization}
                    disabled={loading}
                    className="w-full mt-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold
                               hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> {language === 'ar' ? 'جارٍ التحسين...' : 'Optimizing...'}</>
                    ) : (
                      <><BrainCircuit className="w-5 h-5" /> {language === 'ar' ? 'تشغيل محسن السماد بالذكاء الاصطناعي' : 'Run AI Optimizer'}</>
                    )}
                  </button>

                  {error && (
                    <p className="text-sm text-destructive mt-1">{error}</p>
                  )}
                </div>
              </div>

              {/* Dynamic soil metadata info card */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">{language === 'ar' ? 'حالة الحقل الحالي' : 'Current Field Status'}</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">{language === 'ar' ? 'مستوى حموضة التربة (pH)' : 'Soil pH'}</p>
                      <span className="text-sm font-semibold text-primary">
                        {apiResult ? apiResult.soil_ph.toFixed(2) : soilPh.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  {apiResult?.nearest_field && (
                    <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                      <p>{language === 'ar' ? 'أقرب سجل في قاعدة البيانات:' : 'Nearest Database Record:'}</p>
                      <p className="font-semibold text-foreground capitalize mt-1">
                        {translateCrop(apiResult.nearest_field.crop)} ({apiResult.nearest_field.year})
                      </p>
                      <p>{language === 'ar' ? 'الإحداثيات:' : 'Coordinates:'} {apiResult.nearest_field.lat.toFixed(4)}, {apiResult.nearest_field.lon.toFixed(4)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations Output */}
            <div className="lg:col-span-2 space-y-6">
              {apiResult ? (
                <>
                  {/* Summary Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground">{language === 'ar' ? 'مؤشر النيتروجين' : 'Nitrogen Index'}</p>
                      <p className="text-xl font-bold text-primary mt-1">{apiResult.NHI.toFixed(0)}%</p>
                      <span className="inline-block text-[10px] px-2 py-0.5 mt-1 bg-emerald-500/10 text-emerald-500 rounded-full font-semibold capitalize">
                        {apiResult.nitrogen_status}
                      </span>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground">{language === 'ar' ? 'فجوة الإنتاجية' : 'Yield Gap'}</p>
                      <p className="text-xl font-bold text-orange-500 mt-1">{apiResult.yield_gap.toFixed(2)}</p>
                      <span className="text-[10px] text-muted-foreground">{language === 'ar' ? 'طن/هكتار' : 't/ha'}</span>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground">{language === 'ar' ? 'إمداد التربة بـ N' : 'Soil N Supply'}</p>
                      <p className="text-xl font-bold text-blue-500 mt-1">{apiResult.soil_N_supply.toFixed(1)}</p>
                      <span className="text-[10px] text-muted-foreground">{language === 'ar' ? 'كجم/هكتار' : 'kg/ha'}</span>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground">{language === 'ar' ? 'تحسن الإنتاجية' : 'Expected Yield Gain'}</p>
                      <p className="text-xl font-bold text-emerald-500 mt-1">+{apiResult.expected_gain_t_ha.toFixed(2)}</p>
                      <span className="text-[10px] text-muted-foreground">+{apiResult.expected_gain_percent.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Steps Timeline Card */}
                  <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 text-foreground flex items-center gap-2">
                      <span>📋</span>
                      {language === 'ar' ? 'خطوات وجدول تطبيق السماد الموصى به' : 'Recommended Fertilization Steps'}
                    </h3>
                    
                    <div className="relative border-s border-emerald-500/20 ms-4 space-y-6">
                      {/* Step 1: Soil pH */}
                      <div className="relative ps-8">
                        <span className="absolute -start-3.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/40 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          1
                        </span>
                        <h4 className="font-bold text-foreground text-sm sm:text-base">
                          {language === 'ar' ? 'تهيئة حموضة التربة (pH)' : 'Soil pH Adjustment'}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {apiResult.soil_ph < 6.0 ? (
                            language === 'ar' 
                              ? `التربة حمضية جداً بمستوى حموضة (${apiResult.soil_ph.toFixed(2)}). يوصى بإضافة الجير (Lime) لرفع مستوى الحموضة pH.`
                              : `Soil is acidic (pH: ${apiResult.soil_ph.toFixed(2)}). Adding lime is recommended to raise pH.`
                          ) : apiResult.soil_ph > 7.8 ? (
                            language === 'ar' 
                              ? `التربة قلوية جداً بمستوى حموضة (${apiResult.soil_ph.toFixed(2)}). يوصى بإضافة الجبس (Gypsum) لخفض مستوى الحموضة pH.`
                              : `Soil is alkaline (pH: ${apiResult.soil_ph.toFixed(2)}). Adding gypsum is recommended to reduce pH.`
                          ) : (
                            language === 'ar' 
                              ? `مستوى حموضة التربة معتدل ومناسب جداً (${apiResult.soil_ph.toFixed(2)})، لا حاجة لإضافة أي محسنات كيميائية.`
                              : `Soil pH is balanced (${apiResult.soil_ph.toFixed(2)}). No pH amendments needed.`
                          )}
                        </p>
                      </div>

                      {/* Step 2: Fertilizer Application */}
                      <div className="relative ps-8">
                        <span className="absolute -start-3.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/40 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          2
                        </span>
                        <h4 className="font-bold text-foreground text-sm sm:text-base">
                          {language === 'ar' 
                            ? `تطبيق السماد: ${apiResult['Selected Fertilizer']}` 
                            : `Apply Fertilizer: ${apiResult['Selected Fertilizer']}`}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {apiResult.recommended_fertilizer_amount > 0 ? (
                            language === 'ar' 
                              ? `يوصى بتطبيق ${apiResult.recommended_fertilizer_amount.toFixed(1)} كجم/هكتار من ${apiResult['Selected Fertilizer']} لتوفير إجمالي صافي احتياج نيتروجيني قدره ${apiResult.equivalent_nitrogen_kg_ha.toFixed(1)} كجم/هكتار.`
                              : `Apply ${apiResult.recommended_fertilizer_amount.toFixed(1)} kg/ha of ${apiResult['Selected Fertilizer']} to deliver net nitrogen requirement of ${apiResult.equivalent_nitrogen_kg_ha.toFixed(1)} kg/ha.`
                          ) : (
                            language === 'ar'
                              ? `مخزون النيتروجين الطبيعي في التربة كافٍ جداً. لا توجد حاجة لتطبيق أي كميات إضافية من سماد ${apiResult['Selected Fertilizer']}.`
                              : `Natural soil N supply is sufficient. No additional application of ${apiResult['Selected Fertilizer']} is required.`
                          )}
                        </p>
                      </div>

                      {/* Step 3: Application Schedule */}
                      <div className="relative ps-8">
                        <span className="absolute -start-3.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/40 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          3
                        </span>
                        <h4 className="font-bold text-foreground text-sm sm:text-base">
                          {language === 'ar' ? 'جدول المواعيد ومراحل النمو' : 'Growth Stage Application Schedule'}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {language === 'ar' 
                            ? `المحصول حالياً في مرحلة (${apiResult.current_growth_stage}) بعد مرور ${apiResult.DAP} يوم من الزراعة. يوصى بإضافة دفعة عاجلة قدرها ${apiResult.current_application ? apiResult.current_application.amount_kg_ha : 0} كجم/هكتار الآن، وتقسيم المتبقي (${apiResult.future_applications ? apiResult.future_applications.reduce((acc, curr) => acc + curr.amount_kg_ha, 0) : 0} كجم/هكتار) على الدفاعات اللاحقة خلال الموسم.`
                            : `Crop is at (${apiResult.current_growth_stage}) stage (${apiResult.DAP} Days After Planting). Apply current split dose of ${apiResult.current_application ? apiResult.current_application.amount_kg_ha.toFixed(1) : '0.0'} kg/ha immediately, and reserve remaining ${apiResult.future_applications ? apiResult.future_applications.reduce((acc, curr) => acc + curr.amount_kg_ha, 0).toFixed(1) : '0.0'} kg/ha for subsequent seasonal splits.`}
                        </p>
                      </div>

                      {/* Step 4: Expected Productivity Gain */}
                      <div className="relative ps-8">
                        <span className="absolute -start-3.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/40 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          4
                        </span>
                        <h4 className="font-bold text-foreground text-sm sm:text-base">
                          {language === 'ar' ? 'الزيادة المتوقعة في الإنتاجية والربح' : 'Expected Yield & Profitability Gain'}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {language === 'ar'
                            ? `سيؤدي تطبيق هذا البرنامج من التسميد والري إلى زيادة إنتاجية المحصول بمعدل +${apiResult.expected_gain_t_ha.toFixed(2)} طن/هكتار (بنسبة تحسن متوقعة +${apiResult.expected_gain_percent.toFixed(1)}%).`
                            : `Executing this fertilization plan is predicted to increase crop yield by +${apiResult.expected_gain_t_ha.toFixed(2)} t/ha (a +${apiResult.expected_gain_percent.toFixed(1)}% yield improvement).`}
                        </p>
                      </div>

                      {/* Step 5: Total Field Production Gap */}
                      <div className="relative ps-8">
                        <span className="absolute -start-3.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/40 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          5
                        </span>
                        <h4 className="font-bold text-foreground text-sm sm:text-base">
                          {language === 'ar' ? 'الإنتاج الكلي للحقل وفجوة الإنتاج' : 'Total Field Production & Yield Gap'}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {language === 'ar'
                            ? `لهذا الحقل بمساحة ${harvArea.toFixed(1)} هكتار، يُتوقع تحقيق إنتاج إجمالي ${apiResult.reporting.predicted_production_ton.toFixed(1)} طن مقارنة بالحد الأقصى المستهدف ${apiResult.reporting.target_production_ton.toFixed(1)} طن، مما يقلص فجوة الإنتاج الإجمالية لتصبح ${apiResult.reporting.production_gap_ton.toFixed(1)} طن فقط.`
                            : `For this ${harvArea.toFixed(1)} ha field, the total predicted production will reach ${apiResult.reporting.predicted_production_ton.toFixed(1)} tons (target: ${apiResult.reporting.target_production_ton.toFixed(1)} tons), narrowing the total production gap to ${apiResult.reporting.production_gap_ton.toFixed(1)} tons.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
                  <BrainCircuit className="w-16 h-16 mx-auto text-muted-foreground opacity-30 mb-4 animate-pulse" />
                  <p className="text-lg font-semibold text-foreground mb-1">
                    {language === 'ar' ? 'لم يتم تحميل بيانات التسميد' : 'No optimization data loaded'}
                  </p>
                  <p className="text-sm">
                    {language === 'ar'
                      ? 'حدد نوع المحصول والإحداثيات، ثم اضغط على «تشغيل محسن السماد» لعرض توصيات السماد الملائمة.'
                      : 'Set your crop type and coordinates, and click Run AI Optimizer to see fertilizer recommendations.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
