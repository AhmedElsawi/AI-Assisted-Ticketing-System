import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { Role } from '../types'

export default function NotFound() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handleHome = () => {
    if (!user) { navigate('/login'); return }
    const map: Record<Role, string> = {
      REQUESTER: '/requester', AGENT: '/agent', ADMIN: '/admin'
    }
    navigate(map[user.role])
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'radial-gradient(circle at top left, #f6efe6 0%, #efe7dd 42%, #e7dfd4 100%)',
      fontFamily: '"Sora","Avenir Next","Segoe UI",sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '5rem', fontWeight: 700, color: '#e8ddd0',
          margin: '0 0 8px', letterSpacing: '-0.05em' }}>404</p>
        <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1f1b17',
          margin: '0 0 8px' }}>Page not found</p>
        <p style={{ color: '#685949', margin: '0 0 24px', fontSize: '0.9rem' }}>
          This page doesn't exist or you don't have access.
        </p>
        <button onClick={handleHome} style={{
          background: 'linear-gradient(135deg, #1d3b55, #31597d)',
          color: '#f8f5ef', border: 0, borderRadius: 12,
          padding: '10px 22px', fontWeight: 700,
          fontSize: '0.9rem', cursor: 'pointer'
        }}>Go to dashboard</button>
      </div>
    </div>
  )
}