import express, { type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { getActiveQueue, getById, performAction } from './store.js'
import { ACTIONS } from './types.js'

const app = express()
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/items', (_req, res) => {
  res.json(getActiveQueue())
})

app.get('/api/items/:id', (req, res) => {
  const item = getById(req.params.id)
  if (!item) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: `no item with id ${req.params.id}` }
    })
    return
  }
  res.json(item)
})

const actionSchema = z.object({
  action: z.enum(ACTIONS),
  reviewer: z.string().min(1)
})

app.post('/api/items/:id/action', (req, res) => {
  const parsed = actionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: parsed.error.issues[0]?.message ?? 'invalid request body'
      }
    })
    return
  }
  const { action, reviewer } = parsed.data
  const result = performAction(req.params.id, action, reviewer)
  if (!result.ok) {
    res.status(result.httpStatus).json({
      error: { code: result.code, message: result.message }
    })
    return
  }
  res.json(result.item)
})

// last-resort error handler — anything thrown synchronously lands here
// and becomes a clean JSON 500, never a leaked stack trace
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('unhandled error:', err)
  res.status(500).json({ error: { code: 'INTERNAL', message: 'internal server error' } })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`)
})
