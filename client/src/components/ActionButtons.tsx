import { canPerform } from '../rules'
import { ACTIONS, type Action, type ReviewItem } from '../types'

interface Props {
  item: ReviewItem
  reviewer: string
  pending: Action | null
  onAction: (action: Action) => void
}

const LABELS: Record<Action, string> = {
  claim: 'Claim',
  approve: 'Approve',
  reject: 'Reject',
  escalate: 'Escalate'
}

const STYLES: Record<Action, string> = {
  claim: 'bg-indigo-600 text-white hover:bg-indigo-500',
  approve: 'bg-emerald-600 text-white hover:bg-emerald-500',
  reject: 'bg-rose-600 text-white hover:bg-rose-500',
  escalate: 'bg-amber-500 text-white hover:bg-amber-400'
}

export default function ActionButtons({ item, reviewer, pending, onAction }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => {
        const check = canPerform(item, action, reviewer)
        const isPending = pending === action
        const disabled = !check.ok || pending !== null
        const reason = check.ok ? '' : check.reason
        return (
          <button
            key={action}
            type="button"
            disabled={disabled}
            title={reason}
            onClick={() => onAction(action)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 ${
              disabled ? '' : STYLES[action]
            }`}
          >
            {isPending ? '…' : LABELS[action]}
          </button>
        )
      })}
    </div>
  )
}
