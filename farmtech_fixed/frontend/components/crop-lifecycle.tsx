'use client'

import { useLanguage } from '@/lib/language-context'

interface LifecycleData {
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
}

interface Props {
  data: LifecycleData | null
  loading: boolean
}

const CROP_ICONS: Record<string, string> = {
  wheat: '🌾',
  corn: '🌽',
  rice: '🌿',
  cotton: '🌸',
  barley: '🌾',
  soybeans: '🫘',
  sugarcane: '🎍',
  other: '🌱',
}

const STAGES = ['Germination', 'Seedling', 'Vegetative', 'Flowering', 'Grain Filling', 'Ripening']

export default function CropLifecycle({ data, loading }: Props) {
  const { t, language } = useLanguage()
  const isAr = language === 'ar'

  const stageIndex = data ? STAGES.indexOf(data.stage) : -1
  const cropIcon = data ? (CROP_ICONS[data.crop_type.toLowerCase()] ?? '🌱') : '🌱'

  const healthColor =
    !data ? 'text-muted-foreground' :
    data.health_score >= 80 ? 'text-emerald-500' :
    data.health_score >= 60 ? 'text-amber-500' : 'text-red-500'

  const barColor =
    !data ? 'bg-muted' :
    data.progress_pct < 30 ? 'bg-gradient-to-r from-blue-400 to-sky-500' :
    data.progress_pct < 70 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
    'bg-gradient-to-r from-amber-400 to-orange-500'

  return (
    <div className="rounded-xl overflow-hidden border border-emerald-900/60 bg-[#0a2e1f] dark:bg-[#0a1f15] p-5 shadow-lg flex flex-col gap-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2 text-white">
          <span className="text-xl">🌱</span>
          {isAr ? 'دورة حياة المحصول' : 'Crop Lifecycle'}
        </h2>
        {data && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            data.status === 'healthy'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}>
            {data.status === 'healthy'
              ? (isAr ? '✓ سليم' : '✓ Healthy')
              : (isAr ? '⚠ تنبيه' : '⚠ Alert')}
          </span>
        )}
      </div>

      {/* Crop identity */}
      {loading ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-900/40 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-emerald-900/40 rounded animate-pulse w-1/2" />
            <div className="h-3 bg-emerald-900/40 rounded animate-pulse w-1/3" />
          </div>
        </div>
      ) : data ? (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-sm">
            {cropIcon}
          </div>
          <div>
            <p className="text-lg font-bold text-white capitalize">{data.crop_type}</p>
            <p className="text-xs text-emerald-400/70">{data.plot_name}</p>
          </div>
          <div className="ms-auto text-end">
            <p className={`text-2xl font-black ${healthColor}`}>{data.health_score}%</p>
            <p className="text-xs text-emerald-400/70">{isAr ? 'صحة المحصول' : 'Health'}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-emerald-400/70 text-center py-4">
          {isAr ? 'لا توجد قطع زراعية حتى الآن' : 'No active plots yet'}
        </p>
      )}

      {/* Growth Progress Bar */}
      {data && (
        <>
          <div>
            <div className="flex justify-between text-xs text-emerald-400/70 mb-1.5">
              <span>{isAr ? `يوم ${data.days_growing}` : `Day ${data.days_growing}`}</span>
              <span className="font-semibold text-white">{data.stage}</span>
              <span>{isAr ? `${data.total_days} يوم` : `${data.total_days}d total`}</span>
            </div>
            <div className="w-full bg-emerald-900/60 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${data.progress_pct}%` }}
              />
            </div>
          </div>

          {/* Stage Timeline Dots */}
          <div className="flex items-center justify-between gap-1">
            {STAGES.map((s, i) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={`w-2.5 h-2.5 rounded-full border-2 transition-colors ${
                  i < stageIndex
                    ? 'bg-emerald-400 border-emerald-400'
                    : i === stageIndex
                      ? 'bg-emerald-500 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-emerald-900/40 border-emerald-900/60'
                }`} />
                {i < STAGES.length - 1 && (
                  <div className="hidden" />
                )}
              </div>
            ))}
          </div>

          {/* Harvest Countdown */}
          <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-400/70">{isAr ? 'الحصاد المتوقع' : 'Est. Harvest'}</p>
              <p className="text-sm font-bold text-white">{data.harvest_date}</p>
            </div>
            <div className="text-end">
              <p className="text-2xl font-black text-emerald-300">{data.days_until_harvest}</p>
              <p className="text-xs text-emerald-400/70">{isAr ? 'يوم متبقي' : 'days left'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
