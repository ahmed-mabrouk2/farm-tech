'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import SidebarNav from '@/components/sidebar-nav'
import { useLanguage } from "@/lib/language-context"
import { apiFetch, API } from '@/lib/api'
import { pushNotification } from '@/lib/utils'

export default function DiseaseDetectionPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectionResults, setDetectionResults] = useState<{
    detected: boolean
    disease: string
    confidence: number
    severity: string
  } | null>(null)

  const { t, dir, language } = useLanguage()
  const L = t.diseaseDetection

  const [scans, setScans] = useState<any[]>([])

  const getDiseaseLabel = (disease: string) => {
    const clean = (disease || '').trim().toLowerCase()
    if (clean === 'healthy') return L.mockDiseases.healthy
    if (clean === 'rust' || clean.includes('rust')) return L.mockDiseases.rust
    if (clean === 'mildew' || clean.includes('mildew')) return L.mockDiseases.mildew
    return disease
  }

  const getSeverityLabel = (severity: string) => {
    const clean = (severity || '').trim().toLowerCase()
    if (clean === 'none') return L.severity.none
    if (clean === 'medium') return L.severity.medium
    if (clean === 'high') return L.severity.high
    return severity
  }

  const getDateLabel = (dateKey: string) => {
    const clean = (dateKey || '').trim().toLowerCase()
    if (clean === 'today') return L.time.today
    if (clean === 'yesterday') return L.time.yesterday
    if (clean === 'daysago') return L.time.daysAgo
    return dateKey
  }

  useEffect(() => {
    const saved = localStorage.getItem('farmtec-recent-scans')
    if (saved) {
      try {
        setScans(JSON.parse(saved))
        return
      } catch (e) {}
    }

    const defaults = [
      { id: 1, date: 'today', time: '2:30 PM', disease: 'rust', confidence: 92, severity: 'high' },
      { id: 2, date: 'yesterday', time: '10:15 AM', disease: 'mildew', confidence: 78, severity: 'medium' },
      { id: 3, date: 'daysago', time: '3:45 PM', disease: 'healthy', confidence: 99, severity: 'none' },
    ]
    setScans(defaults)
    localStorage.setItem('farmtec-recent-scans', JSON.stringify(defaults))
  }, [language, L])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)

      setLoading(true)
      setError(null)
      setDetectionResults(null)

      try {
        const formData = new FormData()
        formData.append("image", file)

        const res = await apiFetch(API.cv, {
          method: "POST",
          body: formData,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const data = json.data
        if (json.success && data) {
          const diseaseName = data.prediction || "Unknown"
          const isHealthy = diseaseName.toLowerCase().includes("healthy")
          const conf = Math.round(data.confidence || 90.0)

          setDetectionResults({
            detected: !isHealthy,
            disease: diseaseName,
            confidence: conf,
            severity: isHealthy ? 'none' : conf > 75 ? 'high' : 'medium',
          })

          const isAr = language === 'ar'
          const now = new Date()
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

          const newScan = {
            id: Date.now(),
            date: 'today',
            time: timeStr,
            disease: isHealthy ? 'healthy' : diseaseName.toLowerCase().includes('rust') ? 'rust' : diseaseName.toLowerCase().includes('mildew') ? 'mildew' : diseaseName,
            confidence: conf,
            severity: isHealthy ? 'none' : conf > 75 ? 'high' : 'medium',
          }

          setScans(prev => {
            const updated = [newScan, ...prev]
            localStorage.setItem('farmtec-recent-scans', JSON.stringify(updated))
            return updated
          })

          if (isHealthy) {
            pushNotification(
              "disease",
              isAr ? "تحليل مسح النبات سليم" : "Plant Scan Result: Healthy",
              isAr 
                ? `مسح النبات تم بنجاح. النتيجة: النبات سليم وبصحة جيدة (نسبة التأكيد: ${conf}%).`
                : `Plant disease scan completed. Result: Healthy (Confidence: ${conf}%).`
            )
          } else {
            pushNotification(
              "disease",
              isAr ? "تحذير: تم اكتشاف إصابة مرضية" : "Alert: Plant Disease Detected",
              isAr
                ? `تم الكشف عن مرض (${diseaseName}) في المسح الأخير بنسبة تأكيد ${conf}%، ومستوى الخطورة ${sev === 'high' ? 'عالي' : 'متوسط'}.`
                : `Potential disease (${diseaseName}) detected in scan with ${conf}% confidence. Severity: ${sev.toUpperCase()}.`
            )
          }
        } else {
          throw new Error(json.error || "CV detection failed")
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message || "Failed to process image")
      } finally {
        setLoading(false)
      }
    }
  }

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
            {/* Upload Area */}
            <div className="lg:col-span-2">
              <div className="bg-card border-2 border-dashed border-border rounded-lg p-8 text-center mb-6">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{L.uploadText}</p>
                  <p className="text-sm text-muted-foreground mt-1">{L.uploadHint}</p>
                </label>
              </div>

              {selectedImage && (
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">{L.uploadedImage}</h3>
                  <img src={selectedImage} alt="Uploaded plant" className="w-full h-96 object-cover rounded-lg mb-4" />
                  
                  {loading && (
                    <div className="flex items-center justify-center p-8 bg-muted/20 rounded-lg">
                      <div className="text-center animate-pulse">
                        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Analyzing image using AI model...</p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm mb-4">
                      {error}
                    </div>
                  )}

                  {detectionResults && (
                    <div className={`p-4 rounded-lg ${detectionResults.detected ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${detectionResults.detected ? 'text-red-900' : 'text-green-900'}`}>
                            {detectionResults.detected ? L.diseaseDetected : L.plantHealthy}
                          </p>
                          <p className={`text-2xl font-bold mt-1 ${detectionResults.detected ? 'text-red-600' : 'text-green-600'}`}>
                            {getDiseaseLabel(detectionResults.disease)}
                          </p>
                        </div>
                        <div className={dir === 'rtl' ? 'text-left' : 'text-right'}>
                          <p className="text-sm text-muted-foreground">{L.confidence}</p>
                          <p className="text-3xl font-bold text-foreground">{detectionResults.confidence.toFixed(1)}%</p>
                        </div>
                      </div>

                      {detectionResults.detected && (
                        <div className="mt-4 pt-4 border-t border-red-200">
                          <h4 className="font-semibold text-red-900 mb-2">{L.treatmentRecs}</h4>
                          <ul className="text-sm text-red-800 space-y-1">
                            <li>• {L.tip1}</li>
                            <li>• {L.tip2}</li>
                            <li>• {L.tip3}</li>
                            <li>• {L.tip4}</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Scans */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">{L.recentScans}</h3>
                <div className="space-y-3">
                  {scans.map((scan) => {
                    const isHigh = scan.severity === 'high' || (scan.severity || '').toString().toLowerCase().includes('high') || (scan.severity || '').toString().includes('عالية')
                    const isMedium = scan.severity === 'medium' || (scan.severity || '').toString().toLowerCase().includes('medium') || (scan.severity || '').toString().includes('متوسطة')

                    return (
                      <div key={scan.id} className="pb-3 border-b border-border last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-foreground">{getDiseaseLabel(scan.disease)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            isHigh ? 'bg-red-100 text-red-800' :
                            isMedium ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {getSeverityLabel(scan.severity)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{getDateLabel(scan.date)} {scan.time}</p>
                        <p className="text-xs text-muted-foreground mt-1">{scan.confidence}% {L.confidence.toLowerCase()}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
