import { useEffect, useState } from 'react'

export default function App() {
  const [health, setHealth] = useState<string>('loading...')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealth(JSON.stringify(d)))
      .catch((e) => setHealth(`error: ${e.message}`))
  }, [])

  return (
    <div className="p-6 font-sans text-slate-800">
      <h1 className="text-2xl font-semibold">reviewer queue</h1>
      <p className="mt-2 text-sm text-slate-500">health: {health}</p>
    </div>
  )
}
