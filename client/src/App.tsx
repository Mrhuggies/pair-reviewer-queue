import { useEffect, useState } from 'react'
import { fetchItem, fetchQueue, submitAction } from './api'
import QueueList from './components/QueueList'
import ItemDetail from './components/ItemDetail'
import {
  REVIEWERS,
  TERMINAL_STATUSES,
  type Action,
  type Reviewer,
  type ReviewItem
} from './types'

export default function App() {
  const [queue, setQueue] = useState<ReviewItem[] | null>(null)
  const [detail, setDetail] = useState<ReviewItem | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reviewer, setReviewer] = useState<Reviewer>('alex')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadTick, setLoadTick] = useState(0)
  const [actionPending, setActionPending] = useState<Action | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Initial load and retry. Auto-selects the first item so the reviewer
  // always lands on something to action rather than an empty panel.
  useEffect(() => {
    let cancelled = false
    setLoadError(null)
    setQueue(null)
    fetchQueue()
      .then((items) => {
        if (cancelled) return
        setQueue(items)
        if (items.length > 0 && selectedId === null) {
          setSelectedId(items[0].id)
          setDetail(items[0])
        }
      })
      .catch((e: Error) => {
        if (cancelled) return
        setLoadError(e.message)
      })
    return () => {
      cancelled = true
    }
    // selectedId is intentionally omitted — we only auto-select on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTick])

  async function handleSelect(id: string) {
    setSelectedId(id)
    setActionError(null)
    // Prefer the queue copy we already have to keep navigation snappy.
    const fromQueue = queue?.find((it) => it.id === id)
    if (fromQueue) {
      setDetail(fromQueue)
      return
    }
    try {
      const item = await fetchItem(id)
      setDetail(item)
    } catch (e) {
      setActionError((e as Error).message)
    }
  }

  async function handleAction(action: Action) {
    if (!detail) return
    setActionPending(action)
    setActionError(null)
    try {
      const updated = await submitAction(detail.id, action, reviewer)
      // Refetch queue and detail to make sure the UI reflects server truth,
      // not the single response we just got back.
      const [nextQueue, refreshedDetail] = await Promise.all([
        fetchQueue(),
        fetchItem(updated.id)
      ])
      setQueue(nextQueue)
      setDetail(refreshedDetail)

      // If the action moved the item into a terminal state, it has dropped
      // out of the active queue. Nudge the reviewer onto the next one so
      // the panel does not show a dead-end.
      if (TERMINAL_STATUSES.has(refreshedDetail.status) && nextQueue.length > 0) {
        const nextId = nextQueue[0].id
        setSelectedId(nextId)
        setDetail(nextQueue[0])
      } else if (nextQueue.length === 0) {
        setSelectedId(null)
      }
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setActionPending(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Reviewer queue</h1>
            <p className="text-xs text-slate-500">
              Prioritised by risk, tier, and time waiting.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span>Reviewer</span>
            <select
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value as Reviewer)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {REVIEWERS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Active queue
            </h2>
            {queue && (
              <span className="text-xs text-slate-400">
                {queue.length} item{queue.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
          {loadError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p className="font-medium">Could not load the queue.</p>
              <p className="mt-1 text-rose-600">{loadError}</p>
              <button
                type="button"
                onClick={() => setLoadTick((t) => t + 1)}
                className="mt-3 rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-500"
              >
                Retry
              </button>
            </div>
          ) : queue === null ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Loading queue…
            </div>
          ) : (
            <QueueList items={queue} selectedId={selectedId} onSelect={handleSelect} />
          )}
        </section>

        <section>
          {detail ? (
            <ItemDetail
              item={detail}
              reviewer={reviewer}
              pending={actionPending}
              actionError={actionError}
              onAction={handleAction}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Select an item from the queue to see details.
            </div>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-6 pt-2 text-right text-xs text-slate-400">
        Built by Thomas Hughes · London
      </footer>
    </div>
  )
}
