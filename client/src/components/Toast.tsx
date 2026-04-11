import { useEffect, useRef, useState } from 'react'
import type { Action } from '../types'

export interface ToastState {
  id: string
  title: string
  action: Action
}

interface Props {
  toast: ToastState | null
  onDismiss: () => void
}

const PAST_TENSE: Record<Action, string> = {
  claim: 'claimed',
  approve: 'approved',
  reject: 'rejected',
  escalate: 'escalated'
}

const AUTO_HIDE_MS = 5000
const FADE_MS = 200

export default function Toast({ toast, onDismiss }: Props) {
  const [hiding, setHiding] = useState(false)

  // Keep onDismiss in a ref so the timer effect does not depend on its
  // identity. Parents that recreate the callback on every render would
  // otherwise cause the effect to tear down and reschedule continuously,
  // cancelling the auto-hide before it can fire.
  const onDismissRef = useRef(onDismiss)
  useEffect(() => {
    onDismissRef.current = onDismiss
  })

  useEffect(() => {
    if (!toast) return
    setHiding(false)
    const fadeOut = setTimeout(() => setHiding(true), AUTO_HIDE_MS - FADE_MS)
    const kill = setTimeout(() => onDismissRef.current(), AUTO_HIDE_MS)
    return () => {
      clearTimeout(fadeOut)
      clearTimeout(kill)
    }
  }, [toast])

  if (!toast) return null

  function handleClose() {
    setHiding(true)
    setTimeout(() => onDismissRef.current(), FADE_MS)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-200 ${
        hiding ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-2xl">
        <div className="flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{toast.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            has been <span className="font-medium text-slate-700">{PAST_TENSE[toast.action]}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Dismiss notification"
          className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <span aria-hidden className="block h-4 w-4 text-center leading-none">×</span>
        </button>
      </div>
    </div>
  )
}
