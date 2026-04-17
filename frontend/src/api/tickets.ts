import { api } from './axios'
import type { Ticket } from '../types'

export const fetchTickets = () =>
  api.get<Ticket[]>('/tickets').then(r => r.data)

export const fetchTicket = (id: number) =>
  api.get<Ticket>(`/tickets/${id}`).then(r => r.data)

export const createTicket = (data: Pick<Ticket, 'subject' | 'description' | 'priority'>) =>
  api.post<Ticket>('/tickets', data).then(r => r.data)

export const updateTicket = (id: number, updates: Partial<Pick<Ticket, 'status' | 'priority' | 'assignedTo'>>) =>
  api.patch<Ticket>(`/tickets/${id}`, updates).then(r => r.data)

export const deleteTicket = (id: number) =>
  api.delete(`/tickets/${id}`)
