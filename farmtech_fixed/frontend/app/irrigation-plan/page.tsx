'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Header from '@/components/header'
import SidebarNav from '@/components/sidebar-nav'
import { useLanguage } from '@/lib/language-context'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Droplet, Calendar, Clock, Volume2, CheckCircle2, 
  AlertCircle, Leaf, Zap, Loader2, Sparkles, BrainCircuit
} from 'lucide-react'
import { apiFetch, API, analyzeIrrigation } from '@/lib/api'
import { pushNotification, pushFarmHistory } from '@/lib/utils'

export default function IrrigationPlanPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [autoAdjust, setAutoAdjust] = useState(true)
  
  const { t, language } = useLanguage()
  const isRtl = language === 'ar'
  const L = t.irrigationPlan

  // Database Data States
  const [plots, setPlots] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  // Form States for creating new schedule
  const [formPlotId, setFormPlotId] = useState<string>('')
  const [formTime, setFormTime] = useState<string>('')
  const [formDuration, setFormDuration] = useState<number>(30)
  const [formVolume, setFormVolume] = useState<number>(100)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // AI Irrigation State
  const [lat, setLat] = useState(30.08)
  const [lon, setLon] = useState(31.25)
  const [year, setYear] = useState(2024)
  const [cropType, setCropType] = useState("wheat")
  const [debug, setDebug] = useState(false)
  
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<any | null>(null)

  // Fetch all plots and schedules
  const loadData = useCallback(async () => {
    setDataLoading(true)
    try {
      const [plotsRes, schedRes] = await Promise.all([
        apiFetch(API.plots),
        apiFetch(API.schedules),
      ])

      let plotsList: any[] = []
      let schedulesList: any[] = []

      if (plotsRes.ok) {
        const data = await plotsRes.json()
        plotsList = Array.isArray(data) ? data : data.results ?? []
        setPlots(plotsList)
        if (plotsList.length > 0 && !formPlotId) {
          setFormPlotId(String(plotsList[0].id))
        }
      }

      if (schedRes.ok) {
        const data = await schedRes.json()
        schedulesList = Array.isArray(data) ? data : data.results ?? []
        // Sort chronologically (future schedules first)
        schedulesList.sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
        setSchedules(schedulesList)
      }

      // Map selected session ID if not set
      if (schedulesList.length > 0) {
        const activeItem = schedulesList.find(s => s.status !== 'completed') || schedulesList[0]
        setSelectedSessionId(String(activeItem.id))
      }
    } catch (e) {
      console.error("Failed to load plots and schedules:", e)
    } finally {
      setDataLoading(false)
    }
  }, [formPlotId])

  useEffect(() => {
    loadData()
  }, [])

  // Auto-fill coordinates & crop from selected field plot
  const handlePlotSelectForAI = (plotIdStr: string) => {
    const plot = plots.find(p => String(p.id) === plotIdStr)
    if (plot) {
      setLat(parseFloat(plot.latitude) || parseFloat(plot.lat) || 30.08)
      setLon(parseFloat(plot.longitude) || parseFloat(plot.lon) || 31.25)
      setCropType(plot.crop_type?.toLowerCase() || 'wheat')
    }
  }

  // Handle Form Submission to create schedule
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formPlotId || !formTime) return

    setFormSubmitting(true)
    try {
      const res = await apiFetch(API.schedules, {
        method: 'POST',
        body: JSON.stringify({
          plot: Number(formPlotId),
          scheduled_time: new Date(formTime).toISOString(),
          duration_minutes: formDuration,
          water_volume: formVolume,
          status: 'scheduled'
        })
      })

      if (res.ok) {
        const newSched = await res.json()
        const plot = plots.find(p => p.id === Number(formPlotId))
        const pName = plot ? plot.name : `Plot #${formPlotId}`
        
        pushNotification(
          'task',
          isRtl ? 'تم إضافة موعد ري' : 'Irrigation Task Scheduled',
          isRtl 
            ? `تم جدولة عملية ري جديدة لحقل ${pName} في ${new Date(formTime).toLocaleString()}`
            : `Scheduled new irrigation for ${pName} at ${new Date(formTime).toLocaleString()}`,
          formPlotId,
          pName
        )

        pushFarmHistory(
          'irrigation',
          isRtl ? 'جدولة ري' : 'Irrigation Scheduled',
          isRtl
            ? `تم جدولة ري حقل ${pName} لمدة ${formDuration} دقيقة بكمية ${formVolume} لتر`
            : `Scheduled irrigation for ${pName} for ${formDuration} mins with ${formVolume}L`,
          formPlotId,
          pName
        )

        // Reset form
        setFormTime('')
        await loadData()
      } else {
        alert(isRtl ? 'فشل إضافة موعد الري' : 'Failed to schedule irrigation')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle Irrigation Completion (Start/Complete Irrigation)
  const handleStartIrrigation = async (idStr: string) => {
    const session = schedules.find(s => String(s.id) === idStr)
    if (!session) return

    try {
      const res = await apiFetch(`${API.schedules}${idStr}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' })
      })

      if (res.ok) {
        const plot = plots.find(p => p.id === session.plot)
        const pName = plot ? plot.name : `Plot #${session.plot}`

        pushNotification(
          'task',
          isRtl ? 'اكتملت عملية الري' : 'Irrigation Completed',
          isRtl 
            ? `تم إكمال عملية الري المجدولة لحقل ${pName} بنجاح.`
            : `Scheduled irrigation task for ${pName} has been successfully completed.`,
          session.plot,
          pName
        )

        pushFarmHistory(
          'irrigation',
          isRtl ? 'إكمال عملية الري' : 'Irrigation Completed',
          isRtl
            ? `تم ري حقل ${pName} بنجاح. المدة: ${session.duration_minutes} دقيقة، كمية المياه: ${session.water_volume} لتر.`
            : `Irrigation completed for ${pName}. Duration: ${session.duration_minutes} mins, Volume: ${session.water_volume}L.`,
          session.plot,
          pName
        )

        await loadData()
      }
    } catch (e) {
      console.error("Failed to complete irrigation schedule:", e)
    }
  }

  // Handle AI analysis
  const handleAnalyze = async () => {
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await analyzeIrrigation({
        lat,
        lon,
        crop: cropType,
        year
      })
      if (result.error) {
        throw new Error(result.error)
      }
      setAiResult(result)
    } catch (err: any) {
      setAiError(err.message || "Failed to analyze")
    } finally {
      setAiLoading(false)
    }
  }

  // Status mapping
  const statusConfig = {
    completed: { color: "bg-green-500/10 text-green-500 border-green-500/30", label: isRtl ? 'مكتمل' : 'Completed' },
    scheduled: { color: "bg-blue-500/10 text-blue-500 border-blue-500/30", label: isRtl ? 'مجدول' : 'Scheduled' },
    in_progress: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", label: isRtl ? 'قيد التنفيذ' : 'In Progress' },
  }

  // Map backend array to UI sessions structure
  const uiSessions = useMemo(() => {
    const plotMap = new Map(plots.map(p => [p.id, p]))
    return schedules.map(s => {
      const dateObj = new Date(s.scheduled_time)
      const plot = plotMap.get(s.plot)
      const plotName = plot ? plot.name : `Plot #${s.plot}`
      
      const dateStr = dateObj.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      return {
        id: String(s.id),
        date: dateStr,
        day: dateObj.getDate(),
        time: timeStr,
        duration: `${s.duration_minutes} mins`,
        volume: s.water_volume,
        status: s.status as 'completed' | 'scheduled' | 'in_progress',
        plotName,
        cropType: plot ? plot.crop_type : ''
      }
    })
  }, [schedules, plots, language])

  // Get active selected session
  const selectedSession = uiSessions.find(s => s.id === selectedSessionId)

  // Calculate sum of water volume
  const waterSavedThisMonth = useMemo(() => {
    // Water saved estimated dynamically based on area
    const total = plots.reduce((acc, plot) => acc + (plot.area || 0), 0)
    return Math.round(total * 28.5 + 45)
  }, [plots])

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

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Task - Primary Card */}
              <div className="lg:col-span-1">
                <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Droplet className="w-5 h-5 text-accent animate-bounce" />
                      {isRtl ? 'المهمة القادمة' : 'Next Irrigation'}
                    </CardTitle>
                    <CardDescription>{isRtl ? 'تفاصيل جدول الري النشط' : 'Details of the active schedule'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {dataLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                      </div>
                    ) : selectedSession ? (
                      <>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1">
                              📍 {selectedSession.plotName} ({selectedSession.cropType})
                            </p>
                            <p className="text-2xl sm:text-3xl font-bold text-accent">{selectedSession.time}</p>
                            <p className="text-xs text-muted-foreground mt-1">{selectedSession.date}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-card/50 p-3 rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground mb-1">{L.durationLabel}</p>
                              <p className="font-semibold text-foreground text-sm sm:text-base">{selectedSession.duration}</p>
                            </div>
                            <div className="bg-card/50 p-3 rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground mb-1">{L.volumeLabel}</p>
                              <p className="font-semibold text-foreground text-sm sm:text-base">{selectedSession.volume}L</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-accent/20">
                          <Badge className={`${statusConfig[selectedSession.status].color} border px-3 py-1 font-semibold text-xs`}>
                            {statusConfig[selectedSession.status].label}
                          </Badge>
                        </div>

                        {selectedSession.status !== 'completed' && (
                          <Button 
                            onClick={() => handleStartIrrigation(selectedSession.id)}
                            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-11"
                          >
                            <Zap className="w-4 h-4 me-2" />
                            {isRtl ? 'تأكيد إكمال الري' : 'Confirm Completion'}
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>{isRtl ? 'لا توجد مهام ري نشطة' : 'No active tasks'}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Multiple Cards */}
              <div className="lg:col-span-2 space-y-6">
                {/* AI Auto-Adjustment Toggle & Input */}
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2 text-foreground">
                        <Leaf className="w-5 h-5 text-primary" />
                        {L.smartFeatures}
                      </span>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoAdjust}
                          onChange={(e) => setAutoAdjust(e.target.checked)}
                          className="w-5 h-5 accent-primary cursor-pointer"
                        />
                        <span className="ms-2 text-sm font-semibold">{L.autoAdjust}</span>
                      </label>
                    </CardTitle>
                    <CardDescription>
                      {autoAdjust ? L.autoAdjustDesc : L.manualDesc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Input Form for AI */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">{isRtl ? 'اختر الحقل للتحليل' : 'Select Field Plot'}</label>
                        <select 
                          onChange={(e) => handlePlotSelectForAI(e.target.value)} 
                          className="w-full bg-muted border border-border rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">-- {isRtl ? 'اختر حقل' : 'Select'}</option>
                          {plots.map(p => (
                            <option key={p.id} value={String(p.id)}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">{isRtl ? 'خط العرض' : 'Latitude'}</label>
                        <input type="number" step="0.0001" value={lat} onChange={e => setLat(Number(e.target.value))} className="w-full bg-muted border border-border rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">{isRtl ? 'خط الطول' : 'Longitude'}</label>
                        <input type="number" step="0.0001" value={lon} onChange={e => setLon(Number(e.target.value))} className="w-full bg-muted border border-border rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">{isRtl ? 'نوع المحصول' : 'Crop Type'}</label>
                        <select value={cropType} onChange={e => setCropType(e.target.value)} className="w-full bg-muted border border-border rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary">
                          <option value="wheat">{isRtl ? 'قمح' : 'Wheat'}</option>
                          <option value="rice">{isRtl ? 'أرز' : 'Rice'}</option>
                          <option value="maize">{isRtl ? 'ذرة' : 'Maize'}</option>
                          <option value="tomato">{isRtl ? 'طماطم' : 'Tomato'}</option>
                          <option value="potato">{isRtl ? 'بطاطس' : 'Potato'}</option>
                        </select>
                      </div>
                    </div>

                    <Button onClick={handleAnalyze} disabled={aiLoading || !autoAdjust} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2">
                      {aiLoading ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 me-2" />}
                      {isRtl ? 'تحليل احتياجات الري بالذكاء الاصطناعي' : 'Analyze Irrigation Needs (AI)'}
                    </Button>

                    {aiError && <div className="text-sm text-destructive mt-2">{aiError}</div>}
                    
                    {aiResult && (
                      <div className="mt-4 p-5 bg-primary/10 border border-primary/25 rounded-2xl space-y-4 transition-all">
                        <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                          <h4 className="text-sm font-bold flex items-center gap-1.5 text-primary">
                            <Sparkles className="w-4 h-4 animate-pulse" /> 
                            {isRtl ? 'توصية الذكاء الاصطناعي الجيومكانية' : 'Geospatial AI Recommendation'}
                          </h4>
                          <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/25 capitalize text-xs px-2 py-0.5">
                            {aiResult.confidence} {isRtl ? 'ثقة' : 'confidence'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'الاحتياج الموسمي الإجمالي' : 'Total Seasonal Need'}</p>
                            <p className="text-2xl font-bold text-foreground">
                              {aiResult.irrigation_need_mm_season} 
                              <span className="text-sm font-semibold text-muted-foreground ms-1">mm</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'مستوى الاحتياج' : 'Need Level'}</p>
                            <Badge variant="outline" className="text-xs bg-background/50 py-0.5 px-2">
                              {aiResult.irrigation_class}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'موثوقية التنبؤ' : 'Prediction Reliability'}</p>
                            <span className={`text-sm font-semibold capitalize ${
                              aiResult.reliability_flag === 'stable' ? 'text-green-600 dark:text-green-400' :
                              aiResult.reliability_flag === 'moderate' ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {aiResult.reliability_flag}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Direct Irrigation Scheduling Form */}
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      {isRtl ? 'جدولة ري يدوي جديدة' : 'Schedule New Irrigation Manual'}
                    </CardTitle>
                    <CardDescription>{isRtl ? 'أضف مهمة ري جديدة لحقولك في قاعدة البيانات' : 'Add a new scheduled task for your plots'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateSchedule} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{isRtl ? 'الحقل' : 'Plot Field'}</label>
                        <select 
                          value={formPlotId} 
                          onChange={(e) => setFormPlotId(e.target.value)} 
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm outline-none"
                          required
                        >
                          {plots.map(p => (
                            <option key={p.id} value={String(p.id)}>{p.name} ({p.crop_type})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{isRtl ? 'موعد الري' : 'Scheduled Time'}</label>
                        <input 
                          type="datetime-local" 
                          value={formTime}
                          onChange={(e) => setFormTime(e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm outline-none"
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{isRtl ? 'المدة (بالدقائق)' : 'Duration (mins)'}</label>
                        <input 
                          type="number" 
                          value={formDuration}
                          onChange={(e) => setFormDuration(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm outline-none"
                          min="1"
                          required 
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{isRtl ? 'الكمية (لتر)' : 'Volume (L)'}</label>
                          <input 
                            type="number" 
                            value={formVolume}
                            onChange={(e) => setFormVolume(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm outline-none"
                            min="1"
                            required 
                          />
                        </div>
                        <Button 
                          type="submit" 
                          disabled={formSubmitting} 
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4"
                        >
                          {formSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '+'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Calendar/Timeline View */}
            <Card className="mt-6 bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle>{L.scheduleTitle}</CardTitle>
                <CardDescription>{L.scheduleDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="space-y-3">
                  {uiSessions.length > 0 ? (
                    uiSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`w-full text-left p-4 rounded-lg border transition-all cursor-pointer ${
                          selectedSessionId === session.id
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/40"
                        }`}
                      >
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <Droplet className="w-5 h-5 text-accent flex-shrink-0" />
                              <span className="font-semibold text-foreground">{session.date}</span>
                              <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded font-medium">
                                📍 {session.plotName}
                              </span>
                              <Badge className={`${statusConfig[session.status].color} border px-2 py-0.5 font-semibold text-[10px]`}>
                                {statusConfig[session.status].label}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {session.time}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {session.duration}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Volume2 className="w-4 h-4" />
                                {session.volume}L
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.status === "completed" && <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />}
                            {session.status === "in_progress" && <AlertCircle className="w-6 h-6 text-yellow-600 shrink-0 animate-pulse" />}
                            {session.status === "scheduled" && <Calendar className="w-6 h-6 text-blue-600 shrink-0" />}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-card border border-dashed border-border rounded-lg text-muted-foreground">
                      <p>{isRtl ? 'لا توجد مواعيد ري مجدولة حالياً' : 'No scheduled irrigation sessions available'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
