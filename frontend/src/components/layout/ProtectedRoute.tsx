import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import type { Role } from '../../types'

interface Props {
  children: React.ReactNode
  allowedRoles: Role[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, token } = useAuthStore()

  if (!token || !user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/login" replace />

  return <>{children}</>
}