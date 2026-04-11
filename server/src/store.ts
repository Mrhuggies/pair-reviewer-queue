import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  STATUSES,
  RISK_LEVELS,
  CUSTOMER_TIERS,
  TERMINAL_STATUSES,
  RISK_RANK,
  TIER_RANK,
  type ReviewItem,
  type Status,
  type RiskLevel,
  type CustomerTier,
  type Action
} from './types.js'
import { canPerform, applyAction } from './rules.js'

const here = dirname(fileURLToPath(import.meta.url))
const SEED_PATH = resolve(here, '../../data/review_items.json')

const ISO_Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/

export function normaliseReviewer(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error(`reviewer must be a string`)
  }
  const trimmed = value.trim().toLowerCase()
  if (trimmed.length === 0) {
    throw new Error('reviewer must not be empty')
  }
  return trimmed
}

function assertSeedRow(raw: unknown, index: number): ReviewItem {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`seed row ${index} is not an object`)
  }
  const r = raw as Record<string, unknown>

  if (typeof r.id !== 'string' || r.id.length === 0) {
    throw new Error(`seed row ${index} has an invalid id`)
  }
  if (typeof r.title !== 'string') {
    throw new Error(`seed row ${r.id} has an invalid title`)
  }
  if (typeof r.summary !== 'string') {
    throw new Error(`seed row ${r.id} has an invalid summary`)
  }
  if (typeof r.submitted_at !== 'string' || !ISO_Z.test(r.submitted_at)) {
    throw new Error(`seed row ${r.id} has an invalid submitted_at: ${String(r.submitted_at)}`)
  }
  if (!STATUSES.includes(r.status as Status)) {
    throw new Error(`seed row ${r.id} has an invalid status: ${String(r.status)}`)
  }
  if (!RISK_LEVELS.includes(r.risk_level as RiskLevel)) {
    throw new Error(`seed row ${r.id} has an invalid risk_level: ${String(r.risk_level)}`)
  }
  if (!CUSTOMER_TIERS.includes(r.customer_tier as CustomerTier)) {
    throw new Error(`seed row ${r.id} has an invalid customer_tier: ${String(r.customer_tier)}`)
  }
  if (typeof r.notes_count !== 'number' || !Number.isFinite(r.notes_count) || r.notes_count < 0) {
    throw new Error(`seed row ${r.id} has an invalid notes_count`)
  }

  let assigned: string | null
  if (r.assigned_reviewer === null) {
    assigned = null
  } else if (typeof r.assigned_reviewer === 'string') {
    assigned = normaliseReviewer(r.assigned_reviewer)
  } else {
    throw new Error(`seed row ${r.id} has an invalid assigned_reviewer`)
  }

  // Invariants for non-terminal rows.
  // unassigned items must carry a null reviewer.
  // in_review items must carry a non-null reviewer.
  // Terminal rows may carry either (they record history).
  const status = r.status as Status
  if (status === 'unassigned' && assigned !== null) {
    throw new Error(`seed row ${r.id} is unassigned but has a reviewer`)
  }
  if (status === 'in_review' && assigned === null) {
    throw new Error(`seed row ${r.id} is in_review but has no reviewer`)
  }

  return {
    id: r.id,
    title: r.title,
    submitted_at: r.submitted_at,
    risk_level: r.risk_level as RiskLevel,
    customer_tier: r.customer_tier as CustomerTier,
    status,
    assigned_reviewer: assigned,
    notes_count: r.notes_count,
    summary: r.summary
  }
}

function loadSeed(): ReviewItem[] {
  const raw = readFileSync(SEED_PATH, 'utf8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error('seed file must be a JSON array')
  }
  return parsed.map(assertSeedRow)
}

const items: ReviewItem[] = loadSeed()

function compareForQueue(a: ReviewItem, b: ReviewItem): number {
  const r = RISK_RANK[b.risk_level] - RISK_RANK[a.risk_level]
  if (r !== 0) return r
  const t = TIER_RANK[b.customer_tier] - TIER_RANK[a.customer_tier]
  if (t !== 0) return t
  // oldest first — older items have waited longer, so they outrank
  const aMs = Date.parse(a.submitted_at)
  const bMs = Date.parse(b.submitted_at)
  if (aMs !== bMs) return aMs - bMs
  // deterministic tiebreaker so identical tuples do not flip between requests
  return a.id.localeCompare(b.id)
}

export function getActiveQueue(): ReviewItem[] {
  return items
    .filter((it) => !TERMINAL_STATUSES.has(it.status))
    .slice()
    .sort(compareForQueue)
}

export function getById(id: string): ReviewItem | undefined {
  return items.find((it) => it.id === id)
}

export type ActionResult =
  | { ok: true; item: ReviewItem }
  | { ok: false; code: string; message: string; httpStatus: 400 | 404 }

export function performAction(id: string, action: Action, reviewerRaw: unknown): ActionResult {
  let reviewer: string
  try {
    reviewer = normaliseReviewer(reviewerRaw)
  } catch (e) {
    return { ok: false, code: 'BAD_REVIEWER', message: (e as Error).message, httpStatus: 400 }
  }

  const idx = items.findIndex((it) => it.id === id)
  if (idx === -1) {
    return { ok: false, code: 'NOT_FOUND', message: `no item with id ${id}`, httpStatus: 404 }
  }

  const current = items[idx]
  const check = canPerform(current, action, reviewer)
  if (!check.ok) {
    return { ok: false, code: check.code, message: check.message, httpStatus: 400 }
  }

  items[idx] = applyAction(current, action, reviewer)
  return { ok: true, item: items[idx] }
}
