"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { apiFetch, API } from "@/lib/api"
import SidebarNav from "@/components/sidebar-nav"
import Header from "@/components/header"
import FeaturedSection from "@/components/featured-section"
import WeatherWidget from "@/components/weather-widget"
import SoilStatusCard from "@/components/soil-status-card"
import CropLifecycle from "@/components/crop-lifecycle"
import ActiveTasksList from "@/components/active-tasks-list"
import QuickActionsPanel from "@/components/quick-actions-panel"
import PriceChart from "@/components/price-chart"
import YieldPredictionChart from "@/components/yield-prediction-chart"

interface DashboardData {
  plots_count: number
  total_area: number
  latest_soil_record: {
    nitrogen: number
    phosphorus: number
    potassium: number
    ph: number
    moisture: number
  } | null
  crop_lifecycle: {
    crop_type: string
    plot_name: string
    status: string
    stage: string
    days_growing: number
    total_days: number
    days_until_harvest: number
    progress_pct: number
    harvest_date: string
    health_score: number
  } | null
}

export default function Dashboard() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { t } = useLanguage()
  const D = t.dashboard
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [dashLoading, setDashLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return

    let isMounted = true
    const fetchData = async () => {
      try {
        const res = await apiFetch(API.dashboard)
        if (res.ok && isMounted) {
          const json = await res.json()
          if (json) setDashData(json)
        }
      } catch (e) {
      } finally {
        if (isMounted) setDashLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Poll every 30 seconds

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{D.loading}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <SidebarNav isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">

            {/* Featured Banner (fetches data internally) */}
            <FeaturedSection />

            {/* Dashboard Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{D.farmOverview}</h2>
                <p className="text-muted-foreground">{D.farmOverviewSub}</p>
              </div>
              <div className="hidden lg:flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                <svg className="w-5 h-5 text-primary animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z" />
                </svg>
                <div className="text-sm">
                  <p className="font-semibold text-foreground">{D.systemsActive}</p>
                  <p className="text-muted-foreground text-xs">{D.lastUpdated}</p>
                </div>
              </div>
            </div>

            {/* ============================================================
                TOP ROW: 3-column — Weather | Crop Lifecycle | Soil Status
                ============================================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
              {/* Dark green weather card */}
              <WeatherWidget />

              {/* Crop Lifecycle — passes shared dashboard data */}
              <CropLifecycle
                data={dashData?.crop_lifecycle ?? null}
                loading={dashLoading}
              />

              {/* Soil Status with NPK bars + moisture gauge */}
              <SoilStatusCard
                externalData={dashData?.latest_soil_record ?? null}
                externalLoading={dashLoading}
              />
            </div>

            {/* ============================================================
                MIDDLE ROW: Active Tasks | Quick Actions
                ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              <div className="lg:col-span-1">
                <ActiveTasksList />
              </div>
              <div className="lg:col-span-2">
                <QuickActionsPanel />
              </div>
            </div>

            {/* ============================================================
                CHARTS ROW
                ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <PriceChart />
              <YieldPredictionChart />
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
