import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { apiFetch } from './api'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function pushNotification(
  type: string,
  title: string,
  message: string,
  fieldId: any = null,
  fieldName: any = null
) {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('farmtec-notifications')
      const list = saved ? JSON.parse(saved) : []
      const now = new Date()
      const timeStr = now.toLocaleString()
      const newNotif = {
        id: Date.now() + Math.random(),
        type,
        title,
        message,
        time: timeStr,
        read: false,
        fieldId,
        fieldName
      }
      list.unshift(newNotif)
      localStorage.setItem('farmtec-notifications', JSON.stringify(list))
      window.dispatchEvent(new Event('farmtec-notifications-updated'))
    } catch (e) {
      console.error(e)
    }
  }

  apiFetch('/api/accounts/notifications/', {
    method: 'POST',
    body: JSON.stringify({
      type,
      title,
      message,
      read: false
    })
  }).catch(err => console.error("Failed to sync notification to backend:", err))
}

export function pushFarmHistory(
  type: string,
  title: string,
  message: string,
  fieldId: any = null,
  fieldName: any = null
) {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('farmtec-history')
      const list = saved ? JSON.parse(saved) : []
      const now = new Date()
      const dateStr = now.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const newHistory = {
        id: Date.now() + Math.random(),
        date: dateStr,
        time: timeStr,
        event: title,
        details: message,
        type,
        fieldId,
        fieldName
      }
      list.unshift(newHistory)
      localStorage.setItem('farmtec-history', JSON.stringify(list))
      window.dispatchEvent(new Event('farmtec-history-updated'))
    } catch (e) {
      console.error(e)
    }
  }

  apiFetch('/api/farms/history/', {
    method: 'POST',
    body: JSON.stringify({
      event_type: type === 'soil' ? 'soil' : type === 'irrigation' ? 'irrigation' : type === 'disease' ? 'disease' : type === 'fertilizer' ? 'fertilizer' : type === 'weather' ? 'weather' : 'prediction',
      event_title: title,
      details: message
    })
  }).catch(err => console.error("Failed to sync history to backend:", err))
}

export function normalizeCropToEnglish(crop: string): string {
  if (!crop) return 'wheat';
  const clean = crop.trim().toLowerCase();
  
  if (clean.includes('قمح') || clean.includes('wheat')) return 'wheat';
  if (clean.includes('ذرة') || clean.includes('corn') || clean.includes('maize')) return 'corn';
  if (clean.includes('أرز') || clean.includes('ارز') || clean.includes('rice')) return 'rice';
  if (clean.includes('شعير') || clean.includes('barley')) return 'barley';
  if (clean.includes('قطن') || clean.includes('cotton')) return 'cotton';
  if (clean.includes('صويا') || clean.includes('soybean')) return 'soybeans';
  if (clean.includes('سكر') || clean.includes('sugarcane')) return 'sugarcane';
  if (clean.includes('طماطم') || clean.includes('tomato')) return 'tomato';
  if (clean.includes('بطاطس') || clean.includes('potato')) return 'potato';
  if (clean.includes('مانجو') || clean.includes('mango')) return 'mango';
  
  return 'wheat'; // default
}
