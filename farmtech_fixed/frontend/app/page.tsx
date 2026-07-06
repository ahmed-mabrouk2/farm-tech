'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import { fetchPublicStats, fetchTestimonials } from '@/lib/api'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { ContactForm } from '@/components/contact-form'
import {
  BarChart3,
  Bell,
  Brain,
  CheckCircle2,
  ChevronDown,
  CloudSun,
  Droplets,
  LayoutDashboard,
  Leaf,
  Lock,
  MapPin,
  Server,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { t, dir } = useLanguage()
  const L = t.landing
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0)
  const [stats, setStats] = useState<any>(null)
  const [testimonialsList, setTestimonialsList] = useState<any[]>(L.testimonials)

  useEffect(() => {
    fetchPublicStats().then(setStats).catch(() => {})
    fetchTestimonials().then(data => {
      if (data && data.length > 0) setTestimonialsList(data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  const statIcons = [Users, Sparkles, MapPin, Leaf]
  const featureIcons = [MapPin, BarChart3, Brain, Droplets]
  const pillarIcons = [Zap, Target, CheckCircle2]
  const platformIcons = [LayoutDashboard, Brain, CloudSun, Bell, TrendingUp]
  const securityIcons = [Lock, Shield, Server]

  const heroAlign = dir === 'rtl' ? 'text-center lg:text-right' : 'text-center lg:text-left'
  const heroCtaRow = dir === 'rtl' ? 'sm:flex-row-reverse sm:justify-start lg:justify-end' : 'sm:flex-row sm:justify-start lg:justify-start'
  const sectionTextAlign = dir === 'rtl' ? 'md:text-right' : 'md:text-left'
  const platformCardText = dir === 'rtl' ? 'text-right' : 'text-left'
  const footerAlign = dir === 'rtl' ? 'md:text-right md:justify-start' : 'md:text-left md:justify-start'
  const testimonialFooter = dir === 'rtl' ? 'text-right' : 'text-left'
  const faqBtn = dir === 'rtl' ? 'text-right' : 'text-left'
  const ctaEndRow = dir === 'rtl' ? 'sm:flex-row-reverse' : 'sm:flex-row'

  return (
    <div dir={dir} className="min-h-dvh bg-[#fafbf8] text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Subtle top gradient */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-96 bg-gradient-to-b from-emerald-100/80 via-transparent to-transparent dark:from-emerald-950/40" aria-hidden />

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-emerald-200/80 bg-white/75 backdrop-blur-md dark:border-emerald-900/50 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 shadow-md shadow-emerald-600/20">
              <Leaf className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight text-emerald-800 dark:text-emerald-400">FarmTec</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {L.brandTagline}
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-6 lg:gap-8 xl:gap-10 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
            >
              {L.navFeatures}
            </a>
            <a
              href="#how"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
            >
              {L.navHow}
            </a>
            <a
              href="#why"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
            >
              {L.navWhy}
            </a>
            <a
              href="#platform"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
            >
              {L.navPlatform}
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
            >
              {L.navTestimonials}
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
            >
              {L.navFaq}
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-slate-800"
            >
              {L.login}
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-l from-emerald-600 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-green-700 hover:shadow-lg dark:shadow-emerald-900/40"
            >
              {L.signup}
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pb-28 lg:pt-32">
        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
            <div className={heroAlign}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {L.heroBadge}
              </div>

              <h1 className="mb-6 text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1] dark:text-white">
                {L.heroTitle1}
                <span className="mt-2 block bg-gradient-to-l from-emerald-600 to-green-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-green-400">
                  {L.heroTitle2}
                </span>
              </h1>

              <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0 lg:max-w-lg dark:text-slate-400">
                {L.heroDesc}
              </p>

              <div className={`flex flex-col items-stretch justify-center gap-3 sm:items-center ${heroCtaRow}`}>
                <Link
                  href="/register"
                  className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-full bg-slate-900 px-8 text-sm font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {L.ctaStart}
                </Link>
                <a
                  href="#platform"
                  className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-800 transition-all hover:border-emerald-300 hover:bg-emerald-50/80 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-700"
                >
                  {L.ctaPreview}
                </a>
              </div>

              <p className="mt-6 text-sm text-slate-500 dark:text-slate-500">{L.heroFootnote}</p>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-400/20 via-green-400/10 to-transparent blur-2xl dark:from-emerald-500/10" aria-hidden />
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{L.previewTitle}</span>
                  <div className="w-14" />
                </div>
                <div className="flex gap-0">
                  <div className="hidden w-14 shrink-0 border-l border-slate-100 bg-slate-50/50 py-4 dark:border-slate-800 dark:bg-slate-800/30 sm:block">
                    <div className="mx-auto mb-2 h-8 w-8 rounded-lg bg-emerald-600/15" />
                    <div className="mx-auto space-y-2 px-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                        {L.previewChip1}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {L.previewChip2}
                      </span>
                    </div>
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      {[
                        { h: 'h-16', c: 'from-emerald-500/80 to-emerald-600' },
                        { h: 'h-24', c: 'from-green-500/80 to-green-600' },
                        { h: 'h-20', c: 'from-teal-500/80 to-teal-600' },
                      ].map((bar, i) => (
                        <div
                          key={i}
                          className={`flex flex-col justify-end rounded-xl bg-gradient-to-t ${bar.c} ${bar.h} opacity-90`}
                        />
                      ))}
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{L.recToday}</span>
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{L.recText}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-emerald-100/80 bg-white/60 px-4 py-14 backdrop-blur-sm dark:border-emerald-900/30 dark:bg-slate-900/40 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {(stats ? [
            `${stats.active_farmers}+`, 
            `${stats.accuracy_rate}%`, 
            `${stats.monitored_crops}+`, 
            `${stats.water_saved}%`
          ] : L.statNumbers).map((number, idx) => {
            const Icon = statIcons[idx]
            return (
              <div
                key={idx}
                className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 p-6 text-center shadow-sm transition-all hover:border-emerald-200 hover:shadow-md dark:border-emerald-900/40 dark:from-slate-900 dark:to-emerald-950/20 dark:hover:border-emerald-800"
              >
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 transition-colors group-hover:bg-emerald-600/15 dark:text-emerald-400">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-3xl">{number}</div>
                <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">{L.statLabels[idx]}</div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="border-b border-emerald-100/60 bg-white/40 px-4 py-10 dark:border-emerald-900/25 dark:bg-slate-900/30 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
            {L.trustTitle}
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {L.trustStrip.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200/80 bg-white px-6 py-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="font-bold text-slate-900 dark:text-white">{item.label}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center lg:mb-16">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500">{L.featuresKicker}</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{L.featuresTitle}</h2>
            <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-400">{L.featuresDesc}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            {L.featureCards.map((feature, idx) => {
              const Icon = featureIcons[idx]
              return (
                <div
                  key={feature.title}
                  className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all hover:border-emerald-200/80 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-emerald-900"
                >
                  <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/5 dark:bg-emerald-400/5" aria-hidden />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <h3 className="relative mt-5 text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="relative mt-2 leading-relaxed text-slate-600 dark:text-slate-400">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="why" className="scroll-mt-24 border-y border-slate-200/60 bg-white px-4 py-20 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center lg:mb-16">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500">{L.whyKicker}</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{L.whyTitle}</h2>
            <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-400">{L.whyDesc}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {L.pillars.map((p, idx) => {
              const Icon = pillarIcons[idx]
              return (
                <div
                  key={p.title}
                  className={`relative rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-8 text-center shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80 ${sectionTextAlign}`}
                >
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 md:mx-0">
                    <Icon className="h-7 w-7" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{p.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-24 border-y border-emerald-100/60 bg-emerald-50/40 px-4 py-20 dark:border-emerald-900/20 dark:bg-emerald-950/20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center lg:mb-16">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500">{L.howKicker}</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{L.howTitle}</h2>
            <p className="text-slate-600 dark:text-slate-400">{L.howDesc}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
            {L.howSteps.map((item, idx) => (
              <div
                key={item.title}
                className="flex flex-col rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md dark:border-emerald-900/50 dark:bg-slate-900"
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-green-600 text-sm font-bold text-white shadow-md">
                  {idx + 1}
                </div>
                <h3 className="mt-4 font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center lg:mb-16">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500">{L.platformKicker}</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{L.platformTitle}</h2>
            <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-400">{L.platformDesc}</p>
          </div>
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {L.platformCards.map((item, idx) => {
              const Icon = platformIcons[idx]
              return (
                <div
                  key={item.title}
                  className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900 ${
                    item.wide ? 'sm:col-span-2 lg:col-span-2 lg:min-h-[200px] lg:flex-row lg:items-center lg:gap-8 lg:p-8' : ''
                  }`}
                >
                  <div className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 lg:mb-0">
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div className={platformCardText}>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-slate-900 px-4 py-12 text-white dark:border-slate-800 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row md:gap-6">
          <div className={`text-center ${sectionTextAlign}`}>
            <h2 className="text-lg font-bold">{L.securityTitle}</h2>
            <p className="mt-1 max-w-md text-sm text-slate-400">{L.securityDesc}</p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center md:justify-end">
            {L.securityItems.map((text, idx) => {
              const Icon = securityIcons[idx]
              return (
                <div
                  key={text}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
                >
                  <Icon className="h-5 w-5 shrink-0 text-emerald-400" strokeWidth={2} />
                  <span className="text-sm font-medium text-slate-200">{text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="testimonials" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center lg:mb-16">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500">{L.testimonialsKicker}</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{L.testimonialsTitle}</h2>
            <p className="text-slate-600 dark:text-slate-400">{L.testimonialsDesc}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {testimonialsList.map((test, idx) => (
              <blockquote
                key={test.name || idx}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-4 flex gap-0.5 text-amber-400">
                  {Array.from({ length: test.rating || 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" aria-hidden />
                  ))}
                </div>
                <p className="flex-1 text-base leading-relaxed text-slate-700 dark:text-slate-300">&ldquo;{test.quote}&rdquo;</p>
                <footer className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-green-700 text-sm font-bold text-white">
                    {test.initials || test.name?.charAt(0) || '?'}
                  </div>
                  <div className={testimonialFooter}>
                    <cite className="not-italic font-bold text-slate-900 dark:text-white">{test.name}</cite>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {test.role} {test.location ? `· ${test.location}` : ''}
                    </p>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 bg-slate-100/50 px-4 py-20 dark:bg-slate-900/50 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500">{L.faqKicker}</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{L.faqTitle}</h2>
          </div>
          <div className="space-y-3">
            {L.faqs.map((faq, idx) => (
              <div
                key={faq.q}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => setActiveAccordion(activeAccordion === idx ? null : idx)}
                  className="flex w-full items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  aria-expanded={activeAccordion === idx}
                >
                  <span className={`min-w-0 flex-1 font-semibold text-slate-900 dark:text-white ${faqBtn}`}>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-emerald-600 transition-transform dark:text-emerald-500 ${activeAccordion === idx ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {activeAccordion === idx && (
                  <div className={`border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400 ${faqBtn}`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-700 px-8 py-14 text-center shadow-2xl shadow-emerald-900/20 sm:px-12 lg:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-90" aria-hidden />
          <h2 className="relative text-2xl font-bold text-white sm:text-3xl lg:text-4xl">{L.ctaEndTitle}</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-emerald-100">{L.ctaEndDesc}</p>
          <div className={`relative mt-8 flex flex-col items-center justify-center gap-3 ${ctaEndRow}`}>
            <Link
              href="/register"
              className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full bg-white px-8 text-sm font-bold text-emerald-700 transition-transform hover:scale-[1.02] hover:bg-emerald-50"
            >
              {L.signup}
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full border-2 border-white/40 bg-transparent px-8 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {L.login}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-50/50 px-4 py-16 dark:bg-slate-900/50 sm:px-6 lg:px-8">
        <ContactForm />
      </section>

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-400 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            <div className={`text-center ${footerAlign}`}>
              <div className="mb-4 flex items-center justify-center gap-2 md:justify-start">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">FarmTec</span>
              </div>
              <p className="text-sm leading-relaxed">{L.footerTagline}</p>
            </div>
            <div className={`text-center ${footerAlign}`}>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">{L.footerQuick}</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="transition-colors hover:text-white">
                    {L.navFeatures}
                  </a>
                </li>
                <li>
                  <a href="#why" className="transition-colors hover:text-white">
                    {L.navWhy}
                  </a>
                </li>
                <li>
                  <a href="#platform" className="transition-colors hover:text-white">
                    {L.navPlatform}
                  </a>
                </li>
                <li>
                  <Link href="/login" className="transition-colors hover:text-white">
                    {L.login}
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="transition-colors hover:text-white">
                    {L.signup}
                  </Link>
                </li>
              </ul>
            </div>
            <div className={`text-center ${footerAlign}`}>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">{L.footerContact}</p>
              <p className="text-sm">info@farmtec.com</p>
              <p className="mt-1 text-sm">{L.footerCountry}</p>
            </div>
          </div>
          <div className={`mt-12 border-t border-slate-800 pt-8 text-center text-xs text-slate-500 ${footerAlign}`}>
            © {new Date().getFullYear()} FarmTec. {L.footerRights}
          </div>
        </div>
      </footer>

    </div>
  )
}
