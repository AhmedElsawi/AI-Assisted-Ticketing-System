export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    Open:        { bg: '#f0ebe3', color: '#6b5040', label: 'Open' },
    'In-Progress': { bg: '#deeaf5', color: '#1d3b55', label: 'In progress' },
    Resolved:    { bg: '#e4f0d9', color: '#3a5c1e', label: 'Resolved' },
    Closed:      { bg: '#eeebe6', color: '#7a6a55', label: 'Closed' },
  }
  const s = map[status] || map.Open
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px',
      borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
      {s.label}
    </span>
  )
}
