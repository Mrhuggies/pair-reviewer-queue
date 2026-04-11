// Humanised waiting-time phrasing. The queue list and detail panel
// both use this so a reviewer sees "waiting 2d" instead of a raw
// ISO timestamp.

export function waitingSince(isoZ: string, now: number = Date.now()): string {
  const parsed = Date.parse(isoZ)
  if (Number.isNaN(parsed)) return '—'
  const delta = Math.max(0, now - parsed)
  const seconds = Math.floor(delta / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `waiting ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `waiting ${hours}h`
  const days = Math.floor(hours / 24)
  return `waiting ${days}d`
}

export function urgencyReason(
  risk: 'low' | 'medium' | 'high',
  tier: 'standard' | 'priority',
  submittedAt: string,
  now: number = Date.now()
): string {
  const bits: string[] = []
  bits.push(`${risk.charAt(0).toUpperCase()}${risk.slice(1)} risk`)
  bits.push(tier === 'priority' ? 'Priority' : 'Standard')
  bits.push(waitingSince(submittedAt, now))
  return bits.join(' · ')
}
