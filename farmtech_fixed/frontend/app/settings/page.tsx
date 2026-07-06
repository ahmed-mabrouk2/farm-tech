"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useTheme } from "next-themes"

import SidebarNav from "@/components/sidebar-nav"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { apiFetch, API } from "@/lib/api"

export default function SettingsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, logout, user, updateUser } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const { resolvedTheme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    farmLocation: "Cairo, Egypt",
  })

  const [units, setUnits] = useState("metric")

  const [notifications, setNotifications] = useState({
    weatherAlerts: true,
    irrigationReminders: true,
    marketNews: false,
  })

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Initialize profile values from context when loaded
  useEffect(() => {
    if (user) {
      const loc = typeof window !== 'undefined' ? localStorage.getItem('farmtec-settings-location') || "Cairo, Egypt" : "Cairo, Egypt"
      setFormData({
        name: user.username || "",
        phone: user.phone_number || "",
        email: user.email || "",
        farmLocation: loc,
      })
    }
  }, [user])

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUnits = localStorage.getItem('farmtec-settings-units')
      if (savedUnits) setUnits(savedUnits)

      const savedNotifs = localStorage.getItem('farmtec-settings-notifications')
      if (savedNotifs) {
        try { setNotifications(JSON.parse(savedNotifs)) } catch (e) {}
      }
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    return null
  }

  const S = t.settingsPage
  const isDarkTheme = (resolvedTheme ?? "light") === "dark"

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUnitsChange = (val: string) => {
    setUnits(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem('farmtec-settings-units', val)
    }
  }

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const updated = { ...prev }
      updated[key] = !prev[key]
      if (typeof window !== 'undefined') {
        localStorage.setItem('farmtec-settings-notifications', JSON.stringify(updated))
      }
      return updated
    })
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    try {
      const res = await apiFetch(API.profile, {
        method: 'PUT',
        body: JSON.stringify({
          username: formData.name,
          phone_number: formData.phone,
        })
      })

      if (res.ok) {
        updateUser({
          username: formData.name,
          phone_number: formData.phone,
        })
        if (typeof window !== 'undefined') {
          localStorage.setItem('farmtec-settings-location', formData.farmLocation)
        }
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update profile')
      }
    } catch (err: any) {
      setSaveError(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background text-foreground">
      <SidebarNav isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">{S.title}</h1>
              <p className="text-muted-foreground">{S.subtitle}</p>
            </div>

            {/* Profile Management */}
            <Card className="mb-6 bg-card border-border shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                    <svg className="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle>{S.profileCardTitle}</CardTitle>
                    <CardDescription>{S.profileCardDesc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {saveSuccess && (
                    <div className="p-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-sm font-semibold">
                      {language === 'ar' ? 'تم حفظ التعديلات بنجاح!' : 'Profile updated successfully!'}
                    </div>
                  )}

                  {saveError && (
                    <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-semibold">
                      {saveError}
                    </div>
                  )}

                  {/* Name Field */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">{S.fullName}</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.707 12.293l-5.293-5.293a1 1 0 00-1.414 1.414L15.586 12l-4.586 4.586a1 1 0 101.414 1.414l5.293-5.293a1 1 0 000-1.414z" />
                      </svg>
                      {S.phone}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                      {S.email}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed opacity-80"
                    />
                  </div>

                  {/* Farm Location Field */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2z" />
                      </svg>
                      {S.farmLocation}
                    </label>
                    <input
                      type="text"
                      name="farmLocation"
                      value={formData.farmLocation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11">
                      {saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : S.saveProfile}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* App Preferences */}
            <Card className="mb-6 bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
                    <svg className="w-6 h-6 text-secondary-foreground" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.62l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.48.1.62l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.62l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.48-.1-.62l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle>{S.prefsCardTitle}</CardTitle>
                    <CardDescription>{S.prefsCardDesc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language Setting */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h4v-2h-4v2zm0-4h4v-2h-4v2zm0-4h4V7h-4v2z" />
                    </svg>
                    {S.language}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className={`px-4 py-2 rounded-lg transition-all font-medium ${
                        language === "en"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t.common.english}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("ar")}
                      className={`px-4 py-2 rounded-lg transition-all font-medium ${
                        language === "ar"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t.common.arabic}
                    </button>
                  </div>
                </div>

                {/* Units Setting */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
                    </svg>
                    {S.units}
                  </label>
                  <select
                    value={units}
                    onChange={(e) => handleUnitsChange(e.target.value)}
                    className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="metric">{S.metric}</option>
                    <option value="imperial">{S.imperial}</option>
                  </select>
                </div>

                {/* Theme Setting */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">{S.theme}</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium ${
                        !isDarkTheme
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-10c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zM13 2h-2v3h2V2zm0 15h-2v3h2v-3zM5 11H2v2h3v-2zm15 0h-3v2h3v-2z" />
                      </svg>
                      {S.light}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium ${
                        isDarkTheme
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21.64 13a1 1 0 00-1.05-.14 8 8 0 11-9.5-9.5 1 1 0 00.12-1.05A10 10 0 1021.64 13z" />
                      </svg>
                      {S.dark}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="mb-6 bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent">
                    <svg className="w-6 h-6 text-accent-foreground" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle>{S.notifCardTitle}</CardTitle>
                    <CardDescription>{S.notifCardDesc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Weather Alerts Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">{S.weatherAlerts}</p>
                    <p className="text-sm text-muted-foreground">{S.weatherAlertsDesc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.weatherAlerts}
                    onChange={() => handleNotificationChange("weatherAlerts")}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </div>

                {/* Irrigation Reminders Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">{S.irrigationReminders}</p>
                    <p className="text-sm text-muted-foreground">{S.irrigationRemindersDesc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.irrigationReminders}
                    onChange={() => handleNotificationChange("irrigationReminders")}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </div>

                {/* Market News Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">{S.marketNews}</p>
                    <p className="text-sm text-muted-foreground">{S.marketNewsDesc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.marketNews}
                    onChange={() => handleNotificationChange("marketNews")}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card className="mb-6 bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle>{S.helpCardTitle}</CardTitle>
                    <CardDescription>{S.helpCardDesc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-border h-11 bg-transparent">
                  <svg className="w-4 h-4 me-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  {S.userGuide}
                </Button>
                <Button variant="outline" className="w-full justify-start border-border h-11 bg-transparent">
                  <svg className="w-4 h-4 me-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  {S.reportProblem}
                </Button>
              </CardContent>
            </Card>

            {/* Logout */}
            <div className="pb-8">
              <Button 
                onClick={() => {
                  logout()
                  router.push('/')
                }}
                variant="destructive" 
                className="w-full h-11 font-semibold gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
                {t.common.logout}
              </Button>
            </div>
          </div>
        </main>
      </div>


    </div>
  )
}
