export default function PriorityBadge({ priority }: { priority: string }) {
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