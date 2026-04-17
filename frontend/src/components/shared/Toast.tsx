import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  const colors = {
    success: { bg: '#e4f0d9', color: '#3a5c1e', border: 'rgba(58,92,30,0.2)' },
    error:   { bg: '#fde8e0', color: '#8a2c1a', border: 'rgba(138,44,26,0.2)' },
    info:    { bg: '#deeaf5', color: '#1d3b55', border: 'rgba(29,59,85,0.2)'  },
  }
  const c = colors[type]

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
      borderRadius: 12, padding: '12px 18px',
      fontSize: '0.875rem', fontWeight: 600,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'slideup 0.2s ease',
      fontFamily: '"Sora","Avenir Next","Segoe UI",sans-serif'
    }}>
      <style>{`@keyframes slideup{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      {message}
      <button onClick={onClose} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: c.color, fontWeight: 700, fontSize: '1rem', padding: 0, lineHeight: 1
      }}>×</button>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const show = (message: string, type: 'success' | 'error' | 'info' = 'success') =>
    setToast({ message, type })
  const hide = () => setToast(null)
  return { toast, show, hide }
}