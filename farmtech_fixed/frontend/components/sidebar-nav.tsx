"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/lib/language-context"

interface SidebarNavProps {
  isOpen?: boolean
  onToggle?: () => void
}

export default function SidebarNav({ isOpen = true, onToggle = () => {} }: SidebarNavProps) {
  const [activeItem, setActiveItem] = useState("dashboard")
  const pathname = usePathname()
  const { t } = useLanguage()
  const n = t.nav

  const menuItems = [
    { id: "dashboard", label: n.dashboard, href: "/dashboard" },
    { id: "farm", label: n.myFarm, href: "/my-farm" },
    { id: "add-farm", label: n.addFieldGps, href: "/add-farm" },
    { id: "ai-models", label: n.aiModels, href: "/ai-models" },
    { id: "crop-recommend", label: n.cropRecommendation, href: "/ai-models/crop-recommendation" },
    { id: "yield-predict", label: n.yieldPrediction, href: "/ai-models/yield-prediction" },
    { id: "disease-detect", label: n.diseaseDetection, href: "/ai-models/disease-detection" },
    { id: "fertilizer", label: n.fertilizerOptimizer, href: "/ai-models/fertilizer-optimizer" },
    { id: "soil", label: n.soilHealth, href: "/soil-health" },
    { id: "irrigation", label: n.irrigationPlan, href: "/irrigation-plan" },
    { id: "market", label: n.marketPrices, href: "/market-prices" },
    { id: "analytics", label: n.analytics, href: "/analytics" },
    { id: "notifications", label: n.notifications, href: "/notifications" },
    { id: "history", label: n.farmHistory, href: "/farm-history" },
    { id: "help", label: n.helpSupport, href: "/help-support" },
    { id: "settings", label: n.settings, href: "/settings" },
  ]

  const getCurrentActive = () => {
    if (pathname === "/dashboard") return "dashboard"
    if (pathname.startsWith("/add-farm")) return "add-farm"
    if (pathname.startsWith("/my-farm")) return "farm"
    if (pathname.startsWith("/ai-models/crop-recommendation")) return "crop-recommend"
    if (pathname.startsWith("/ai-models/yield-prediction")) return "yield-predict"
    if (pathname.startsWith("/ai-models/disease-detection")) return "disease-detect"
    if (pathname.startsWith("/ai-models/fertilizer-optimizer")) return "fertilizer"
    if (pathname.startsWith("/ai-models")) return "ai-models"
    if (pathname.startsWith("/soil-health")) return "soil"
    if (pathname.startsWith("/irrigation")) return "irrigation"
    if (pathname.startsWith("/market")) return "market"
    if (pathname.startsWith("/analytics")) return "analytics"
    if (pathname.startsWith("/notifications")) return "notifications"
    if (pathname.startsWith("/farm-history")) return "history"
    if (pathname.startsWith("/help-support")) return "help"
    if (pathname.startsWith("/settings")) return "settings"
    return "dashboard"
  }

  const getIcon = (id: string) => {
    const iconProps = "w-5 h-5 flex-shrink-0"
    switch (id) {
      case "dashboard":
        return (
          <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
        )
      case "farm":
        return (
          <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
          </svg>
        )
      case "add-farm":
        return (
          <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
          </svg>
        )
      case "ai-models":
        return (
          <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
          </svg>
        )
      case "ai-agent":
        return (
          <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        )
      case "crop-recommend":
      case "soil":
      case "yield-predict":
      case "disease-detect":
      case "fertilizer":
      case "analytics":
      case "history":
      case "help":
        return (
          <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        )
      case "notifications":
        return (
          <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
        )
      case "irrigation":
        return (
          <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z" />
          </svg>
        )
      case "market":
        return (
          <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm3.6 9.6l-4.5 4.5-3-3-1.4 1.4L11 19l6-6-1.4-1.4z" />
          </svg>
        )
      case "settings":
        return (
          <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.1-.64l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.09-.47 0-.59.22L2.74 8.87c-.12.22-.07.5.1.64l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.1.64l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.5-.1-.64l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-20"
      } bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out flex shrink-0 flex-col border-e border-sidebar-border h-dvh`}
    >
      {/* Logo Area */}
      <div className="flex items-center justify-between p-6">
        <div className={`flex items-center gap-3 ${!isOpen && "justify-center w-full"}`}>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sidebar-primary">
            <svg className="w-6 h-6 text-sidebar-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l9.5 5.5v9c0 5.55-4.41 10.74-9.5 11.95C6.91 27.24 2.5 22.05 2.5 16.5v-9L12 2z" />
            </svg>
          </div>
          {isOpen && <span className="text-lg font-bold text-sidebar-primary-foreground">FarmTec</span>}
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-sidebar-accent rounded-lg transition-colors"
          aria-label={t.common.toggleSidebar}
        >
          <svg
            className={`w-5 h-5 transition-transform ${!isOpen && "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = getCurrentActive() === item.id

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActiveItem(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
              title={!isOpen ? item.label : undefined}
            >
              {getIcon(item.id)}
              {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className={`text-xs ${isOpen ? "text-sidebar-foreground" : "hidden"}`}>
          {t.sidebarFooter} {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  )
}
