'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('farmtec-user')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse user data:', error)
      }
    }
    setIsLoading(false)
  }, [])

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Invalid email or password')
      }
      const data = await res.json()
      const newUser: User = {
        id: data.user.id || '1',
        name: data.user.username || email.split('@')[0],
        email: data.user.email,
      }
      setUser(newUser)
      localStorage.setItem('farmtec-user', JSON.stringify(newUser))
      localStorage.setItem('farmtec-token', data.access)
      localStorage.setItem('farmtec-refresh-token', data.refresh)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username: name, password, phone_number: '' }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Registration failed')
      }
      const data = await res.json()
      const newUser: User = {
        id: data.user.id || '1',
        name: data.user.username || name,
        email: data.user.email,
      }
      setUser(newUser)
      localStorage.setItem('farmtec-user', JSON.stringify(newUser))
      localStorage.setItem('farmtec-token', data.access)
      localStorage.setItem('farmtec-refresh-token', data.refresh)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('farmtec-refresh-token')
    const accessToken = localStorage.getItem('farmtec-token')
    
    try {
      if (refreshToken && accessToken) {
        await fetch(`${API_BASE_URL}/api/accounts/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        })
      }
    } catch (e) {
      console.error('Backend logout failed:', e)
    }

    setUser(null)
    localStorage.removeItem('farmtec-user')
    localStorage.removeItem('farmtec-token')
    localStorage.removeItem('farmtec-refresh-token')
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
