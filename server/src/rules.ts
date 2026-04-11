import { TERMINAL_STATUSES, type Action, type ReviewItem } from './types.js'

export type RuleResult =
  | { ok: true }
  | { ok: false; code: string; message: string }

// Pure state machine. Server and client both lean on this to decide
// whether an action is allowed. The server is the source of truth;
// the client mirrors for button enable/disable.
export function canPerform(
  item: ReviewItem,
  action: Action,
  reviewer: string
): RuleResult {
  // Terminal guard runs before any action branch so a corrupted or
  // stale row cannot slip through into an action path.
  if (TERMINAL_STATUSES.has(item.status)) {
    return {
      ok: false,
      code: 'TERMINAL_STATE',
      message: `item is ${item.status} and cannot be actioned further`
    }
  }

  switch (action) {
    case 'claim':
      if (item.status !== 'unassigned') {
        return {
          ok: false,
          code: 'NOT_CLAIMABLE',
          message: `only unassigned items can be claimed (this item is ${item.status})`
        }
      }
      return { ok: true }

    case 'approve':
    case 'reject':
    case 'escalate':
      if (item.status !== 'in_review') {
        return {
          ok: false,
          code: 'NOT_IN_REVIEW',
          message: `action ${action} requires in_review status (got ${item.status})`
        }
      }
      if (item.assigned_reviewer !== reviewer) {
        return {
          ok: false,
          code: 'NOT_ASSIGNED',
          message: `only the assigned reviewer (${item.assigned_reviewer}) can ${action} this item`
        }
      }
      return { ok: true }
  }
}

export function applyAction(
  item: ReviewItem,
  action: Action,
  reviewer: string
): ReviewItem {
  switch (action) {
    case 'claim':
      return { ...item, status: 'in_review', assigned_reviewer: reviewer }
    case 'approve':
      return { ...item, status: 'approved' }
    case 'reject':
      return { ...item, status: 'rejected' }
    case 'escalate':
      return { ...item, status: 'escalated' }
  }
}
