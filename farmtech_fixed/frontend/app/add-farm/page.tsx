"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SidebarNav from "@/components/sidebar-nav"
import Header from "@/components/header"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"
import { apiFetch, API } from "@/lib/api"

interface Location {
  latitude: number
  longitude: number
  accuracy: number
}



export default function AddFarmPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { t } = useLanguage()
  const L = t.addFarm
  const [formData, setFormData] = useState({
    name: "",
    crop: "",
    area: "",
    sowingDate: "",
  })

  const getLocation = () => {
    setLoading(true)
    setError("")

    if (!navigator.geolocation) {
      setError(L.errNoGeo)
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setLoading(false)
      },
      (err) => {
        setError(
          err.code === 1
            ? L.errDenied
            : L.errFailed
        )
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!location) {
      setError(L.errNeedGps)
      return
    }
    if (!formData.name || !formData.crop || !formData.area || !formData.sowingDate) {
      setError(L.errFillAll)
      return
    }

    setLoading(true)
    setError("")

    try {
      // 1. Create Farm
      const farmRes = await apiFetch(API.farms, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          location: "Added from GPS",
          latitude: location.latitude.toFixed(6),
          longitude: location.longitude.toFixed(6),
          climate_zone: "Temperate",
          soil_type: "Loamy"
        })
      })

      if (!farmRes.ok) throw new Error("Failed to create farm")
      const farm = await farmRes.json()

      // Calculate harvest date
      const sowDate = new Date(formData.sowingDate)
      const harvestDate = new Date(sowDate.getTime() + 120 * 24 * 60 * 60 * 1000)
      const harvestDateStr = harvestDate.toISOString().split('T')[0]

      // 2. Create Plot
      await apiFetch(API.plots, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farm: farm.id,
          name: `${formData.crop} Plot`,
          crop_type: formData.crop,
          area: parseFloat(formData.area),
          moisture: 50.0,
          harvest_date: harvestDateStr,
          status: "healthy",
          latitude: location.latitude.toFixed(6),
          longitude: location.longitude.toFixed(6)
        })
      })

      // 3. Create CropField (for map)
      const cropTypeLower = formData.crop.toLowerCase().split(' ')[0]
      await apiFetch(API.fields, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('farmtec-token')}`
        },
        body: JSON.stringify({
          farm: farm.id,
          crop_type: ['wheat', 'corn', 'rice', 'barley', 'soybeans', 'cotton', 'sugarcane'].includes(cropTypeLower) ? cropTypeLower : 'other',
          latitude: location.latitude.toFixed(6),
          longitude: location.longitude.toFixed(6),
          area: parseFloat(formData.area),
          color: "#4caf50",
          soil_type: "Loamy",
          ndvi: 0.65,
          soil_moisture: 50.0,
          temperature: 25.0,
          humidity: 60.0
        })
      })

      router.push("/my-farm")
    } catch (err: any) {
      setError(err.message || "Failed to save farm")
      setLoading(false)
    }
  }

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background text-foreground">
      <SidebarNav isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">{L.title}</h1>
              <p className="text-muted-foreground">{L.subtitle}</p>
            </div>

            {/* GPS Location Card */}
            <Card className="mb-6 bg-card border-border">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z" />
                  </svg>
                  {L.gpsTitle}
                </CardTitle>
                <CardDescription>{L.gpsDesc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* GPS Button */}
                  <button
                    onClick={getLocation}
                    disabled={loading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:from-primary/50 disabled:to-accent/50 text-white rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {L.gettingLoc}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-12C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                        </svg>
                        {L.detectBtn}
                      </>
                    )}
                  </button>

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-700 dark:text-red-400 text-sm flex gap-2">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Location Display */}
                  {location && (
                    <div className="p-4 bg-accent/5 border border-accent/30 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground mb-3">{L.locDetected}</p>
                          <div className="space-y-2 text-sm">
                            <p className="text-muted-foreground">
                              {L.latitude} <span className="font-mono font-semibold text-foreground ms-1">{location.latitude.toFixed(6)}</span>
                            </p>
                            <p className="text-muted-foreground">
                              {L.longitude} <span className="font-mono font-semibold text-foreground ms-1">{location.longitude.toFixed(6)}</span>
                            </p>
                            <p className="text-muted-foreground">
                              {L.accuracy} <span className="font-semibold text-foreground ms-1">{Math.round(location.accuracy)} {L.meters}</span>
                            </p>
                          </div>
                        </div>
                        <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Farm Details Form */}
            <Card className="bg-card border-border">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                <CardTitle>{L.formTitle}</CardTitle>
                <CardDescription>{L.formDesc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Farm Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-semibold">
                      {L.farmName}
                    </Label>
                    <Input
                      id="name"
                      placeholder={L.namePlaceholder}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="border-border focus:ring-primary/50 focus:border-primary"
                    />
                  </div>

                  {/* Crop Type */}
                  <div className="space-y-2">
                    <Label htmlFor="crop" className="text-foreground font-semibold">
                      {L.primaryCrop}
                    </Label>
                    <Select value={formData.crop} onValueChange={(value) => setFormData({ ...formData, crop: value })}>
                      <SelectTrigger className="border-border focus:ring-primary/50 focus:border-primary text-start">
                        <SelectValue placeholder={L.cropPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {L.crops.map((crop: string) => (
                          <SelectItem key={crop} value={crop}>
                            {crop}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Area */}
                  <div className="space-y-2">
                    <Label htmlFor="area" className="text-foreground font-semibold">
                      {L.farmArea}
                    </Label>
                    <Input
                      id="area"
                      type="number"
                      placeholder={L.areaPlaceholder}
                      step="0.1"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="border-border focus:ring-primary/50 focus:border-primary"
                    />
                  </div>

                  {/* Sowing Date */}
                  <div className="space-y-2">
                    <Label htmlFor="sowingDate" className="text-foreground font-semibold">
                      {L.sowingDate}
                    </Label>
                    <Input
                      id="sowingDate"
                      type="date"
                      value={formData.sowingDate}
                      onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                      className="border-border focus:ring-primary/50 focus:border-primary"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={!location}
                      className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white h-11 font-semibold"
                    >
                      {L.addBtn}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="flex-1 border-border hover:bg-muted text-foreground h-11"
                    >
                      {L.cancelBtn}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-accent/5 border border-accent/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground me-1">ℹ️ {L.tip}</span> {L.tipText}
              </p>
            </div>
          </div>
        </main>
      </div>


    </div>
  )
}
