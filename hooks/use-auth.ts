'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  email: string | null
}

interface AuthState {
  user: User | null
  loading: boolean
}

export function useAuth(): AuthState & {
  signIn: () => void
  signOut: () => Promise<void>
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true
  })

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        setState({ user: null, loading: false })
        return
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        setState({ user: null, loading: false })
        return
      }
      
      const data = await response.json()
      setState({ user: data.user, loading: false })
    } catch (error) {
      // Ne pas déconnecter automatiquement en cas d'erreur réseau
      console.error('Session check error:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const signIn = () => {
    window.location.href = '/api/auth/discord'
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setState({ user: null, loading: false })
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return {
    ...state,
    signIn,
    signOut
  }
}
