'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'

interface WeatherData {
  temperature: number
  humidity: number
  wind_speed: number
  soil_temperature: number
  rain_probability_tomorrow: number
  rain_probability_3days: number
  condition: string
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,soil_temperature_0cm')
  url.searchParams.set('daily', 'precipitation_probability_max')
  url.searchParams.set('forecast_days', '4')
  url.searchParams.set('timezone', 'auto')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`)
  const data = await res.json()

  const temp          = data.current?.temperature_2m ?? null
  const humidity      = data.current?.relative_humidity_2m ?? null
  const wind          = data.current?.wind_speed_10m ?? null
  const soilTemp      = data.current?.soil_temperature_0cm ?? null
  const dailyProb: number[] = data.daily?.precipitation_probability_max ?? []
  const tomorrow = dailyProb[1] ?? 0
  const next3    = dailyProb.slice(1, 4).reduce((a: number, b: number) => Math.max(a, b), 0)

  const code = data.current?.weather_code ?? 0
  let condition = 'Clear'
  if (code >= 80)      condition = 'Rainy'
  else if (code >= 50) condition = 'Drizzle'
  else if (code >= 40) condition = 'Foggy'
  else if (code >= 30) condition = 'Overcast'
  else if (code >= 10) condition = 'Partly Cloudy'

  return {
    temperature: Math.round(temp ?? 0),
    humidity: Math.round(humidity ?? 0),
    wind_speed: Math.round(wind ?? 0),
    soil_temperature: Math.round(soilTemp ?? 0),
    rain_probability_tomorrow: Math.round(tomorrow),
    rain_probability_3days: Math.round(next3),
    condition,
  }
}

const CONDITION_ICONS: Record<string, string> = {
  Clear: '☀️',
  'Partly Cloudy': '⛅',
  Overcast: '☁️',
  Foggy: '🌫️',
  Drizzle: '🌦️',
  Rainy: '🌧️',
}

export default function WeatherWidget() {
  const { t, language } = useLanguage()
  const W = t.dashboard.weather

  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const defaultLat = 30.0444
    const defaultLon = 31.2357

    const load = (lat: number, lon: number) => {
      fetchWeather(lat, lon)
        .then(setWeather)
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude),
        ()    => load(defaultLat, defaultLon),
        { timeout: 5000 }
      )
    } else {
      load(defaultLat, defaultLon)
    }
  }, [])

  const conditionIcon = weather ? (CONDITION_ICONS[weather.condition] ?? '🌤️') : '🌤️'

  return (
    <div className="rounded-xl overflow-hidden shadow-lg border border-emerald-900/60 bg-[#0a2e1f] dark:bg-[#0a1f15] text-white">
      {/* Top header */}
      <div className="px-5 pt-5 pb-3 bg-gradient-to-r from-emerald-900/80 to-emerald-950/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{W.title}</h2>
              <p className="text-xs text-emerald-300/70">Open-Meteo · Live</p>
            </div>
          </div>
          {!loading && !error && weather && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              {language === 'ar' ? 'مناسب للمحاصيل ✓' : 'Optimal for Crops ✓'}
            </span>
          )}
        </div>

        {/* Big temp + condition */}
        <div className="flex items-end gap-4">
          <div>
            {loading
              ? <div className="h-16 w-28 bg-emerald-800/40 animate-pulse rounded-xl" />
              : <p className="text-6xl font-black tracking-tight text-white">
                  {error ? '--' : `${weather?.temperature}°`}
                </p>
            }
            <p className="text-sm text-emerald-300/80 mt-1">
              {loading ? '…' : error ? 'Unavailable' : weather?.condition}
            </p>
          </div>
          <div className="text-5xl mb-1 ms-auto">
            {loading ? '🌤️' : conditionIcon}
          </div>
        </div>
      </div>

      {/* 4-metric grid */}
      <div className="grid grid-cols-2 gap-px bg-emerald-900/40 border-t border-emerald-900/60">
        {[
          {
            icon: '🌡️',
            label: language === 'ar' ? 'حرارة التربة' : 'Soil Temp',
            value: loading ? '…' : error ? '--' : `${weather?.soil_temperature}°C`,
          },
          {
            icon: '💨',
            label: language === 'ar' ? 'سرعة الرياح' : 'Wind',
            value: loading ? '…' : error ? '--' : `${weather?.wind_speed} km/h`,
          },
          {
            icon: '💧',
            label: W.humidity,
            value: loading ? '…' : error ? '--' : `${weather?.humidity}%`,
          },
          {
            icon: '🌧️',
            label: W.tomorrow,
            value: loading ? '…' : error ? '--' : `${weather?.rain_probability_tomorrow}%`,
          },
        ].map((m) => (
          <div key={m.label} className="bg-emerald-950/60 px-4 py-3 flex items-center gap-2.5">
            <span className="text-lg">{m.icon}</span>
            <div>
              <p className="text-[11px] text-emerald-400/70 font-medium">{m.label}</p>
              {loading
                ? <div className="h-4 w-12 bg-emerald-800/40 animate-pulse rounded mt-0.5" />
                : <p className="text-sm font-bold text-white">{m.value}</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Rain forecast bars */}
      <div className="px-5 py-4 border-t border-emerald-900/60 bg-emerald-950/40">
        <p className="text-xs font-semibold text-emerald-300/80 mb-3 uppercase tracking-wider">{W.rainForecast}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-emerald-300/70 w-24 shrink-0">{W.tomorrow}</span>
            <div className="flex-1 bg-emerald-900/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-sky-400 transition-all duration-700"
                style={{ width: loading ? '0%' : `${weather?.rain_probability_tomorrow ?? 0}%` }}
              />
            </div>
            <span className="text-xs font-bold text-sky-300 w-9 text-end">
              {loading ? '…' : `${weather?.rain_probability_tomorrow ?? 0}%`}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-emerald-300/70 w-24 shrink-0">{W.next3Days}</span>
            <div className="flex-1 bg-emerald-900/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-sky-400 transition-all duration-700"
                style={{ width: loading ? '0%' : `${weather?.rain_probability_3days ?? 0}%` }}
              />
            </div>
            <span className="text-xs font-bold text-sky-300 w-9 text-end">
              {loading ? '…' : `${weather?.rain_probability_3days ?? 0}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
