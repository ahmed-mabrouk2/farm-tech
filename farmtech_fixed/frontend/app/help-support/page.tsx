'use client'

import { useState } from 'react'
import Header from '@/components/header'
import SidebarNav from '@/components/sidebar-nav'
import { useLanguage } from '@/lib/language-context'

export default function HelpSupportPage() {
  const { t } = useLanguage()
  const L = t.helpSupport
  const [activeTab, setActiveTab] = useState('faq')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const faqs = L.faqs.map((faq: any, idx: number) => ({ id: idx + 1, ...faq }))


  const tutorials = L.tutorials.map((tutorial: any, idx: number) => ({ id: idx + 1, ...tutorial }))

  const supportChannels = [
    { icon: '💬', ...L.supportChannels[0] },
    { icon: '📧', ...L.supportChannels[1] },
    { icon: '📞', ...L.supportChannels[2] },
    { icon: '🌐', ...L.supportChannels[3] },
  ]

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background">
      <SidebarNav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{L.title}</h1>
            <p className="text-muted-foreground mt-2">{L.subtitle}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-border">
            {['faq', 'tutorials', 'support'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold transition border-b-2 ${
                  activeTab === tab
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'faq' && L.tabs.faq}
                {tab === 'tutorials' && L.tabs.tutorials}
                {tab === 'support' && L.tabs.support}
              </button>
            ))}
          </div>

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition"
                  >
                    <span className="font-semibold text-foreground text-start">{faq.question}</span>
                    <span className={`text-xl transition ${expandedFaq === faq.id ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-6 py-4 border-t border-border bg-accent/30">
                      <p className="text-foreground">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tutorials Tab */}
          {activeTab === 'tutorials' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{tutorial.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      tutorial.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                      tutorial.level === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {L.levels[tutorial.level as keyof typeof L.levels]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{L.durationLabel} {tutorial.duration}</p>
                  <button className="text-green-600 font-semibold text-sm hover:underline">
                    {L.watchNow}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Support Tab */}
          {activeTab === 'support' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {supportChannels.map((channel, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="text-4xl mb-3">{channel.icon}</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{channel.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{channel.description}</p>
                  <p className="text-sm text-green-600 font-semibold">{channel.available}</p>
                </div>
              ))}
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-green-900 mb-4">{L.quickLinksTitle}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: L.quickLinks[0], icon: '📖' },
                { title: L.quickLinks[1], icon: '⚙️' },
                { title: L.quickLinks[2], icon: '🟢' },
                { title: L.quickLinks[3], icon: '💭' },
              ].map((link, index) => (
                <button
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition text-start"
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-semibold text-green-900">{link.title}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
