import { waitingSince } from '../format'
import type { Action, ReviewItem } from '../types'
import ActionButtons from './ActionButtons'

interface Props {
  item: ReviewItem
  reviewer: string
  pending: Action | null
  actionError: string | null
  onAction: (action: Action) => void
}

const STATUS_LABEL: Record<ReviewItem['status'], string> = {
  unassigned: 'Unassigned',
  in_review: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
  escalated: 'Escalated'
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm text-slate-800">{children}</div>
    </div>
  )
}

export default function ItemDetail({ item, reviewer, pending, actionError, onAction }: Props) {
  return (
    <section className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-6">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="font-mono text-xs text-slate-500">{item.id}</div>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{item.title}</h2>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-slate-400">Status</div>
          <div className="mt-0.5 text-sm font-medium text-slate-800">{STATUS_LABEL[item.status]}</div>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-2 gap-4 py-4">
        <Field label="Risk level">{item.risk_level}</Field>
        <Field label="Customer tier">{item.customer_tier}</Field>
        <Field label="Submitted">
          {new Date(item.submitted_at).toUTCString()}
          <div className="text-xs text-slate-500">{waitingSince(item.submitted_at)}</div>
        </Field>
        <Field label="Assigned reviewer">
          {item.assigned_reviewer ?? <span className="text-slate-400">unassigned</span>}
        </Field>
        <div className="col-span-2">
          <Field label="Summary">{item.summary}</Field>
        </div>
        <div className="col-span-2">
          <Field label="Notes">{item.notes_count} notes on file</Field>
        </div>
      </div>

      <footer className="border-t border-slate-100 pt-4">
        <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Actions</div>
        <ActionButtons
          item={item}
          reviewer={reviewer}
          pending={pending}
          onAction={onAction}
        />
        {actionError && (
          <p className="mt-2 text-sm text-rose-600">{actionError}</p>
        )}
      </footer>
    </section>
  )
}
