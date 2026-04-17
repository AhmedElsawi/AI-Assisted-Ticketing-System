import { api } from './axios'
import type { LoginResponse } from '../types'

export const loginRequest = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>('/auth/login', { email, password })
  return res.data
}

export const signupRequest = async (
  fullName: string,
  email: string,
  password: string
): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>('/auth/signup', { fullName, email, password })
  return res.data
}

export const updateProfileRequest = async (
  fullName: string
): Promise<LoginResponse> => {
  const res = await api.patch<LoginResponse>('/auth/me', { fullName })
  return res.data
}

export const deleteAccountRequest = async () => {
  await api.delete('/auth/me')
}
