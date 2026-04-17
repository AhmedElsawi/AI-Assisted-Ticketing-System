import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginRequest, signupRequest } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import type { Role } from '../types'
import '../App.css'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectByRole = (role: Role) => {
    const redirectMap: Record<Role, string> = {
      REQUESTER: '/requester',
      AGENT: '/agent',
      ADMIN: '/admin',
    }
    navigate(redirectMap[role])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = mode === 'login'
        ? await loginRequest(email, password)
        : await signupRequest(fullName, email, password)

      login({ id: data.id, email: data.email, role: data.role, fullName: data.fullName }, data.token)
      redirectByRole(data.role)
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message
      const fieldErrors = err?.response?.data?.fields

      if (typeof apiMessage === 'string') {
        setError(apiMessage)
      } else if (fieldErrors && typeof fieldErrors === 'object') {
        const firstFieldError = Object.values(fieldErrors)[0]
        setError(typeof firstFieldError === 'string'
          ? firstFieldError
          : 'Please check your information and try again.')
      } else {
        setError(mode === 'login'
          ? 'Invalid email or password. Please try again.'
          : 'Unable to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <header className="auth-topbar">
        <div className="brand-lockup">
          <div className="brand-mark">D</div>
          <div>
            <p className="brand-name">Deskflow</p>
            <p className="brand-subtitle">Support operations platform</p>
          </div>
        </div>
      </header>

      <section className="auth-stage">
        <div className="auth-frame">
          <div className="login-card">
            <h1>{mode === 'login' ? 'Welcome back!' : 'Create your account'}</h1>
            <p className="login-copy">
              {mode === 'login'
                ? 'Access your tickets, workflows, and role-specific dashboard.'
                : 'Start with a requester account and begin tracking support requests.'}
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <label className="field-group">
                  <span>Full name</span>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </label>
              )}

              <label className="field-group">
                <span>Email address</span>
                <input
                  type="email"
                  placeholder="user@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="field-group">
                <span>Password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </label>

              {error && (
                <p style={{ color: '#a63d2f', fontSize: '0.875rem', margin: 0 }}>
                  {error}
                </p>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading
                  ? mode === 'login' ? 'Signing in...' : 'Creating account...'
                  : mode === 'login' ? 'Sign in →' : 'Create account →'}
              </button>
            </form>

            <p className="auth-footnote">
              {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
              <button
                className="inline-link"
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError('')
                }}
              >
                {mode === 'login' ? 'Create account' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
