'use client'

import { useState } from 'react'
import { sendContactMessage } from '@/lib/api'
import { useLanguage } from '@/lib/language-context'
import { CheckCircle2, Send } from 'lucide-react'

export function ContactForm() {
  const { dir, language } = useLanguage()
  const isAr = language === 'ar'
  
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      await sendContactMessage(formData)
      setStatus('success')
      setFormData({ name: '', email: '', message: '' })
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(isAr ? 'حدث خطأ أثناء الإرسال. حاول مرة أخرى.' : 'Error sending message. Try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/50 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {isAr ? 'تم إرسال رسالتك بنجاح' : 'Message sent successfully'}
        </h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {isAr ? 'سنتواصل معك في أقرب وقت ممكن.' : 'We will get back to you shortly.'}
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          {isAr ? 'إرسال رسالة أخرى' : 'Send another message'}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900" dir={dir}>
      <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
        {isAr ? 'تواصل معنا' : 'Contact Us'}
      </h3>
      
      {status === 'error' && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      <div className="mb-4 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {isAr ? 'الاسم' : 'Name'}
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            placeholder={isAr ? 'الاسم الكامل' : 'Full Name'}
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {isAr ? 'البريد الإلكتروني' : 'Email Address'}
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            placeholder="hello@example.com"
          />
        </div>
        <div>
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {isAr ? 'الرسالة' : 'Message'}
          </label>
          <textarea
            id="message"
            required
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            placeholder={isAr ? 'كيف يمكننا مساعدتك؟' : 'How can we help?'}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-70 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        {status === 'loading' ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'إرسال الرسالة' : 'Send Message')}
        <Send className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} />
      </button>
    </form>
  )
}
