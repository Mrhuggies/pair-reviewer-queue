// Mirror of server types. Kept in sync by hand — the surface is small.

export const STATUSES = ['unassigned', 'in_review', 'approved', 'rejected', 'escalated'] as const
export type Status = typeof STATUSES[number]

export const TERMINAL_STATUSES: ReadonlySet<Status> = new Set(['approved', 'rejected', 'escalated'])

export const ACTIONS = ['claim', 'approve', 'reject', 'escalate'] as const
export type Action = typeof ACTIONS[number]

export type RiskLevel = 'low' | 'medium' | 'high'
export type CustomerTier = 'standard' | 'priority'

export interface ReviewItem {
  id: string
  title: string
  submitted_at: string
  risk_level: RiskLevel
  customer_tier: CustomerTier
  status: Status
  assigned_reviewer: string | null
  notes_count: number
  summary: string
}

export interface ApiError {
  error: { code: string; message: string }
}

export const REVIEWERS = ['alex', 'sam', 'morgan'] as const
export type Reviewer = typeof REVIEWERS[number]
