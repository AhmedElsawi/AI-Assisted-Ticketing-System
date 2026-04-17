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

function loadAuthState(): Pick<AuthStore, 'user' | 'token'> {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { user?: AuthUser; token?: string }
      if (parsed.user && parsed.token) {
        localStorage.setItem('token', parsed.token)
        localStorage.setItem('user', JSON.stringify(parsed.user))
        return { user: parsed.user, token: parsed.token }
      }
    }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const token = localStorage.getItem('token')
  const rawUser = localStorage.getItem('user')

  if (!token || !rawUser) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return { user: null, token: null }
  }

  try {
    const user = JSON.parse(rawUser) as AuthUser
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }))
    return { user, token }
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return { user: null, token: null }
  }
}

const initialAuthState = loadAuthState()

export const useAuthStore = create<AuthStore>((set) => ({
  token: initialAuthState.token,
  user: initialAuthState.user,
  login: (user, token) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }))
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token })
  },
  updateUser: (user, token) => {
    const nextToken = token ?? localStorage.getItem('token')
    if (!nextToken) return

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token: nextToken }))
    localStorage.setItem('token', nextToken)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token: nextToken })
  },
  logout: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },
}))
