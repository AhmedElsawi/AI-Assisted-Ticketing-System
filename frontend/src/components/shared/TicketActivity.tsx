import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTicketComment, fetchTicketComments } from '../../api/comments'
import { timeAgo } from '../../utils/timeAgo'

interface TicketActivityProps {
  ticketId: number
  currentUserId?: string | number | null
  title?: string
  subtitle?: string
  accentColor?: string
  surfaceColor?: string
  borderColor?: string
  textColor?: string
  mutedColor?: string
  inputColor?: string
}

export default function TicketActivity({
  ticketId,
  currentUserId,
  title = 'Ticket activity',
  subtitle = 'Chat history between requester, agents, and admins',
  accentColor = '#1d3b55',
  surfaceColor = 'rgba(255,255,255,0.65)',
  borderColor = 'rgba(29,59,85,0.12)',
  textColor = '#20242a',
  mutedColor = '#68717b',
  inputColor = 'rgba(255,255,255,0.72)',
}: TicketActivityProps) {
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: () => fetchTicketComments(ticketId),
  })

  const { mutate: sendComment, isPending } = useMutation({
    mutationFn: () => createTicketComment(ticketId, body.trim()),
    onSuccess: () => {
      setBody('')
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] })
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!body.trim()) return
    sendComment()
  }

  const initials = (name: string) =>
    name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <section style={{
      background: surfaceColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 14,
      padding: 16,
      marginTop: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 800, color: textColor, fontSize: '0.98rem' }}>
            {title}
          </p>
          <p style={{ margin: '3px 0 0', color: mutedColor, fontSize: '0.8rem' }}>
            {subtitle}
          </p>
        </div>
        <span style={{ color: mutedColor, fontSize: '0.78rem', fontWeight: 700 }}>
          {comments.length} {comments.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 12, marginBottom: 14 }}>
        {isLoading ? (
          <p style={{ margin: 0, color: mutedColor, fontSize: '0.85rem' }}>Loading activity...</p>
        ) : comments.length === 0 ? (
          <div style={{
            border: `1px dashed ${borderColor}`,
            borderRadius: 10,
            padding: '18px 14px',
            color: mutedColor,
            fontSize: '0.86rem',
            textAlign: 'center',
          }}>
            No replies yet. Start the conversation below.
          </div>
        ) : comments.map(comment => {
          const isCurrentUser = String(comment.authorId) === String(currentUserId)

          return (
            <article key={comment.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: isCurrentUser ? accentColor : '#eef2f7',
                color: isCurrentUser ? '#fff' : '#2b3a48',
                display: 'grid',
                placeItems: 'center',
                fontSize: '0.72rem',
                fontWeight: 800,
                flexShrink: 0,
              }}>
                {initials(comment.authorName)}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                  <strong style={{ color: textColor, fontSize: '0.85rem' }}>
                    {isCurrentUser ? 'You' : comment.authorName}
                  </strong>
                  {comment.authorRole && (
                    <span style={{ color: mutedColor, fontSize: '0.75rem' }}>
                      {comment.authorRole.toLowerCase()}
                    </span>
                  )}
                  <span style={{ color: mutedColor, opacity: 0.8, fontSize: '0.75rem' }}>
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', color: textColor, opacity: 0.86, lineHeight: 1.55, fontSize: '0.88rem' }}>
                  {comment.body}
                </p>
              </div>
            </article>
          )
        })}
      </div>

      <form className="ticket-reply-form" onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={body}
          onChange={event => setBody(event.target.value)}
          placeholder="Add a reply..."
          style={{
            flex: 1,
            minWidth: 0,
            border: `1px solid ${borderColor}`,
            borderRadius: 9,
            background: inputColor,
            color: textColor,
            padding: '10px 12px',
            font: 'inherit',
            fontSize: '0.88rem',
          }}
        />
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          style={{
            border: 0,
            borderRadius: 10,
            background: accentColor,
            color: '#fff',
            padding: '0 18px',
            fontWeight: 800,
            cursor: isPending || !body.trim() ? 'not-allowed' : 'pointer',
            opacity: isPending || !body.trim() ? 0.65 : 1,
          }}
        >
          Send
        </button>
      </form>
    </section>
  )
}
