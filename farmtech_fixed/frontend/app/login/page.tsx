'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import Link from 'next/link'
import { LanguageToggle } from '@/components/language-toggle'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, isAuthenticated } = useAuth()
  const { t } = useLanguage()
  const LP = t.loginPage
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError(t.login.emailRequired)
      return
    }
    if (!password) {
      setError(t.login.passwordRequired)
      return
    }

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError(t.login.invalidCredentials)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 dark:from-slate-950 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-emerald-200 dark:border-emerald-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold">🌾</span>
            </div>
            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">FarmTec</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Login Section */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 shadow-lg">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{LP.signInTitle}</h1>
              <p className="text-slate-600 dark:text-slate-400">{LP.signInSubtitle}</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5 mb-8">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  {t.login.email}
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 ps-12 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-emerald-400/50 dark:focus:border-emerald-400 transition-all"
                    placeholder="farmer@example.com"
                  />
                  <svg className="w-5 h-5 text-emerald-500 absolute start-4 top-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  {t.login.password}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 ps-12 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-emerald-400/50 dark:focus:border-emerald-400 transition-all"
                    placeholder="••••••••"
                  />
                  <svg className="w-5 h-5 text-emerald-500 absolute start-4 top-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 dark:accent-emerald-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{t.login.rememberMe}</span>
                </label>
                <a href="#" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors">
                  {t.login.forgotPassword}
                </a>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 hover:shadow-lg hover:shadow-emerald-500/30 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? LP.loading : t.login.loginButton}
              </button>
            </form>


            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                {t.login.signupLink}{' '}
                <Link
                  href="/register"
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold transition-colors"
                >
                  {LP.newAccountLink}
                </Link>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">{LP.termsNotice}</p>
            </div>
            </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        type="button"
        aria-label={t.landing.chatAria}
        className="fixed bottom-8 end-8 w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg hover:scale-110 transition-all flex items-center justify-center z-40 hover:bg-emerald-700"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
        </svg>
      </button>
    </div>
  )
}
