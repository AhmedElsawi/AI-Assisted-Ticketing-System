import { api } from './axios'
import type { TicketComment } from '../types'

export const fetchTicketComments = (ticketId: number) =>
  api.get<TicketComment[]>(`/tickets/${ticketId}/comments`).then(r => r.data)

export const createTicketComment = (ticketId: number, body: string) =>
  api.post<TicketComment>(`/tickets/${ticketId}/comments`, { body }).then(r => r.data)
