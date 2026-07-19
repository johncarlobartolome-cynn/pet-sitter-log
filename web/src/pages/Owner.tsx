import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getShared } from '../api'
import type { Shared } from '../api'

export default function Owner() {
  const { token } = useParams()
  const [data, setData] = useState<Shared | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true // guards against StrictMode's double-run / unmount

    if (!token) {
      setError("This share link isn't valid.")
      setLoading(false)
      return
    }

    getShared(token)
      .then((res) => {
        if (!active) return
        setData(res)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError("This share link isn't valid.")
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  return (
    <main style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : data ? (
        <>
          <h1>{data.pet.name}</h1>
          {data.pet.owner && <p>Owner: {data.pet.owner}</p>}
          {data.pet.careNotes && <p>Care notes: {data.pet.careNotes}</p>}

          <h2>Entries</h2>
          {data.entries.length === 0 ? (
            <p>No entries yet.</p>
          ) : (
            <ul>
              {data.entries.map((entry) => (
                <li key={entry.createdAt}>
                  <strong>{entry.type}</strong>
                  {entry.note ? `: ${entry.note}` : ''}{' '}
                  <small>({new Date(entry.createdAt).toLocaleString()})</small>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </main>
  )
}
