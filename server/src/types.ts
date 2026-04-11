export const STATUSES = ['unassigned', 'in_review', 'approved', 'rejected', 'escalated'] as const
export type Status = typeof STATUSES[number]

export const TERMINAL_STATUSES: ReadonlySet<Status> = new Set(['approved', 'rejected', 'escalated'])

export const ACTIONS = ['claim', 'approve', 'reject', 'escalate'] as const
export type Action = typeof ACTIONS[number]

export const RISK_LEVELS = ['low', 'medium', 'high'] as const
export type RiskLevel = typeof RISK_LEVELS[number]

export const RISK_RANK: Record<RiskLevel, number> = { high: 3, medium: 2, low: 1 }

export const CUSTOMER_TIERS = ['standard', 'priority'] as const
export type CustomerTier = typeof CUSTOMER_TIERS[number]

export const TIER_RANK: Record<CustomerTier, number> = { priority: 2, standard: 1 }

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
