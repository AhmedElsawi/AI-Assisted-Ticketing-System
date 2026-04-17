import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTickets, createTicket } from '../../api/tickets'
import { deleteAccountRequest, updateProfileRequest } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import type { Ticket } from '../../types'
import { Toast, useToast } from '../../components/shared/Toast'
import TicketActivity from '../../components/shared/TicketActivity'
import { timeAgo } from '../../utils/timeAgo'

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

const FILTERS = [
  { key: 'ALL',         label: 'All' },
  { key: 'Open',         label: 'Open' },
  { key: 'In-Progress',  label: 'In progress' },
  { key: 'Resolved',     label: 'Resolved' },
  { key: 'Closed',       label: 'Closed' },
]

export default function RequesterDashboard() {
  const { user, logout } = useAuthStore()
  const updateUser = useAuthStore(s => s.updateUser)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [view, setView]                     = useState<'list' | 'create' | 'detail'>('list')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [filter, setFilter]                 = useState('ALL')
  const [form, setForm]                     = useState({ subject: '', description: '', priority: 'Medium' })
  const [formError, setFormError]           = useState('')
  const [sidebarItem, setSidebarItem]       = useState('tickets')
  const [profileName, setProfileName]       = useState(user?.fullName || '')
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)
  const { toast, show: showToast, hide: hideToast } = useToast()


  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: fetchTickets,
    enabled: Boolean(user?.id),
  })

  const { mutate: submitTicket, isPending } = useMutation({
  mutationFn: createTicket,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] })
    setForm({ subject: '', description: '', priority: 'Medium' })
    setView('list')
    showToast('Ticket created successfully!', 'success')
  },
  onError: () => showToast('Failed to create ticket. Please try again.', 'error'),
})

  const { mutate: saveProfile, isPending: isSavingProfile } = useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: (data) => {
      updateUser({
        id: data.id,
        email: data.email,
        role: data.role,
        fullName: data.fullName,
      }, data.token)
      setProfileName(data.fullName)
      showToast('Profile updated', 'success')
    },
    onError: () => showToast('Could not update profile', 'error'),
  })

  const { mutate: deleteAccount, isPending: isDeletingAccount } = useMutation({
    mutationFn: deleteAccountRequest,
    onSuccess: () => {
      logout()
      navigate('/login')
    },
    onError: () => showToast('Could not delete account. Accounts with ticket history may need admin help.', 'error'),
  })

  const handleLogout = () => { logout(); navigate('/login') }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.subject.trim() || !form.description.trim()) {
      setFormError('Subject and description are required.')
      return
    }
    submitTicket(form)
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileName.trim()) {
      showToast('Full name is required', 'error')
      return
    }
    saveProfile(profileName.trim())
  }

  const sortedTickets = [...tickets].sort((a, b) =>
    new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  )
  const filtered = sortedTickets.filter(t => filter === 'ALL' || t.status === filter)
  const latestActivityTicket = sortedTickets[0]

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'radial-gradient(circle at top left, #f6efe6 0%, #efe7dd 42%, #e7dfd4 100%)',
      fontFamily: '"Sora","Avenir Next","Segoe UI",sans-serif' }}>

      {/* Topbar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 54, flexShrink: 0,
        background: 'rgba(248,243,234,0.97)',
        borderBottom: '1px solid rgba(137,115,84,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #202c39, #47627a)',
            color: '#f8f5ef', display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: '0.85rem'
          }}>D</div>
          <span style={{ fontWeight: 700, color: '#1f1b17', fontSize: '0.95rem' }}>Deskflow</span>
          <span style={{
            background: '#e4f0d9', color: '#3a5c1e', fontSize: '0.7rem',
            fontWeight: 700, padding: '2px 9px', borderRadius: 20,
            border: '1px solid rgba(58,92,30,0.2)', letterSpacing: '0.02em'
          }}>Requester</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3a5c1e, #5a8a2e)',
            color: '#f8f5ef', display: 'grid', placeItems: 'center',
            fontSize: '0.72rem', fontWeight: 700
          }}>{initials}</div>
          <span style={{ fontSize: '0.85rem', color: '#685949', fontWeight: 600 }}>
            {user?.fullName}
          </span>
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid rgba(137,115,84,0.25)',
            borderRadius: 9, padding: '5px 12px',
            fontSize: '0.8rem', color: '#685949', cursor: 'pointer', fontWeight: 600
          }}>Sign out</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* Sidebar */}
        <aside style={{
          width: 210, flexShrink: 0,
          background: 'rgba(248,243,234,0.85)',
          borderRight: '1px solid rgba(137,115,84,0.13)',
          padding: '20px 0',
        }}>
          <div style={{ padding: '0 16px 14px', borderBottom: '1px solid rgba(137,115,84,0.1)', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700,
              color: '#9d6f3b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Support portal
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#685949' }}>My account</p>
          </div>
          {[
            { key: 'tickets', label: 'My tickets', dot: '#3a5c1e' },
            { key: 'new',     label: 'New request', dot: 'rgba(137,115,84,0.3)' },
            { key: 'settings',label: 'Account settings', dot: 'rgba(137,115,84,0.3)' },
          ].map(item => (
            <div key={item.key}
              onClick={() => {
                setSidebarItem(item.key)
                if (item.key === 'new') setView('create')
                if (item.key === 'tickets') setView('list')
                if (item.key === 'settings') {
                  setView('list')
                  setSelectedTicket(null)
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 16px', cursor: 'pointer', fontSize: '0.875rem',
                fontWeight: sidebarItem === item.key ? 700 : 400,
                color: sidebarItem === item.key ? '#1f1b17' : '#685949',
                borderLeft: sidebarItem === item.key
                  ? '2.5px solid #3a5c1e' : '2.5px solid transparent',
                background: sidebarItem === item.key
                  ? 'rgba(137,115,84,0.07)' : 'none',
                transition: 'all 0.1s',
              }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%',
                background: item.dot, flexShrink: 0 }} />
              {item.label}
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '28px 32px', minWidth: 0 }}>

          {/* LIST VIEW */}
          {sidebarItem === 'tickets' && view === 'list' && (
            <>
              {/* CTA banner */}
              <div style={{
                background: 'rgba(228,240,217,0.7)',
                border: '1px solid rgba(88,140,50,0.2)',
                borderRadius: 16, padding: '16px 20px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 22,
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#2d4f14', fontSize: '0.95rem' }}>
                    Need help with something?
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#4a7a28' }}>
                    Our support team typically responds within 2 hours
                  </p>
                </div>
                <button onClick={() => { setView('create'); setSidebarItem('new') }} style={{
                  background: 'linear-gradient(135deg, #1d3b55, #31597d)',
                  color: '#f8f5ef', border: 0, borderRadius: 12,
                  padding: '9px 18px', fontWeight: 700,
                  fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap'
                }}>+ New ticket</button>
              </div>

              {/* Filter pills */}
              <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
                {FILTERS.map(f => {
                  const count = f.key === 'ALL'
                    ? tickets.length
                    : tickets.filter(t => t.status === f.key).length
                  return (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{
                      padding: '4px 13px', borderRadius: 20,
                      border: '1px solid rgba(137,115,84,0.2)',
                      background: filter === f.key ? '#1d3b55' : 'rgba(255,255,255,0.65)',
                      color: filter === f.key ? '#f8f5ef' : '#685949',
                      fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                    }}>
                      {f.label} ({count})
                    </button>
                  )
                })}
              </div>

              {/* Ticket cards */}
              <div style={{
                background: 'rgba(248,243,234,0.88)',
                border: '1px solid rgba(137,115,84,0.14)',
                borderRadius: 18, overflow: 'hidden'
              }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(137,115,84,0.1)' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#1f1b17', fontSize: '0.9rem' }}>
                    My tickets
                  </p>
                </div>

                {isLoading ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: '#685949' }}>
                    Loading...
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p style={{ color: '#685949', margin: '0 0 12px' }}>No tickets here yet.</p>
                    <button onClick={() => { setView('create'); setSidebarItem('new') }} style={{
                      background: 'linear-gradient(135deg, #1d3b55, #31597d)',
                      color: '#f8f5ef', border: 0, borderRadius: 10,
                      padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
                    }}>Create your first ticket</button>
                  </div>
                ) : filtered.map((ticket, i) => (
                  <div key={ticket.id}
                    onClick={() => { setSelectedTicket(ticket); setView('detail'); setSidebarItem('tickets') }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 20px', cursor: 'pointer',
                      borderBottom: i < filtered.length - 1 ? '1px solid rgba(137,115,84,0.09)' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(137,115,84,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: '0.75rem', color: '#9d8070',
                      width: 44, flexShrink: 0, fontWeight: 600 }}>#{ticket.id}</span>
                    <span style={{ flex: 1, fontWeight: 600, color: '#1f1b17',
                      fontSize: '0.9rem', whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ticket.subject}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                      <span style={{ fontSize: '0.75rem', color: '#9d8070', minWidth: 70, textAlign: 'right' }}>
                        {ticket.createdAt ? timeAgo(ticket.createdAt) : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {latestActivityTicket && (
                <section style={{
                  marginTop: 18,
                  background: 'rgba(248,243,234,0.9)',
                  border: '1px solid rgba(137,115,84,0.14)',
                  borderRadius: 18,
                  padding: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <p style={{ margin: '0 0 5px', color: '#9d6f3b',
                        fontSize: '0.8rem', fontWeight: 800 }}>
                        Latest ticket activity
                      </p>
                      <h2 style={{ margin: 0, color: '#1f1b17', fontSize: '1.2rem',
                        letterSpacing: '-0.03em' }}>
                        #{latestActivityTicket.id} — {latestActivityTicket.subject}
                      </h2>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <PriorityBadge priority={latestActivityTicket.priority} />
                      <StatusBadge status={latestActivityTicket.status} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap',
                    color: '#685949', fontSize: '0.8rem', fontWeight: 700, marginBottom: 14 }}>
                    <span>Created <strong style={{ color: '#1f1b17' }}>
                      {latestActivityTicket.createdAt ? timeAgo(latestActivityTicket.createdAt) : '—'}
                    </strong></span>
                    <span>Updated <strong style={{ color: '#1f1b17' }}>
                      {latestActivityTicket.updatedAt ? timeAgo(latestActivityTicket.updatedAt) : '—'}
                    </strong></span>
                    <span>Assigned <strong style={{ color: '#1f1b17' }}>
                      {latestActivityTicket.assignedToName || 'Unassigned'}
                    </strong></span>
                  </div>

                  <div style={{
                    background: 'rgba(251,248,243,0.92)',
                    border: '1px solid rgba(137,115,84,0.12)',
                    borderRadius: 12,
                    padding: '13px 15px',
                    color: '#4c4136',
                    lineHeight: 1.7,
                    fontSize: '0.9rem',
                    marginBottom: 0,
                  }}>
                    {latestActivityTicket.description}
                  </div>

                  <TicketActivity
                    ticketId={latestActivityTicket.id}
                    currentUserId={user?.id}
                    title={`Ticket #${latestActivityTicket.id} — activity`}
                    subtitle={latestActivityTicket.subject}
                    accentColor="#3a5c1e"
                    surfaceColor="rgba(248,243,234,0.9)"
                    borderColor="rgba(137,115,84,0.14)"
                    textColor="#1f1b17"
                    mutedColor="#685949"
                    inputColor="rgba(251,248,243,0.92)"
                  />
                </section>
              )}
            </>
          )}

          {/* CREATE VIEW */}
          {sidebarItem === 'new' && view === 'create' && (
            <>
              <button onClick={() => { setView('list'); setSidebarItem('tickets') }} style={{
                background: 'none', border: 'none', color: '#685949',
                fontSize: '0.85rem', cursor: 'pointer', marginBottom: 18,
                padding: 0, fontWeight: 600
              }}>← Back to tickets</button>

              <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 700,
                color: '#1f1b17', letterSpacing: '-0.03em' }}>New ticket</h1>
              <p style={{ margin: '0 0 22px', color: '#685949', fontSize: '0.875rem' }}>
                Describe your issue and we'll get back to you shortly
              </p>

              <form onSubmit={handleSubmit} style={{
                background: 'rgba(248,243,234,0.9)',
                border: '1px solid rgba(137,115,84,0.14)',
                borderRadius: 18, padding: 26,
                display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600
              }}>
                <label style={{ display: 'grid', gap: 6,
                  fontSize: '0.875rem', fontWeight: 700, color: '#4c4136' }}>
                  Subject
                  <input value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Brief summary of your issue"
                    style={{ padding: '11px 13px', borderRadius: 11,
                      border: '1px solid rgba(137,115,84,0.2)',
                      background: 'rgba(251,248,243,0.92)',
                      fontSize: '0.9rem', color: '#1f1b17', fontFamily: 'inherit' }} />
                </label>

                <label style={{ display: 'grid', gap: 6,
                  fontSize: '0.875rem', fontWeight: 700, color: '#4c4136' }}>
                  Description
                  <textarea value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe your issue in detail..."
                    rows={5}
                    style={{ padding: '11px 13px', borderRadius: 11,
                      border: '1px solid rgba(137,115,84,0.2)',
                      background: 'rgba(251,248,243,0.92)',
                      fontSize: '0.9rem', color: '#1f1b17',
                      resize: 'vertical', fontFamily: 'inherit' }} />
                </label>

                <label style={{ display: 'grid', gap: 6,
                  fontSize: '0.875rem', fontWeight: 700, color: '#4c4136' }}>
                  Priority
                  <select value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    style={{ padding: '11px 13px', borderRadius: 11,
                      border: '1px solid rgba(137,115,84,0.2)',
                      background: 'rgba(251,248,243,0.92)',
                      fontSize: '0.9rem', color: '#1f1b17', fontFamily: 'inherit' }}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </label>

                {formError && (
                  <p style={{ color: '#a63d2f', fontSize: '0.85rem', margin: 0 }}>{formError}</p>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="submit" disabled={isPending} style={{
                    background: 'linear-gradient(135deg, #1d3b55, #31597d)',
                    color: '#f8f5ef', border: 0, borderRadius: 11,
                    padding: '11px 22px', fontWeight: 700,
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    opacity: isPending ? 0.7 : 1, fontSize: '0.9rem'
                  }}>
                    {isPending ? 'Submitting...' : 'Submit ticket'}
                  </button>
                  <button type="button"
                    onClick={() => { setView('list'); setSidebarItem('tickets') }} style={{
                    background: 'none', border: '1px solid rgba(137,115,84,0.25)',
                    borderRadius: 11, padding: '11px 22px',
                    color: '#685949', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
                  }}>Cancel</button>
                </div>
              </form>
            </>
          )}

          {/* DETAIL VIEW */}
          {sidebarItem === 'tickets' && view === 'detail' && selectedTicket && (
            <>
              <button onClick={() => { setView('list'); setSidebarItem('tickets') }} style={{
                background: 'none', border: 'none', color: '#685949',
                fontSize: '0.85rem', cursor: 'pointer', marginBottom: 18,
                padding: 0, fontWeight: 600
              }}>← Back to tickets</button>

              <div style={{
                background: 'rgba(248,243,234,0.9)',
                border: '1px solid rgba(137,115,84,0.14)',
                borderRadius: 18, padding: 26
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
                  <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700,
                    color: '#1f1b17', letterSpacing: '-0.02em' }}>
                    {selectedTicket.subject}
                  </h1>
                  <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                    <PriorityBadge priority={selectedTicket.priority} />
                    <StatusBadge status={selectedTicket.status} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 18, marginBottom: 18,
                  fontSize: '0.8rem', color: '#685949', flexWrap: 'wrap' }}>
                  <span>Ticket <strong style={{ color: '#1f1b17' }}>#{selectedTicket.id}</strong></span>
                  <span>Created <strong style={{ color: '#1f1b17' }}>
                    {selectedTicket.createdAt ? timeAgo(selectedTicket.createdAt) : '—'}
                  </strong></span>
                  <span>Updated <strong style={{ color: '#1f1b17' }}>
                    {selectedTicket.updatedAt ? timeAgo(selectedTicket.updatedAt) : '—'}
                  </strong></span>
                  {selectedTicket.assignedTo && (
                    <span>Assigned to <strong style={{ color: '#1f1b17' }}>
                      {selectedTicket.assignedToName || `Agent #${selectedTicket.assignedTo}`}
                    </strong></span>
                  )}
                </div>

                <div style={{
                  background: 'rgba(251,248,243,0.92)',
                  border: '1px solid rgba(137,115,84,0.12)',
                  borderRadius: 12, padding: '14px 16px'
                }}>
                  <p style={{ margin: 0, color: '#4c4136', lineHeight: 1.7, fontSize: '0.9rem' }}>
                    {selectedTicket.description}
                  </p>
                </div>
              </div>

              <TicketActivity
                ticketId={selectedTicket.id}
                currentUserId={user?.id}
                accentColor="#3a5c1e"
                surfaceColor="rgba(248,243,234,0.9)"
                borderColor="rgba(137,115,84,0.14)"
              />
            </>
          )}

          {sidebarItem === 'settings' && (
            <>
              <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 700,
                color: '#1f1b17', letterSpacing: '-0.03em' }}>Account settings</h1>
              <p style={{ margin: '0 0 22px', color: '#685949', fontSize: '0.875rem' }}>
                Manage your support profile and session
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.25fr) minmax(280px, 0.75fr)',
                gap: 16,
                maxWidth: 920,
              }}>
                <section style={{
                  background: 'rgba(248,243,234,0.9)',
                  border: '1px solid rgba(137,115,84,0.14)',
                  borderRadius: 18,
                  padding: 24,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                    <div style={{
                      width: 54,
                      height: 54,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3a5c1e, #5a8a2e)',
                      color: '#f8f5ef',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '1rem',
                      fontWeight: 800,
                    }}>
                      {initials}
                    </div>
                    <div>
                      <p style={{ margin: 0, color: '#1f1b17', fontSize: '1.05rem',
                        fontWeight: 800 }}>
                        {user?.fullName}
                      </p>
                      <p style={{ margin: '4px 0 0', color: '#685949', fontSize: '0.86rem' }}>
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gap: 12 }}>
                    <label style={{
                      display: 'grid',
                      gridTemplateColumns: '130px 1fr',
                      gap: 12,
                      alignItems: 'center',
                      background: 'rgba(251,248,243,0.74)',
                      border: '1px solid rgba(137,115,84,0.1)',
                      borderRadius: 12,
                      padding: '12px 14px',
                    }}>
                      <span style={{ color: '#9d6f3b', fontSize: '0.78rem',
                        fontWeight: 800, textTransform: 'uppercase',
                        letterSpacing: '0.05em' }}>
                        Full name
                      </span>
                      <input value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                        style={{ border: '1px solid rgba(137,115,84,0.18)',
                          borderRadius: 9, background: 'rgba(255,255,255,0.6)',
                          color: '#1f1b17', padding: '9px 10px',
                          font: 'inherit', fontSize: '0.9rem', fontWeight: 700 }} />
                    </label>

                    {[
                      { label: 'Email address', value: user?.email || 'Not set' },
                      { label: 'Account type', value: 'Requester' },
                    ].map(item => (
                      <div key={item.label} style={{
                        display: 'grid',
                        gridTemplateColumns: '130px 1fr',
                        gap: 12,
                        alignItems: 'center',
                        background: 'rgba(251,248,243,0.74)',
                        border: '1px solid rgba(137,115,84,0.1)',
                        borderRadius: 12,
                        padding: '12px 14px',
                      }}>
                        <span style={{ color: '#9d6f3b', fontSize: '0.78rem',
                          fontWeight: 800, textTransform: 'uppercase',
                          letterSpacing: '0.05em' }}>
                          {item.label}
                        </span>
                        <span style={{ color: '#1f1b17', fontSize: '0.9rem',
                          fontWeight: 700 }}>
                          {item.value}
                        </span>
                      </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button disabled={isSavingProfile || profileName.trim() === user?.fullName}
                        style={{ background: 'linear-gradient(135deg, #1d3b55, #31597d)',
                          color: '#f8f5ef', border: 0, borderRadius: 10,
                          padding: '9px 16px', fontWeight: 800,
                          cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                          opacity: isSavingProfile || profileName.trim() === user?.fullName ? 0.65 : 1 }}>
                        {isSavingProfile ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                </section>

                <aside style={{
                  background: 'rgba(228,240,217,0.72)',
                  border: '1px solid rgba(88,140,50,0.18)',
                  borderRadius: 18,
                  padding: 22,
                  alignSelf: 'start',
                }}>
                  <p style={{ margin: '0 0 8px', color: '#2d4f14',
                    fontSize: '0.98rem', fontWeight: 800 }}>
                    Support access
                  </p>
                  <p style={{ margin: '0 0 18px', color: '#4a7a28',
                    fontSize: '0.84rem', lineHeight: 1.55 }}>
                    Your requester account can create tickets, reply to activity, and track support progress.
                  </p>
                  <div style={{
                    background: 'rgba(248,243,234,0.72)',
                    border: '1px solid rgba(88,140,50,0.14)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 14,
                  }}>
                    <p style={{ margin: '0 0 4px', color: '#3a5c1e',
                      fontSize: '0.76rem', fontWeight: 800 }}>
                      ACTIVE SESSION
                    </p>
                    <p style={{ margin: 0, color: '#2d4f14', fontSize: '0.88rem',
                      fontWeight: 700 }}>
                      Signed in as {user?.role?.toLowerCase()}
                    </p>
                  </div>
                  <button onClick={handleLogout} style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #1d3b55, #31597d)',
                    color: '#f8f5ef',
                    border: 0,
                    borderRadius: 11,
                    padding: '11px 16px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}>
                    Sign out
                  </button>
                </aside>
              </div>

              <section style={{
                marginTop: 16,
                maxWidth: 920,
                background: 'rgba(253,232,224,0.62)',
                border: '1px solid rgba(166,61,47,0.16)',
                borderRadius: 18,
                padding: 20,
              }}>
                <p style={{ margin: '0 0 6px', color: '#8a2c1a',
                  fontSize: '1rem', fontWeight: 800 }}>
                  Delete account
                </p>
                <p style={{ margin: '0 0 14px', color: '#7a4a3c',
                  fontSize: '0.86rem', lineHeight: 1.55 }}>
                  This permanently removes your requester account. If you have existing tickets or replies,
                  deletion may be blocked to preserve support history.
                </p>
                {confirmDeleteAccount ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => deleteAccount()} disabled={isDeletingAccount} style={{
                      background: '#a63d2f',
                      color: '#fff',
                      border: 0,
                      borderRadius: 10,
                      padding: '9px 14px',
                      fontWeight: 800,
                      cursor: isDeletingAccount ? 'not-allowed' : 'pointer',
                      opacity: isDeletingAccount ? 0.7 : 1,
                    }}>
                      {isDeletingAccount ? 'Deleting...' : 'Yes, delete my account'}
                    </button>
                    <button onClick={() => setConfirmDeleteAccount(false)} style={{
                      background: 'rgba(255,255,255,0.62)',
                      color: '#7a4a3c',
                      border: '1px solid rgba(166,61,47,0.18)',
                      borderRadius: 10,
                      padding: '9px 14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteAccount(true)} style={{
                    background: 'transparent',
                    color: '#a63d2f',
                    border: '1px solid rgba(166,61,47,0.24)',
                    borderRadius: 10,
                    padding: '9px 14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}>
                    Delete my account
                  </button>
                )}
              </section>
            </>
          )}
        </main>
      </div>
       {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
