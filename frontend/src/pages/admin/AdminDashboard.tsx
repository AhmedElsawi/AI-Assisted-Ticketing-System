import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTickets, deleteTicket, updateTicket } from '../../api/tickets'
import { createAdminUser, fetchAdminMetrics, fetchAdminUsers, updateAdminUser } from '../../api/admin'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { AdminUser, Role, Ticket } from '../../types'
import { Toast, useToast } from '../../components/shared/Toast'
import { timeAgo } from '../../utils/timeAgo'
import TicketActivity from '../../components/shared/TicketActivity'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    Open:          { bg: '#f0ebe3', color: '#6b5040', label: 'Open' },
    'In-Progress': { bg: '#deeaf5', color: '#1d3b55', label: 'In progress' },
    Resolved:      { bg: '#e4f0d9', color: '#3a5c1e', label: 'Resolved' },
    Closed:        { bg: '#eeebe6', color: '#7a6a55', label: 'Closed' },
  }
  const s = map[status] || map.Open
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px',
      borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
      {s.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Low:    { bg: '#f0ebe3', color: '#7a6a55' },
    Medium: { bg: '#fef3e2', color: '#8a5c1a' },
    High:   { bg: '#fde8e0', color: '#8a2c1a' },
    Urgent: { bg: '#fde0e0', color: '#7a1a1a' },
  }
  const s = map[priority] || map.Medium
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px',
      borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
      {priority}
    </span>
  )
}

function KpiCard({ label, value, sub, trend, valueColor }: {
  label: string; value: string | number; sub?: string; trend?: string; valueColor?: string
}) {
  return (
    <div style={{
      background: 'rgba(250,248,255,0.72)',
      border: '1px solid rgba(83,74,183,0.1)',
      borderRadius: 16,
      padding: '20px 26px',
      minHeight: 122,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 700,
        color: '#4f486c', letterSpacing: '-0.01em' }}>
        {label}
      </p>
      <div>
        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800,
          color: valueColor || '#16131e', letterSpacing: '-0.05em' }}>
          {value}
          {trend && (
            <span style={{ marginLeft: 10, fontSize: '0.9rem', color: '#3a5c1e',
              letterSpacing: 0, fontWeight: 800 }}>
              {trend}
            </span>
          )}
        </p>
      {sub && (
          <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#6a5aaa',
            fontWeight: 700 }}>{sub}</p>
      )}
      </div>
    </div>
  )
}

function RolePill({ role }: { role: AdminUser['role'] }) {
  const map: Record<AdminUser['role'], { bg: string; color: string; label: string }> = {
    ADMIN: { bg: '#eeedfe', color: '#3c3489', label: 'Admin' },
    AGENT: { bg: '#deeaf5', color: '#1d3b55', label: 'Agent' },
    REQUESTER: { bg: '#e4f0d9', color: '#3a5c1e', label: 'Requester' },
  }
  const item = map[role]

  return (
    <span style={{
      background: item.bg,
      color: item.color,
      borderRadius: 20,
      padding: '4px 10px',
      fontSize: '0.74rem',
      fontWeight: 800,
    }}>
      {item.label}
    </span>
  )
}

function UserAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <span style={{
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #f6f3ff, #dcd7f8)',
      border: '1px solid rgba(83,74,183,0.18)',
      color: '#3c3489',
      display: 'grid',
      placeItems: 'center',
      fontSize: '0.72rem',
      fontWeight: 800,
      flexShrink: 0,
    }}>
      {initials}
    </span>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [sidebarItem, setSidebarItem] = useState('overview')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    role: 'REQUESTER' as Role,
    password: 'password123',
  })
  const { toast, show: showToast, hide: hideToast } = useToast()


  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: fetchTickets,
    enabled: Boolean(user?.id),
  })

  const { data: adminUsers = [] } = useQuery({
    queryKey: ['admin-users', user?.id],
    queryFn: fetchAdminUsers,
    enabled: Boolean(user?.id),
  })

  const { data: adminMetrics } = useQuery({
    queryKey: ['admin-metrics', user?.id],
    queryFn: fetchAdminMetrics,
    enabled: Boolean(user?.id),
  })

  const { mutate: removeTicket } = useMutation({
  mutationFn: (id: number) => deleteTicket(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] })
    setConfirmDelete(null)
    showToast('Ticket deleted', 'info')
  },
  onError: () => showToast('Delete failed', 'error'),
})

  const { mutate: patchTicket } = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Pick<Ticket, 'status' | 'priority' | 'assignedTo'>> }) =>
      updateTicket(id, updates),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
      setSelectedTicket(updated)
      showToast('Ticket updated', 'success')
    },
    onError: () => showToast('Could not update ticket', 'error'),
  })

  const { mutate: inviteUser, isPending: isInviting } = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
      setInviteForm({ fullName: '', email: '', role: 'REQUESTER', password: 'password123' })
      setShowInviteForm(false)
      showToast('User invited', 'success')
    },
    onError: () => showToast('Could not invite user', 'error'),
  })

  const { mutate: changeUserRole } = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => updateAdminUser(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
      showToast('Role updated', 'success')
    },
    onError: () => showToast('Could not update role', 'error'),
  })

  const handleLogout = () => { logout(); navigate('/login') }
  const handleInviteSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim() || inviteForm.password.length < 8) {
      showToast('Name, email, and an 8+ character password are required', 'error')
      return
    }
    inviteUser(inviteForm)
  }

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'

  const open       = tickets.filter(t => t.status === 'Open').length
  const resolved   = tickets.filter(t => t.status === 'Resolved').length
  const overdue    = tickets.filter(t =>
    t.status !== 'Resolved' && t.status !== 'Closed' &&
    t.createdAt && (Date.now() - new Date(t.createdAt).getTime()) > 1000 * 60 * 60 * 48
  ).length

  const resolutionRate = tickets.length > 0
    ? Math.round((resolved / tickets.length) * 100)
    : 0
  const activeAgents = adminMetrics?.activeAgents
    ?? adminUsers.filter(u => u.role === 'AGENT' && u.status === 'Online').length
  const totalAgents = adminMetrics?.totalAgents
    ?? adminUsers.filter(u => u.role === 'AGENT').length

  const priorityCounts = ['Urgent', 'High', 'Medium', 'Low'].map(p => ({
    label: p,
    count: tickets.filter(t => t.priority === p).length,
    max: tickets.length || 1,
  }))

  const filtered = tickets.filter(t =>
    filterStatus === 'ALL' || t.status === filterStatus
  )

  const priorityColor: Record<string, string> = {
    Urgent: '#c0392b', High: '#c0622b', Medium: '#8a5c1a', Low: '#5a7a55'
  }
  const maxWorkload = Math.max(...(adminMetrics?.workload.map(agent => agent.activeTickets) ?? [1]), 1)
  const agents = adminUsers.filter(adminUser => adminUser.role === 'AGENT')

  return (
    <div className="dashboard-shell admin-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'radial-gradient(circle at top left, #f0eeff 0%, #e8e4fa 42%, #ddd8f5 100%)',
      fontFamily: '"Sora","Avenir Next","Segoe UI",sans-serif' }}>

      {/* Topbar */}
      <header className="dashboard-topbar" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 54, flexShrink: 0,
        background: 'rgba(243,240,255,0.97)',
        borderBottom: '1px solid rgba(83,74,183,0.12)',
      }}>
        <div className="dashboard-brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #202c39, #47627a)',
            color: '#f8f5ef', display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: '0.85rem'
          }}>D</div>
          <span style={{ fontWeight: 700, color: '#1a1535', fontSize: '0.95rem' }}>Deskflow</span>
          <span style={{
            background: '#eeedfe', color: '#3c3489', fontSize: '0.7rem',
            fontWeight: 700, padding: '2px 9px', borderRadius: 20,
            border: '1px solid rgba(83,74,183,0.2)', letterSpacing: '0.02em'
          }}>Admin</span>
        </div>
        <div className="dashboard-userbar" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #534ab7, #7f77dd)',
            color: '#fff', display: 'grid', placeItems: 'center',
            fontSize: '0.72rem', fontWeight: 700
          }}>{initials}</div>
          <span style={{ fontSize: '0.85rem', color: '#3c3489', fontWeight: 600 }}>
            {user?.fullName}
          </span>
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid rgba(83,74,183,0.2)',
            borderRadius: 9, padding: '5px 12px',
            fontSize: '0.8rem', color: '#534ab7', cursor: 'pointer', fontWeight: 600
          }}>Sign out</button>
        </div>
      </header>

      <div className="dashboard-layout" style={{ display: 'flex', flex: 1 }}>

        {/* Sidebar */}
        <aside className="dashboard-sidebar" style={{
          width: 210, flexShrink: 0,
          background: 'rgba(243,240,255,0.85)',
          borderRight: '1px solid rgba(83,74,183,0.1)',
          padding: '20px 0',
        }}>
          <div style={{ padding: '0 16px 14px',
            borderBottom: '1px solid rgba(83,74,183,0.08)', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700,
              color: '#7f77dd', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Admin console
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#6a5aaa' }}>
              Oversight · Control
            </p>
          </div>
          {[
            { key: 'overview',  label: 'Overview',        dot: '#534ab7' },
            { key: 'tickets',   label: 'All tickets',     dot: 'rgba(83,74,183,0.3)' },
            { key: 'users',     label: 'Users & roles',   dot: 'rgba(83,74,183,0.3)' },
          ].map(item => (
            <div key={item.key}
              onClick={() => {
                setSidebarItem(item.key)
                setSelectedTicket(null)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 16px', cursor: 'pointer', fontSize: '0.875rem',
                fontWeight: sidebarItem === item.key ? 700 : 400,
                color: sidebarItem === item.key ? '#1a1535' : '#6a5aaa',
                borderLeft: sidebarItem === item.key
                  ? '2.5px solid #534ab7' : '2.5px solid transparent',
                background: sidebarItem === item.key
                  ? 'rgba(83,74,183,0.07)' : 'none',
                transition: 'all 0.1s',
              }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%',
                background: item.dot, flexShrink: 0 }} />
              {item.label}
            </div>
          ))}
        </aside>

        {/* Main */}
        <main className="dashboard-main" style={{ flex: 1, padding: '24px 28px', minWidth: 0 }}>

          {/* OVERVIEW */}
          {sidebarItem === 'overview' && (
            <>
              <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 700,
                color: '#1a1535', letterSpacing: '-0.03em' }}>System overview</h1>
              <p style={{ margin: '0 0 22px', color: '#6a5aaa', fontSize: '0.875rem' }}>
                Live metrics · {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>

              {/* KPI cards */}
              <div className="metrics-grid" style={{ display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 18, marginBottom: 24 }}>
                <KpiCard label="Open tickets" value={open} />
                <KpiCard label="Overdue" value={overdue}
                  sub={overdue > 0 ? 'critical' : 'clear'} valueColor={overdue > 0 ? '#a63d2f' : undefined} />
                <KpiCard label="Active agents"  value={activeAgents}
                  sub={totalAgents ? `of ${totalAgents}` : 'none yet'} />
                <KpiCard label="Resolution rate" value={`${resolutionRate}%`}
                  valueColor={resolutionRate >= 70 ? '#3a5c1e' : '#a63d2f'} />
              </div>

              <div className="overview-grid" style={{ display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 14, marginBottom: 14 }}>

                {/* Priority breakdown */}
                <div style={{
                  background: 'rgba(250,248,255,0.76)',
                  border: '1px solid rgba(83,74,183,0.12)',
                  borderRadius: 16, padding: '22px 26px'
                }}>
                  <p style={{ margin: '0 0 18px', fontSize: '0.98rem', fontWeight: 800,
                    color: '#1a1535', letterSpacing: '-0.02em' }}>
                    Tickets by priority
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                    {priorityCounts.map(({ label, count, max }) => (
                      <div key={label} style={{ display: 'grid',
                        gridTemplateColumns: '104px 1fr 32px', gap: 12, alignItems: 'center' }}>
                        <span style={{ color: priorityColor[label], fontSize: '0.86rem',
                          fontWeight: 700, textAlign: 'right' }}>{label}</span>
                        <div style={{ height: 11, background: 'rgba(83,74,183,0.08)',
                          borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 999,
                            background: priorityColor[label],
                            width: `${Math.round((count / max) * 100)}%`,
                            minWidth: count > 0 ? 18 : 0 }} />
                        </div>
                        <span style={{ color: '#1a1535', fontSize: '0.86rem',
                          fontWeight: 800 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agent workload */}
                <div style={{
                  background: 'rgba(250,248,255,0.76)',
                  border: '1px solid rgba(83,74,183,0.12)',
                  borderRadius: 16, padding: '22px 26px'
                }}>
                  <p style={{ margin: '0 0 18px', fontSize: '0.98rem', fontWeight: 800,
                    color: '#1a1535', letterSpacing: '-0.02em' }}>
                    Agent workload
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {(adminMetrics?.workload ?? []).length === 0 ? (
                      <p style={{ margin: 0, color: '#7a6aaa', fontSize: '0.84rem' }}>
                        No agent workload yet.
                      </p>
                    ) : adminMetrics?.workload.map(agent => (
                      <div key={agent.agentId} style={{ display: 'grid',
                        gridTemplateColumns: '96px 1fr 34px 66px', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#4f486c', fontSize: '0.86rem', fontWeight: 700,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {agent.fullName}
                        </span>
                        <div style={{ height: 9, background: 'rgba(83,74,183,0.1)',
                          borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.round((agent.activeTickets / maxWorkload) * 100)}%`,
                            height: '100%',
                            borderRadius: 99,
                            background: 'linear-gradient(90deg, #534ab7, #7f77dd)',
                          }} />
                        </div>
                        <span style={{ color: '#3c3489', fontSize: '0.8rem', fontWeight: 800,
                          textAlign: 'right' }}>
                          {agent.activeTickets}
                        </span>
                        <span style={{ color: '#7a6aaa', fontSize: '0.74rem', fontWeight: 700 }}>
                          {agent.resolvedTickets} done
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Status breakdown */}
              <div style={{
                background: 'rgba(243,240,255,0.8)',
                border: '1px solid rgba(83,74,183,0.12)',
                borderRadius: 14, padding: '18px 20px'
              }}>
                <p style={{ margin: '0 0 14px', fontSize: '0.78rem', fontWeight: 700,
                  color: '#6a5aaa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Status breakdown
                </p>
                <div style={{ display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10 }}>
                  {[
                    { label: 'Open',        status: 'Open',        color: '#6b5040' },
                    { label: 'In progress', status: 'In-Progress', color: '#1d3b55' },
                    { label: 'Resolved',    status: 'Resolved',    color: '#3a5c1e' },
                    { label: 'Closed',      status: 'Closed',      color: '#7a6a55' },
                  ].map(({ label, status, color }) => {
                    const count = tickets.filter(t => t.status === status).length
                    const pct = tickets.length > 0
                      ? Math.round((count / tickets.length) * 100) : 0
                    return (
                      <div key={status} style={{
                        background: 'rgba(255,255,255,0.5)',
                        borderRadius: 10, padding: '12px 14px',
                        border: '1px solid rgba(83,74,183,0.08)'
                      }}>
                        <p style={{ margin: '0 0 4px', fontSize: '0.75rem',
                          fontWeight: 700, color }}>{label}</p>
                        <p style={{ margin: 0, fontSize: '1.4rem',
                          fontWeight: 700, color: '#1a1535' }}>{count}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.72rem',
                          color: '#7a6aaa' }}>{pct}% of total</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Users & roles */}
              <div style={{
                background: 'rgba(243,240,255,0.86)',
                border: '1px solid rgba(83,74,183,0.12)',
                borderRadius: 14,
                padding: '18px 20px',
                marginTop: 14,
                overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800,
                      color: '#1a1535', letterSpacing: '-0.02em' }}>
                      Users & roles
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#7a6aaa' }}>
                      Manage access and see who is active
                    </p>
                  </div>
                  <button type="button" onClick={() => {
                    setSidebarItem('users')
                    setShowInviteForm(true)
                  }} style={{
                    border: '1px solid rgba(83,74,183,0.22)',
                    background: 'rgba(255,255,255,0.4)',
                    color: '#3c3489',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}>
                    + Invite user
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.15fr 1.4fr 94px 96px 90px',
                  gap: 12,
                  padding: '0 10px 10px',
                  borderBottom: '1px solid rgba(83,74,183,0.1)',
                  color: '#7a6aaa',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  <span>Name</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span>Last active</span>
                </div>

                {adminUsers.length === 0 ? (
                  <div style={{ padding: '24px 10px', color: '#7a6aaa',
                    fontSize: '0.875rem', textAlign: 'center' }}>
                    No users found yet.
                  </div>
                ) : adminUsers.map((adminUser, i) => {
                  const isActive = adminUser.status === 'Online'
                  const lastActive = adminUser.lastActiveAt
                    ? timeAgo(adminUser.lastActiveAt)
                    : adminUser.status === 'Online' ? 'now' : 'Never'

                  return (
                    <div key={adminUser.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '1.15fr 1.4fr 94px 96px 90px',
                      gap: 12,
                      alignItems: 'center',
                      padding: '12px 10px',
                      borderBottom: i < adminUsers.length - 1
                        ? '1px solid rgba(83,74,183,0.08)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <UserAvatar name={adminUser.fullName} />
                        <span style={{ color: '#1a1535', fontSize: '0.86rem',
                          fontWeight: 800, whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {adminUser.fullName}
                        </span>
                      </div>
                      <span style={{ color: '#6a5aaa', fontSize: '0.82rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {adminUser.email}
                      </span>
                      <RolePill role={adminUser.role} />
                      <span style={{
                        color: isActive ? '#3a5c1e' : '#7a6aaa',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                      }}>
                        <span style={{
                          display: 'inline-block',
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: isActive ? '#5a8a2e' : 'transparent',
                          border: isActive ? 'none' : '1px solid #7a6aaa',
                          marginRight: 7,
                          verticalAlign: 'middle',
                        }} />
                        {adminUser.status}
                      </span>
                      <span style={{ color: '#6a5aaa', fontSize: '0.8rem', fontWeight: 700 }}>
                        {lastActive}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* USERS & ROLES */}
          {sidebarItem === 'users' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div>
                  <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 700,
                    color: '#1a1535', letterSpacing: '-0.03em' }}>Users & roles</h1>
                  <p style={{ margin: 0, color: '#6a5aaa', fontSize: '0.875rem' }}>
                    Invite users and promote requesters into agents
                  </p>
                </div>
                <button onClick={() => setShowInviteForm(value => !value)} style={{
                  border: '1px solid rgba(83,74,183,0.22)',
                  background: showInviteForm ? '#534ab7' : 'rgba(255,255,255,0.5)',
                  color: showInviteForm ? '#fff' : '#3c3489',
                  borderRadius: 10,
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}>
                  {showInviteForm ? 'Close invite' : '+ Invite user'}
                </button>
              </div>

              {showInviteForm && (
                <form onSubmit={handleInviteSubmit} style={{
                  background: 'rgba(243,240,255,0.85)',
                  border: '1px solid rgba(83,74,183,0.12)',
                  borderRadius: 14,
                  padding: 18,
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1.3fr 130px 140px 98px',
                  gap: 10,
                  alignItems: 'end',
                  marginBottom: 14,
                }}>
                  <label style={{ display: 'grid', gap: 6, color: '#6a5aaa',
                    fontSize: '0.76rem', fontWeight: 800 }}>
                    Full name
                    <input value={inviteForm.fullName}
                      onChange={e => setInviteForm(f => ({ ...f, fullName: e.target.value }))}
                      style={{ border: '1px solid rgba(83,74,183,0.16)', borderRadius: 9,
                        padding: '9px 10px', background: 'rgba(255,255,255,0.62)',
                        color: '#1a1535', font: 'inherit' }} />
                  </label>
                  <label style={{ display: 'grid', gap: 6, color: '#6a5aaa',
                    fontSize: '0.76rem', fontWeight: 800 }}>
                    Email
                    <input type="email" value={inviteForm.email}
                      onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                      style={{ border: '1px solid rgba(83,74,183,0.16)', borderRadius: 9,
                        padding: '9px 10px', background: 'rgba(255,255,255,0.62)',
                        color: '#1a1535', font: 'inherit' }} />
                  </label>
                  <label style={{ display: 'grid', gap: 6, color: '#6a5aaa',
                    fontSize: '0.76rem', fontWeight: 800 }}>
                    Role
                    <select value={inviteForm.role}
                      onChange={e => setInviteForm(f => ({ ...f, role: e.target.value as Role }))}
                      style={{ border: '1px solid rgba(83,74,183,0.16)', borderRadius: 9,
                        padding: '9px 10px', background: 'rgba(255,255,255,0.62)',
                        color: '#1a1535', font: 'inherit' }}>
                      <option value="REQUESTER">Requester</option>
                      <option value="AGENT">Agent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: 6, color: '#6a5aaa',
                    fontSize: '0.76rem', fontWeight: 800 }}>
                    Password
                    <input value={inviteForm.password}
                      onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))}
                      style={{ border: '1px solid rgba(83,74,183,0.16)', borderRadius: 9,
                        padding: '9px 10px', background: 'rgba(255,255,255,0.62)',
                        color: '#1a1535', font: 'inherit' }} />
                  </label>
                  <button disabled={isInviting} style={{
                    border: 0,
                    borderRadius: 9,
                    padding: '10px 12px',
                    background: '#534ab7',
                    color: '#fff',
                    fontWeight: 800,
                    cursor: isInviting ? 'not-allowed' : 'pointer',
                    opacity: isInviting ? 0.7 : 1,
                  }}>
                    Invite
                  </button>
                </form>
              )}

              <div style={{
                background: 'rgba(243,240,255,0.86)',
                border: '1px solid rgba(83,74,183,0.12)',
                borderRadius: 14,
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 1.4fr 150px 110px 100px',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(83,74,183,0.1)',
                  color: '#7a6aaa',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  <span>Name</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span>Last active</span>
                </div>

                {adminUsers.map(adminUser => {
                  const isActive = adminUser.status === 'Online'
                  return (
                    <div key={adminUser.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '1.1fr 1.4fr 150px 110px 100px',
                      gap: 12,
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(83,74,183,0.08)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <UserAvatar name={adminUser.fullName} />
                        <span style={{ color: '#1a1535', fontSize: '0.86rem',
                          fontWeight: 800, whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {adminUser.fullName}
                        </span>
                      </div>
                      <span style={{ color: '#6a5aaa', fontSize: '0.82rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {adminUser.email}
                      </span>
                      <select value={adminUser.role}
                        onChange={e => changeUserRole({ id: adminUser.id, role: e.target.value as Role })}
                        style={{ border: '1px solid rgba(83,74,183,0.16)', borderRadius: 9,
                          padding: '7px 9px', background: 'rgba(255,255,255,0.58)',
                          color: '#1a1535', font: 'inherit', fontSize: '0.8rem',
                          fontWeight: 700 }}>
                        <option value="REQUESTER">Requester</option>
                        <option value="AGENT">Agent</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <span style={{ color: isActive ? '#3a5c1e' : '#7a6aaa',
                        fontSize: '0.82rem', fontWeight: 800 }}>
                        <span style={{ display: 'inline-block', width: 7, height: 7,
                          borderRadius: '50%', background: isActive ? '#5a8a2e' : 'transparent',
                          border: isActive ? 'none' : '1px solid #7a6aaa',
                          marginRight: 7, verticalAlign: 'middle' }} />
                        {adminUser.status}
                      </span>
                      <span style={{ color: '#6a5aaa', fontSize: '0.8rem', fontWeight: 700 }}>
                        {adminUser.lastActiveAt ? timeAgo(adminUser.lastActiveAt) : 'Never'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ALL TICKETS */}
          {sidebarItem === 'tickets' && (
            <>
              {selectedTicket ? (
                <>
                  <button onClick={() => setSelectedTicket(null)} style={{
                    background: 'none', border: 'none', color: '#6a5aaa',
                    fontSize: '0.85rem', cursor: 'pointer',
                    marginBottom: 18, padding: 0, fontWeight: 700
                  }}>← Back to all tickets</button>

                  <div style={{
                    background: 'rgba(243,240,255,0.88)',
                    border: '1px solid rgba(83,74,183,0.12)',
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 14,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                      <div>
                        <p style={{ margin: '0 0 5px', color: '#7a6aaa',
                          fontSize: '0.78rem', fontWeight: 800 }}>
                          Ticket #{selectedTicket.id}
                        </p>
                        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800,
                          color: '#1a1535', letterSpacing: '-0.02em' }}>
                          {selectedTicket.subject}
                        </h1>
                      </div>
                      <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                        <PriorityBadge priority={selectedTicket.priority} />
                        <StatusBadge status={selectedTicket.status} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap',
                      color: '#6a5aaa', fontSize: '0.8rem', marginBottom: 16 }}>
                      <span>Created <strong style={{ color: '#1a1535' }}>
                        {selectedTicket.createdAt ? timeAgo(selectedTicket.createdAt) : '—'}
                      </strong></span>
                      <span>Updated <strong style={{ color: '#1a1535' }}>
                        {selectedTicket.updatedAt ? timeAgo(selectedTicket.updatedAt) : '—'}
                      </strong></span>
                      <span>Requester <strong style={{ color: '#1a1535' }}>
                        {selectedTicket.createdByName || `#${selectedTicket.createdBy}`}
                      </strong></span>
                      <span>Assigned <strong style={{ color: '#1a1535' }}>
                        {selectedTicket.assignedToName || 'Unassigned'}
                      </strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                      flexWrap: 'wrap', marginBottom: 16 }}>
                      <label style={{ color: '#6a5aaa', fontSize: '0.78rem',
                        fontWeight: 800, textTransform: 'uppercase',
                        letterSpacing: '0.05em' }}>
                        Assign to
                      </label>
                      <select
                        value={selectedTicket.assignedTo ?? ''}
                        onChange={event => patchTicket({
                          id: selectedTicket.id,
                          updates: {
                            assignedTo: event.target.value ? Number(event.target.value) : null,
                          },
                        })}
                        style={{
                          border: '1px solid rgba(83,74,183,0.16)',
                          borderRadius: 9,
                          background: 'rgba(255,255,255,0.58)',
                          color: '#1a1535',
                          padding: '8px 10px',
                          font: 'inherit',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          minWidth: 190,
                        }}
                      >
                        <option value="">Unassigned</option>
                        {agents.map(agent => (
                          <option key={agent.id} value={agent.id}>
                            {agent.fullName}
                          </option>
                        ))}
                      </select>
                      {agents.length === 0 && (
                        <span style={{ color: '#a63d2f', fontSize: '0.78rem',
                          fontWeight: 700 }}>
                          No agents available
                        </span>
                      )}
                    </div>

                    <div style={{
                      background: 'rgba(255,255,255,0.58)',
                      border: '1px solid rgba(83,74,183,0.08)',
                      borderRadius: 12,
                      padding: '13px 15px',
                    }}>
                      <p style={{ margin: 0, color: '#3c3489', lineHeight: 1.7, fontSize: '0.9rem' }}>
                        {selectedTicket.description}
                      </p>
                    </div>
                  </div>

                  <TicketActivity
                    ticketId={selectedTicket.id}
                    currentUserId={user?.id}
                    accentColor="#534ab7"
                    surfaceColor="rgba(243,240,255,0.88)"
                    borderColor="rgba(83,74,183,0.12)"
                  />
                </>
              ) : (
                <>
              <div style={{ display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 700,
                    color: '#1a1535', letterSpacing: '-0.03em' }}>All tickets</h1>
                  <p style={{ margin: 0, color: '#6a5aaa', fontSize: '0.875rem' }}>
                    Full system visibility — {tickets.length} total
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
                {['ALL', 'Open', 'In-Progress', 'Resolved', 'Closed'].map(f => (
                  <button key={f} onClick={() => setFilterStatus(f)} style={{
                    padding: '4px 13px', borderRadius: 20,
                    border: '1px solid rgba(83,74,183,0.15)',
                    background: filterStatus === f ? '#534ab7' : 'rgba(255,255,255,0.6)',
                    color: filterStatus === f ? '#fff' : '#6a5aaa',
                    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                  }}>
                    {f === 'ALL' ? 'All' : f === 'Open' ? 'Open'
                      : f === 'In-Progress' ? 'In progress'
                      : f === 'Resolved' ? 'Resolved' : 'Closed'}
                    {' '}({f === 'ALL' ? tickets.length
                      : tickets.filter(t => t.status === f).length})
                  </button>
                ))}
              </div>

              {/* Table */}
              <div style={{
                background: 'rgba(243,240,255,0.85)',
                border: '1px solid rgba(83,74,183,0.12)',
                borderRadius: 14, overflow: 'hidden'
              }}>
                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '52px 1fr 90px 110px 100px 132px',
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(83,74,183,0.1)',
                  fontSize: '0.72rem', fontWeight: 700, color: '#7a6aaa',
                  textTransform: 'uppercase', letterSpacing: '0.06em'
                }}>
                  <span>ID</span>
                  <span>Subject</span>
                  <span>Priority</span>
                  <span>Status</span>
                  <span>Created</span>
                  <span style={{ textAlign: 'right' }}>Action</span>
                </div>

                {isLoading ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#6a5aaa' }}>
                    Loading...
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#6a5aaa' }}>
                    No tickets found
                  </div>
                ) : filtered.map((ticket: Ticket, i: number) => (
                  <div key={ticket.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '52px 1fr 90px 110px 100px 132px',
                    padding: '11px 16px', alignItems: 'center',
                    borderBottom: i < filtered.length - 1
                      ? '1px solid rgba(83,74,183,0.07)' : 'none',
                    background: confirmDelete === ticket.id
                      ? 'rgba(166,61,47,0.06)' : 'none',
                    transition: 'background 0.1s'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#9a8acc', fontWeight: 600 }}>
                      #{ticket.id}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1535',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      paddingRight: 12 }}>
                      {ticket.subject}
                    </span>
                    <span><PriorityBadge priority={ticket.priority} /></span>
                    <span><StatusBadge status={ticket.status} /></span>
                    <span style={{ fontSize: '0.78rem', color: '#7a6aaa' }}>
                      {ticket.createdAt ? timeAgo(ticket.createdAt) : '—'}
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      {confirmDelete === ticket.id ? (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => removeTicket(ticket.id)} style={{
                            padding: '4px 10px', borderRadius: 7, border: 'none',
                            background: '#a63d2f', color: '#fff',
                            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                          }}>Confirm</button>
                          <button onClick={() => setConfirmDelete(null)} style={{
                            padding: '4px 10px', borderRadius: 7,
                            border: '1px solid rgba(83,74,183,0.2)',
                            background: 'none', color: '#6a5aaa',
                            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                          }}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => setSelectedTicket(ticket)} style={{
                            padding: '4px 10px', borderRadius: 7,
                            border: '1px solid rgba(83,74,183,0.2)',
                            background: 'rgba(255,255,255,0.45)', color: '#534ab7',
                            fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                          }}>Open</button>
                          <button onClick={() => setConfirmDelete(ticket.id)} style={{
                            padding: '4px 10px', borderRadius: 7,
                            border: '1px solid rgba(166,61,47,0.2)',
                            background: 'none', color: '#a63d2f',
                            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                          }}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
                </>
              )}
            </>
          )}

        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
