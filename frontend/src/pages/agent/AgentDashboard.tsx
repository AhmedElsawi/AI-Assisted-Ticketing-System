import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTickets, updateTicket } from '../../api/tickets'
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

const STATUSES = ['Open', 'In-Progress', 'Resolved', 'Closed']
const STATUS_LABELS: Record<string, string> = {
  Open: 'Open',
  'In-Progress': 'In progress',
  Resolved: 'Resolved',
  Closed: 'Closed',
}

export default function AgentDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [view, setView]                     = useState<'kanban' | 'detail'>('kanban')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [sidebarItem, setSidebarItem]       = useState('queue')
  const [filterPriority, setFilterPriority] = useState('ALL')
  const [clearedActivityScope, setClearedActivityScope] = useState<string | null>(null)
  const { toast, show: showToast, hide: hideToast } = useToast()

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: fetchTickets,
    enabled: Boolean(user?.id),
  })

  const { mutate: patchTicket } = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Pick<Ticket, 'status' | 'priority' | 'assignedTo'>> }) =>
      updateTicket(id, updates),
        onSuccess: (updated) => {
        queryClient.invalidateQueries({ queryKey: ['tickets'] })
        if (selectedTicket?.id === updated.id) setSelectedTicket(updated)
        showToast('Ticket updated', 'success')
        },
        onError: () => showToast('Update failed', 'error'),

  })

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'
  const currentAgentId = Number(user?.id)

  const sortedTickets = [...tickets].sort((a, b) =>
    new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  )
  const overdue = tickets.filter(t =>
    t.status !== 'Resolved' && t.status !== 'Closed' &&
    t.createdAt && (Date.now() - new Date(t.createdAt).getTime()) > 1000 * 60 * 60 * 48
  )
  const queueTickets = sortedTickets.filter(t => t.assignedTo === currentAgentId)
  const unassignedTickets = sortedTickets.filter(t => t.assignedTo === null)
  const scopeTickets = sidebarItem === 'unassigned'
    ? unassignedTickets
    : sidebarItem === 'all'
      ? sortedTickets
      : sidebarItem === 'overdue'
        ? overdue
        : queueTickets
  const filteredTickets = scopeTickets.filter(t =>
    filterPriority === 'ALL' || t.priority === filterPriority
  )
  const latestActivityTicket = filteredTickets[0]

  const ticketsByStatus = (status: string) =>
    filteredTickets.filter(t => t.status === status)
  const queueTitle = sidebarItem === 'unassigned'
    ? 'Unassigned tickets'
    : sidebarItem === 'all'
      ? 'All tickets'
      : sidebarItem === 'overdue'
        ? 'Overdue tickets'
        : 'My queue'
  const queueSubtitle = sidebarItem === 'unassigned'
    ? 'Pick up open work that has not been assigned yet'
    : sidebarItem === 'all'
      ? 'View every ticket and open the chat history'
      : sidebarItem === 'overdue'
        ? 'Prioritize tickets older than 48 hours'
        : 'Tickets assigned to you'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'radial-gradient(circle at top left, #eef2f7 0%, #e4ecf5 42%, #dce6f0 100%)',
      fontFamily: '"Sora","Avenir Next","Segoe UI",sans-serif' }}>

      {/* Topbar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 54, flexShrink: 0,
        background: 'rgba(240,245,251,0.97)',
        borderBottom: '1px solid rgba(29,59,85,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #202c39, #47627a)',
            color: '#f8f5ef', display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: '0.85rem'
          }}>D</div>
          <span style={{ fontWeight: 700, color: '#1a2632', fontSize: '0.95rem' }}>Deskflow</span>
          <span style={{
            background: '#deeaf5', color: '#1d3b55', fontSize: '0.7rem',
            fontWeight: 700, padding: '2px 9px', borderRadius: 20,
            border: '1px solid rgba(29,59,85,0.2)', letterSpacing: '0.02em'
          }}>Agent</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.75rem', color: '#3a5c1e', fontWeight: 700 }}>
            ● Online
          </span>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1d3b55, #31597d)',
            color: '#f8f5ef', display: 'grid', placeItems: 'center',
            fontSize: '0.72rem', fontWeight: 700
          }}>{initials}</div>
          <span style={{ fontSize: '0.85rem', color: '#2d4a62', fontWeight: 600 }}>
            {user?.fullName}
          </span>
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid rgba(29,59,85,0.2)',
            borderRadius: 9, padding: '5px 12px',
            fontSize: '0.8rem', color: '#2d4a62', cursor: 'pointer', fontWeight: 600
          }}>Sign out</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* Sidebar */}
        <aside style={{
          width: 210, flexShrink: 0,
          background: 'rgba(240,245,251,0.85)',
          borderRight: '1px solid rgba(29,59,85,0.1)',
          padding: '20px 0',
        }}>
          <div style={{ padding: '0 16px 14px', borderBottom: '1px solid rgba(29,59,85,0.08)', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700,
              color: '#4a7aaa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Agent workspace
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#4a6a82' }}>Queue · Triage</p>
          </div>
          {[
            { key: 'queue',    label: `My queue (${queueTickets.length})`,       dot: '#1d3b55' },
            { key: 'unassigned', label: `Unassigned (${unassignedTickets.length})`, dot: unassignedTickets.length > 0 ? '#4a7aaa' : 'rgba(29,59,85,0.3)' },
            { key: 'all',      label: `All tickets (${tickets.length})`,          dot: 'rgba(29,59,85,0.3)' },
            { key: 'overdue',  label: `Overdue (${overdue.length})`,        dot: overdue.length > 0 ? '#a63d2f' : 'rgba(29,59,85,0.3)' },
          ].map(item => (
            <div key={item.key}
              onClick={() => {
                setSidebarItem(item.key)
                setView('kanban')
                setSelectedTicket(null)
                setClearedActivityScope(null)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 16px', cursor: 'pointer', fontSize: '0.875rem',
                fontWeight: sidebarItem === item.key ? 700 : 400,
                color: sidebarItem === item.key ? '#1a2632' : '#4a6a82',
                borderLeft: sidebarItem === item.key
                  ? '2.5px solid #1d3b55' : '2.5px solid transparent',
                background: sidebarItem === item.key
                  ? 'rgba(29,59,85,0.07)' : 'none',
                transition: 'all 0.1s',
              }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%',
                background: item.dot, flexShrink: 0 }} />
              {item.label}
            </div>
          ))}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: '24px 28px', minWidth: 0 }}>

          {/* KANBAN VIEW */}
          {view === 'kanban' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700,
                    color: '#1a2632', letterSpacing: '-0.03em' }}>
                    {queueTitle}
                  </h1>
                  <p style={{ margin: '3px 0 0', color: '#4a6a82', fontSize: '0.875rem' }}>
                    {queueSubtitle}
                  </p>
                </div>
                {/* Priority filter */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {['ALL', 'Urgent', 'High', 'Medium', 'Low'].map(p => (
                    <button key={p} onClick={() => setFilterPriority(p)} style={{
                      padding: '4px 12px', borderRadius: 20,
                      border: '1px solid rgba(29,59,85,0.15)',
                      background: filterPriority === p ? '#1d3b55' : 'rgba(255,255,255,0.6)',
                      color: filterPriority === p ? '#f8f5ef' : '#4a6a82',
                      fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                    }}>{p}</button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <p style={{ color: '#4a6a82' }}>Loading tickets...</p>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
                    {STATUSES.map(status => (
                      <div key={status} style={{
                        background: 'rgba(240,245,251,0.7)',
                        border: '1px solid rgba(29,59,85,0.1)',
                        borderRadius: 14, padding: 12,
                      }}>
                        {/* Column header */}
                        <div style={{ display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700,
                            color: '#4a6a82', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {STATUS_LABELS[status]}
                          </span>
                          <span style={{
                            background: 'rgba(29,59,85,0.1)', color: '#2d4a62',
                            borderRadius: 20, padding: '1px 8px',
                            fontSize: '0.72rem', fontWeight: 700
                          }}>
                            {ticketsByStatus(status).length}
                          </span>
                        </div>

                        {/* Cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {ticketsByStatus(status).length === 0 ? (
                            <div style={{ padding: '20px 0', textAlign: 'center',
                              fontSize: '0.75rem', color: 'rgba(29,59,85,0.3)' }}>
                              Empty
                            </div>
                          ) : ticketsByStatus(status).map(ticket => (
                            <div key={ticket.id}
                              onClick={() => { setSelectedTicket(ticket); setView('detail') }}
                              style={{
                                background: 'rgba(255,255,255,0.85)',
                                border: '1px solid rgba(29,59,85,0.1)',
                                borderRadius: 10, padding: '10px 12px',
                                cursor: 'pointer', transition: 'border-color 0.1s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(29,59,85,0.3)')}
                              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(29,59,85,0.1)')}
                            >
                              <p style={{ margin: '0 0 7px', fontWeight: 600,
                                color: '#1a2632', fontSize: '0.82rem',
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap' }}>
                                {ticket.subject}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between', gap: 6 }}>
                                <PriorityBadge priority={ticket.priority} />
                                <span style={{ fontSize: '0.7rem', color: '#6a8aa2' }}>
                                  #{ticket.id} · {ticket.createdAt ? timeAgo(ticket.createdAt) : ''}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {latestActivityTicket && clearedActivityScope !== `${sidebarItem}:${filterPriority}` && (
                    <section style={{
                      marginTop: 18,
                      background: 'rgba(240,245,251,0.9)',
                      border: '1px solid rgba(29,59,85,0.12)',
                      borderRadius: 18,
                      padding: 22,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                        gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                        <div>
                          <p style={{ margin: '0 0 5px', color: '#4a7aaa',
                            fontSize: '0.78rem', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Latest ticket activity
                          </p>
                          <h2 style={{ margin: 0, color: '#1a2632', fontSize: '1.2rem',
                            lineHeight: 1.2, letterSpacing: '-0.03em' }}>
                            #{latestActivityTicket.id} — {latestActivityTicket.subject}
                          </h2>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button onClick={() => patchTicket({ id: latestActivityTicket.id, updates: { assignedTo: Number(user?.id) } })}
                            style={{ padding: '7px 14px', borderRadius: 9,
                              border: '1px solid rgba(29,59,85,0.2)',
                              background: 'rgba(255,255,255,0.8)', color: '#1d3b55',
                              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                            Assign to me
                          </button>
                          <button onClick={() => { setSelectedTicket(latestActivityTicket); setView('detail') }}
                            style={{ padding: '7px 14px', borderRadius: 9,
                              border: '1px solid rgba(29,59,85,0.2)',
                              background: 'rgba(255,255,255,0.8)', color: '#1d3b55',
                              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                            Update status
                          </button>
                          <button onClick={() => setClearedActivityScope(`${sidebarItem}:${filterPriority}`)}
                            style={{ padding: '7px 14px', borderRadius: 9,
                              border: '1px solid rgba(29,59,85,0.2)',
                              background: 'rgba(255,255,255,0.8)', color: '#1d3b55',
                              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                            Clear
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap',
                        color: '#4a6a82', fontSize: '0.8rem', fontWeight: 700, marginBottom: 14 }}>
                        <span>Requester: <strong style={{ color: '#1a2632' }}>
                          {latestActivityTicket.createdByName || `#${latestActivityTicket.createdBy}`}
                        </strong></span>
                        <span>Assigned: <strong style={{ color: '#1a2632' }}>
                          {latestActivityTicket.assignedToName || 'Unassigned'}
                        </strong></span>
                        <span>Created: <strong style={{ color: '#1a2632' }}>
                          {latestActivityTicket.createdAt ? timeAgo(latestActivityTicket.createdAt) : '—'}
                        </strong></span>
                        <PriorityBadge priority={latestActivityTicket.priority} />
                        <StatusBadge status={latestActivityTicket.status} />
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(29,59,85,0.1)',
                        borderRadius: 10, padding: '13px 15px', color: '#2d4a62',
                        fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 0 }}>
                        {latestActivityTicket.description}
                      </div>

                      <TicketActivity
                        ticketId={latestActivityTicket.id}
                        currentUserId={user?.id}
                        title={`Ticket #${latestActivityTicket.id} — activity`}
                        subtitle={latestActivityTicket.subject}
                        accentColor="#1d3b55"
                        surfaceColor="rgba(240,245,251,0.9)"
                        borderColor="rgba(29,59,85,0.12)"
                        textColor="#1a2632"
                        mutedColor="#4a6a82"
                        inputColor="rgba(255,255,255,0.7)"
                      />
                    </section>
                  )}
                </>
              )}
            </>
          )}

          {/* DETAIL VIEW */}
          {view === 'detail' && selectedTicket && (
            <>
              <button onClick={() => setView('kanban')} style={{
                background: 'none', border: 'none', color: '#4a6a82',
                fontSize: '0.85rem', cursor: 'pointer',
                marginBottom: 18, padding: 0, fontWeight: 600
              }}>← Back to queue</button>

              <div style={{
                background: 'rgba(240,245,251,0.9)',
                border: '1px solid rgba(29,59,85,0.12)',
                borderRadius: 18, padding: 26, marginBottom: 14
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
                  <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700,
                    color: '#1a2632', letterSpacing: '-0.02em' }}>
                    {selectedTicket.subject}
                  </h1>
                  <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                    <PriorityBadge priority={selectedTicket.priority} />
                    <StatusBadge status={selectedTicket.status} />
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 16,
                  fontSize: '0.8rem', color: '#4a6a82', flexWrap: 'wrap' }}>
                  <span>Ticket <strong style={{ color: '#1a2632' }}>#{selectedTicket.id}</strong></span>
                  <span>Created <strong style={{ color: '#1a2632' }}>
                    {selectedTicket.createdAt ? timeAgo(selectedTicket.createdAt) : '—'}
                  </strong></span>
                  <span>Updated <strong style={{ color: '#1a2632' }}>
                    {selectedTicket.updatedAt ? timeAgo(selectedTicket.updatedAt) : '—'}
                  </strong></span>
                  <span>Requester <strong style={{ color: '#1a2632' }}>
                    {selectedTicket.createdByName || `#${selectedTicket.createdBy}`}
                  </strong></span>
                  {selectedTicket.assignedTo && (
                    <span>Assigned to <strong style={{ color: '#1a2632' }}>
                      {selectedTicket.assignedToName || `Agent #${selectedTicket.assignedTo}`}
                    </strong></span>
                  )}
                </div>

                {/* Description */}
                <div style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(29,59,85,0.1)',
                  borderRadius: 10, padding: '13px 15px', marginBottom: 20
                }}>
                  <p style={{ margin: 0, color: '#2d4a62', lineHeight: 1.7, fontSize: '0.875rem' }}>
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Quick actions */}
                <div>
                  <p style={{ margin: '0 0 10px', fontSize: '0.78rem', fontWeight: 700,
                    color: '#4a6a82', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Quick actions
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {/* Assign to me */}
                    <button
                      onClick={() => patchTicket({ id: selectedTicket.id, updates: { assignedTo: Number(user?.id) } })}
                      style={{
                        padding: '7px 14px', borderRadius: 9,
                        border: '1px solid rgba(29,59,85,0.2)',
                        background: 'rgba(255,255,255,0.8)',
                        color: '#1d3b55', fontSize: '0.8rem',
                        fontWeight: 700, cursor: 'pointer'
                      }}>
                      Assign to me
                    </button>

                    {/* Status buttons */}
                    {STATUSES.filter(s => s !== selectedTicket.status).map(s => (
                      <button key={s}
                        onClick={() => patchTicket({ id: selectedTicket.id, updates: { status: s } })}
                        style={{
                          padding: '7px 14px', borderRadius: 9,
                          border: '1px solid rgba(29,59,85,0.2)',
                          background: 'rgba(255,255,255,0.8)',
                          color: '#1d3b55', fontSize: '0.8rem',
                          fontWeight: 700, cursor: 'pointer'
                        }}>
                        Set {STATUS_LABELS[s]}
                      </button>
                    ))}

                    {/* Priority buttons */}
                    {['Low','Medium','High','Urgent']
                      .filter(p => p !== selectedTicket.priority)
                      .map(p => (
                        <button key={p}
                          onClick={() => patchTicket({ id: selectedTicket.id, updates: { priority: p } })}
                          style={{
                            padding: '7px 14px', borderRadius: 9,
                            border: '1px solid rgba(137,115,84,0.2)',
                            background: 'rgba(255,255,255,0.8)',
                            color: '#685949', fontSize: '0.8rem',
                            fontWeight: 700, cursor: 'pointer'
                          }}>
                          Priority: {p}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <TicketActivity
                ticketId={selectedTicket.id}
                currentUserId={user?.id}
                accentColor="#1d3b55"
                surfaceColor="rgba(240,245,251,0.9)"
                borderColor="rgba(29,59,85,0.12)"
              />
            </>
          )}
        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
