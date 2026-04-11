import { urgencyReason, waitingSince } from '../format'
import type { ReviewItem } from '../types'

interface Props {
  items: ReviewItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const RISK_STYLE: Record<ReviewItem['risk_level'], string> = {
  high: 'bg-rose-100 text-rose-700 ring-rose-200',
  medium: 'bg-amber-100 text-amber-800 ring-amber-200',
  low: 'bg-slate-100 text-slate-600 ring-slate-200'
}

const TIER_STYLE: Record<ReviewItem['customer_tier'], string> = {
  priority: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  standard: 'bg-slate-50 text-slate-600 ring-slate-200'
}

const STATUS_STYLE: Record<ReviewItem['status'], string> = {
  unassigned: 'bg-slate-100 text-slate-600',
  in_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  escalated: 'bg-amber-100 text-amber-800'
}

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
      {children}
    </span>
  )
}

export default function QueueList({ items, selectedId, onSelect }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Queue is empty. Nothing to review.
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const selected = item.id === selectedId
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded-lg border p-4 text-left transition ${
                selected
                  ? 'border-indigo-400 bg-indigo-50/60 shadow-sm ring-1 ring-indigo-200'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{item.id}</span>
                    <span className="text-slate-300">·</span>
                    <span>{waitingSince(item.submitted_at)}</span>
                  </div>
                  <div className="mt-1 truncate text-sm font-medium text-slate-900">
                    {item.title}
                  </div>
                </div>
                <Chip className={STATUS_STYLE[item.status]}>
                  {item.status === 'in_review' ? 'in review' : item.status}
                </Chip>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Chip className={RISK_STYLE[item.risk_level]}>{item.risk_level} risk</Chip>
                <Chip className={TIER_STYLE[item.customer_tier]}>{item.customer_tier}</Chip>
                {item.assigned_reviewer && (
                  <span className="text-xs text-slate-500">
                    claimed by <span className="font-medium text-slate-700">{item.assigned_reviewer}</span>
                  </span>
                )}
              </div>

              <div className="mt-2 text-xs italic text-slate-500">
                Why at the top: {urgencyReason(item.risk_level, item.customer_tier, item.submitted_at)}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
