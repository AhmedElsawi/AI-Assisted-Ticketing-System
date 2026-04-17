import { api } from './axios'
import type { AdminMetrics, AdminUser, Role } from '../types'

export const fetchAdminUsers = () =>
  api.get<AdminUser[]>('/admin/users').then(r => r.data)

export const updateAdminUser = (
  id: number,
  updates: Partial<{ role: Role; status: AdminUser['status'] }>
) => api.patch<AdminUser>(`/admin/users/${id}`, updates).then(r => r.data)

export const createAdminUser = (data: {
  fullName: string
  email: string
  role: Role
  password: string
}) => api.post<AdminUser>('/admin/users', data).then(r => r.data)

export const fetchAdminMetrics = () =>
  api.get<AdminMetrics>('/admin/metrics').then(r => r.data)
