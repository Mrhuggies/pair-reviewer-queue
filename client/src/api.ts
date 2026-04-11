import type { Action, ApiError, ReviewItem } from './types'

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiError
    return body.error?.message ?? `request failed (${res.status})`
  } catch {
    return `request failed (${res.status})`
  }
}

export async function fetchQueue(): Promise<ReviewItem[]> {
  const res = await fetch('/api/items')
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as ReviewItem[]
}

export async function fetchItem(id: string): Promise<ReviewItem> {
  const res = await fetch(`/api/items/${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as ReviewItem
}

export async function submitAction(
  id: string,
  action: Action,
  reviewer: string
): Promise<ReviewItem> {
  const res = await fetch(`/api/items/${encodeURIComponent(id)}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reviewer })
  })
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as ReviewItem
}
