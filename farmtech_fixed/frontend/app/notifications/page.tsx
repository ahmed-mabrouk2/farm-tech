'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import SidebarNav from '@/components/sidebar-nav'
import { useLanguage } from '@/lib/language-context'
import { apiFetch, API } from '@/lib/api'

interface CropFieldRecord {
  id: number
  name: string
  crop_type: string
}

export default function NotificationsPage() {
  const { t, language } = useLanguage()
  const L = t.notifications
  const [notifications, setNotifications] = useState<any[]>([])
  const [fields, setFields] = useState<CropFieldRecord[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all')
  const [currentFilter, setCurrentFilter] = useState<string>('All')

  // Load notifications from API
  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(API.notifications)
        if (res.ok) {
          const data = await res.json()
          const list = Array.isArray(data) ? data : data.results ?? []
          setNotifications(list.map((n: any) => ({
            id: n.id,
            type: n.notification_type || n.type || 'alert',
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleString(),
            read: n.read_status !== undefined ? n.read_status : n.read,
            fieldId: n.related_entity_id
          })))
        }
      } catch(e) {
        console.error("Failed to load notifications:", e)
      }
    }

    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [language])

  // Load user farm fields from API
  useEffect(() => {
    async function loadFields() {
      try {
        const res = await apiFetch(API.fields)
        if (res.ok) {
          const data = await res.json()
          const list = Array.isArray(data) ? data : data.results ?? []
          setFields(list)
        }
      } catch (e) {
        console.error("Failed to load fields for notification filter:", e)
      }
    }
    loadFields()
  }, [])

  const handleMarkAsRead = async (id: number) => {
    // Optimistic update
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))

    // Sync to localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('farmtec-notifications')
        if (saved) {
          const list = JSON.parse(saved)
          const updated = list.map((n: any) => n.id === id ? { ...n, read: true } : n)
          localStorage.setItem('farmtec-notifications', JSON.stringify(updated))
          window.dispatchEvent(new Event('farmtec-notifications-updated'))
        }
      } catch (e) {
        console.error(e)
      }
    }

    try {
      await apiFetch(`${API.notifications}${id}/mark_read/`, { method: 'POST' })
    } catch (e) {}
  }

  const handleDelete = async (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id))

    // Sync to localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('farmtec-notifications')
        if (saved) {
          const list = JSON.parse(saved)
          const updated = list.filter((n: any) => n.id !== id)
          localStorage.setItem('farmtec-notifications', JSON.stringify(updated))
          window.dispatchEvent(new Event('farmtec-notifications-updated'))
        }
      } catch (e) {
        console.error(e)
      }
    }

    try {
      await apiFetch(`${API.notifications}${id}/`, { method: 'DELETE' })
    } catch (e) {}
  }

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    setNotifications(notifications.map(n => ({ ...n, read: true })))

    // Sync to localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('farmtec-notifications')
        if (saved) {
          const list = JSON.parse(saved)
          const updated = list.map((n: any) => ({ ...n, read: true }))
          localStorage.setItem('farmtec-notifications', JSON.stringify(updated))
          window.dispatchEvent(new Event('farmtec-notifications-updated'))
        }
      } catch (e) {
        console.error(e)
      }
    }

    try {
      await apiFetch(API.notifications, { method: 'PATCH' })
    } catch (e) {
      console.error("Failed to mark all as read:", e)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return '⚠️'
      case 'task':
        return '✓'
      case 'disease':
        return '🔍'
      case 'weather':
        return '🌧️'
      case 'market':
        return '📈'
      default:
        return '🔔'
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-red-500/10 border-red-500/30'
      case 'task':
        return 'bg-green-500/10 border-green-500/30'
      case 'disease':
        return 'bg-amber-500/10 border-amber-500/30'
      case 'weather':
        return 'bg-blue-500/10 border-blue-500/30'
      case 'market':
        return 'bg-purple-500/10 border-purple-500/30'
      default:
        return 'bg-muted border-border'
    }
  }

  const filterTypeMap: Record<string, string> = {
    Alerts: 'alert',
    Tasks: 'task',
    Disease: 'disease',
    Weather: 'weather',
    Market: 'market'
  }

  // Filter list by both tab type AND field selection
  const filteredNotifications = notifications.filter(notif => {
    // 1. Filter by Tab Type
    if (currentFilter !== 'All') {
      if (notif.type !== filterTypeMap[currentFilter]) return false
    }
    // 2. Filter by Farm Field selection
    if (selectedFieldId !== 'all') {
      // Global updates (like weather & market) are kept, but others must match the selected field
      if (notif.fieldId && String(notif.fieldId) !== selectedFieldId) return false
    }
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const isAr = language === 'ar'

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background">
      <SidebarNav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          
          {/* Header row */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{L.title}</h1>
              <p className="text-muted-foreground mt-2">{L.subtitle}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Filter by Farm Field Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  {isAr ? 'تصفية حسب الحقل:' : 'Filter by Field:'}
                </span>
                <select
                  value={selectedFieldId}
                  onChange={(e) => setSelectedFieldId(e.target.value)}
                  className="px-3 py-2 border border-input rounded-lg bg-card text-foreground text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">{isAr ? 'كل الحقول' : 'All Fields'}</option>
                  {fields.map(f => (
                    <option key={f.id} value={String(f.id)}>{f.name} ({f.crop_type})</option>
                  ))}
                </select>
              </div>

               {unreadCount > 0 && (
                <>
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600/20 text-emerald-500 rounded-lg text-sm font-semibold transition cursor-pointer whitespace-nowrap"
                  >
                    {isAr ? 'تغيير الكل لمقروء' : 'Mark All as Read'}
                  </button>
                  <div className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap shrink-0">
                    {unreadCount} {L.unread}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['All', 'Alerts', 'Tasks', 'Disease', 'Weather', 'Market'].map((filter) => {
              const isActive = currentFilter === filter
              return (
                <button
                  key={filter}
                  onClick={() => setCurrentFilter(filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition text-sm cursor-pointer border ${
                    isActive
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                      : 'bg-card border-border hover:bg-accent text-foreground'
                  }`}
                >
                  {L.filters[filter as keyof typeof L.filters] ?? filter}
                </button>
              )
            })}
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`border rounded-lg p-4 transition cursor-pointer hover:shadow-sm ${
                  notif.read
                    ? 'bg-card border-border'
                    : `${getColor(notif.type)} border-primary/40 border-2`
                }`}
                onClick={() => handleMarkAsRead(notif.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-2xl mt-0.5">{getIcon(notif.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">
                          {notif.title}
                        </h3>
                        
                        {/* Display Field Name badge if notification is linked to a field */}
                        {notif.fieldName && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-primary/20 text-primary rounded-full capitalize">
                            📍 {notif.fieldName}
                          </span>
                        )}

                        {!notif.read && (
                          <span className="w-2 h-2 bg-red-600 rounded-full inline-block shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 font-medium">{notif.time}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(notif.id)
                    }}
                    className="text-muted-foreground hover:text-foreground ms-2 p-1 hover:bg-accent rounded-full transition"
                    aria-label="Delete notification"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-16 bg-card border border-border rounded-lg shadow-sm">
              <p className="text-xl font-semibold text-muted-foreground mb-2">{L.noNotifications}</p>
              <p className="text-sm text-muted-foreground">{L.caughtUp}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
