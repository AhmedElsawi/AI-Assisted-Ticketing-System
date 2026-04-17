import { create } from 'zustand'
import type { AuthUser } from '../types'

interface AuthStore {
  user: AuthUser | null
  token: string | null
  login: (user: AuthUser, token: string) => void
  updateUser: (user: AuthUser, token?: string) => void
  logout: () => void
}

const AUTH_STORAGE_KEY = 'auth'
const LEGACY_AUTH_KEYS = ['auth', 'token', 'user']

function clearLegacyAuthState() {
  LEGACY_AUTH_KEYS.forEach(key => localStorage.removeItem(key))
}

function loadAuthState(): Pick<AuthStore, 'user' | 'token'> {
  clearLegacyAuthState()

  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { user?: AuthUser; token?: string }
      if (parsed.user && parsed.token) {
        sessionStorage.setItem('token', parsed.token)
        sessionStorage.setItem('user', JSON.stringify(parsed.user))
        return { user: parsed.user, token: parsed.token }
      }
    }
  } catch {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const token = sessionStorage.getItem('token')
  const rawUser = sessionStorage.getItem('user')

  if (!token || !rawUser) {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    return { user: null, token: null }
  }

  try {
    const user = JSON.parse(rawUser) as AuthUser
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }))
    return { user, token }
  } catch {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    return { user: null, token: null }
  }
}

const initialAuthState = loadAuthState()

export const useAuthStore = create<AuthStore>((set) => ({
  token: initialAuthState.token,
  user: initialAuthState.user,
  login: (user, token) => {
    clearLegacyAuthState()
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }))
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(user))
    set({ user, token })
  },
  updateUser: (user, token) => {
    const nextToken = token ?? sessionStorage.getItem('token')
    if (!nextToken) return

    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token: nextToken }))
    sessionStorage.setItem('token', nextToken)
    sessionStorage.setItem('user', JSON.stringify(user))
    set({ user, token: nextToken })
  },
  logout: () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    clearLegacyAuthState()
    set({ user: null, token: null })
  },
}))
