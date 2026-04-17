export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minute = Math.floor(diff / 60000)
  const hour = Math.floor(minute / 60)
  const day = Math.floor(hour / 24)

  if (minute < 1) return 'now'
  if (minute < 60) return `${minute}min ago`
  if (hour < 24) return `${hour}h ago`
  if (day === 1) return 'Yesterday'
  return `${day}d ago`
}
