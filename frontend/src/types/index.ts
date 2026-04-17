export type Role = 'ADMIN' | 'AGENT' | 'REQUESTER'

export interface AuthUser {
  id: string
  email: string
  role: Role
  fullName: string
}

export interface Ticket {
  id: number
  subject: string
  description: string
  status: string
  priority: string
  createdBy: number
  createdByName: string | null
  assignedTo: number | null
  assignedToName: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

export interface LoginResponse {
  token: string
  email: string
  role: Role
  id: string
  fullName: string
}

export interface TicketComment {
  id: number
  ticketId: number
  authorId: number
  authorName: string
  authorRole: Role | null
  body: string
  createdAt: string
}

export interface AdminUser {
  id: number
  fullName: string
  email: string
  role: Role
  status: 'Online' | 'Offline' | 'Away'
  lastActiveAt: string | null
  createdAt: string
}

export interface AdminMetrics {
  openTickets: number
  overdueTickets: number
  activeAgents: number
  totalAgents: number
  resolutionRate: number
  workload: AgentWorkload[]
}

export interface AgentWorkload {
  agentId: number
  fullName: string
  activeTickets: number
  resolvedTickets: number
}
