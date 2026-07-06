'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import SidebarNav from '@/components/sidebar-nav'
import { useLanguage } from '@/lib/language-context'
import { useAuth } from '@/lib/auth-context'
import { apiFetch, API } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { t, language } = useLanguage()
  const { user } = useAuth()

  const P = t.profilePage
  const Sp = t.settingsPage

  const [farms, setFarms] = useState<any[]>([])
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFarmMetadata() {
      try {
        const [farmsRes, fieldsRes] = await Promise.all([
          apiFetch(API.farms),
          apiFetch(API.fields)
        ])
        if (farmsRes.ok && fieldsRes.ok) {
          const farmsData = await farmsRes.json()
          const fieldsData = await fieldsRes.json()
          
          setFarms(Array.isArray(farmsData) ? farmsData : farmsData.results ?? [])
          setFields(Array.isArray(fieldsData) ? fieldsData : fieldsData.results ?? [])
        }
      } catch (e) {
        console.error("Failed to load profile farm details:", e)
      } finally {
        setLoading(false)
      }
    }
    loadFarmMetadata()
  }, [])

  const safeUser = user as Record<string, any>
  
  // Dynamic farm details derivation
  const primaryFarm = farms[0]
  const farmName = primaryFarm ? primaryFarm.name : (language === 'ar' ? 'مزرعة افتراضية' : 'Demo Farm')
  const location = primaryFarm ? primaryFarm.location : (language === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt')
  
  const totalSize = fields.reduce((acc, f) => acc + (f.area || 0), 0)
  const farmSize = totalSize > 0 ? `${totalSize.toFixed(1)} ${language === 'ar' ? 'فدان' : 'acres'}` : '11.2 ac'
  
  const cropSet = new Set<string>(fields.map(f => f.crop_type).filter(Boolean))
  const crops = cropSet.size > 0 ? Array.from(cropSet) : ['Wheat', 'Rice', 'Maize']

  const dateJoinedStr = safeUser?.date_joined
    ? new Date(safeUser.date_joined).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '--'

  const profile = {
    name: safeUser?.username || '',
    email: safeUser?.email || '',
    phone: safeUser?.phone_number || '',
    farmName,
    location,
    farmSize,
    crops,
    joinDate: dateJoinedStr,
  }

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background text-foreground">
      <SidebarNav isOpen={true} onToggle={() => {}} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header />

        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">{P.title}</h1>
              <p className="text-muted-foreground mt-2">{P.subtitle}</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 bg-card border border-border rounded-lg shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Profile Header */}
                <div className="bg-card border border-border rounded-lg p-8 mb-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-3xl font-bold text-white uppercase shrink-0">
                        {(profile.name || 'U').charAt(0)}
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold text-foreground capitalize">{profile.name}</h2>
                        <p className="text-muted-foreground text-sm font-semibold mt-1">📍 {profile.farmName}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {P.memberSince} {profile.joinDate}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/settings"
                      className="px-5 py-2.5 bg-primary text-primary-foreground text-center rounded-lg font-semibold hover:bg-primary/95 transition shadow-sm"
                    >
                      {P.editProfile}
                    </Link>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4 border-b border-border pb-2">
                    {P.personalInfo}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">{Sp.fullName}</label>
                      <input type="text" value={profile.name} disabled className="w-full px-4 py-2 border border-border rounded-lg bg-input capitalize font-medium cursor-not-allowed" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">{Sp.email}</label>
                        <input type="email" value={profile.email} disabled className="w-full px-4 py-2 border border-border rounded-lg bg-input cursor-not-allowed text-muted-foreground" />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">{Sp.phone}</label>
                        <input type="tel" value={profile.phone || '--'} disabled className="w-full px-4 py-2 border border-border rounded-lg bg-input cursor-not-allowed font-medium text-foreground" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Farm Information */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4 border-b border-border pb-2">
                    {P.farmInfo}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">{P.farmName}</label>
                      <input type="text" value={profile.farmName} disabled className="w-full px-4 py-2 border border-border rounded-lg bg-input cursor-not-allowed font-medium text-foreground" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">{P.location}</label>
                        <input type="text" value={profile.location} disabled className="w-full px-4 py-2 border border-border rounded-lg bg-input cursor-not-allowed font-medium text-foreground" />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">{P.farmSize}</label>
                        <input type="text" value={profile.farmSize} disabled className="w-full px-4 py-2 border border-border rounded-lg bg-input cursor-not-allowed font-medium text-foreground" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">{P.crops}</label>
                      <div className="flex flex-wrap gap-2">
                        {profile.crops.map((crop: string) => (
                          <span key={crop} className="px-3 py-1 bg-green-500/10 text-green-600 border border-green-500/25 rounded-full text-xs font-bold capitalize">
                            🌱 {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-red-600 mb-4">{P.dangerZone}</h3>
                  <button
                    type="button"
                    className="px-4 py-2 border border-red-500/30 text-red-500 rounded-lg font-semibold hover:bg-red-500/20 transition cursor-pointer"
                  >
                    {P.deleteAccount}
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}