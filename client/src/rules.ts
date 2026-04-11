import { TERMINAL_STATUSES, type Action, type ReviewItem } from './types'

// Client mirror of the server's canPerform. The server is the source of
// truth; this exists so disabled buttons can show the reviewer why an
// action is unavailable without waiting for a round trip.

export type RuleResult =
  | { ok: true }
  | { ok: false; reason: string }

export function canPerform(
  item: ReviewItem,
  action: Action,
  reviewer: string
): RuleResult {
  if (TERMINAL_STATUSES.has(item.status)) {
    return { ok: false, reason: `already ${item.status}` }
  }

  if (action === 'claim') {
    if (item.status !== 'unassigned') {
      return { ok: false, reason: `already ${item.status}` }
    }
    return { ok: true }
  }

  // approve / reject / escalate
  if (item.status !== 'in_review') {
    return { ok: false, reason: 'item must be in review' }
  }
  if (item.assigned_reviewer !== reviewer) {
    return { ok: false, reason: `assigned to ${item.assigned_reviewer}` }
  }
  return { ok: true }
}
