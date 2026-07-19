import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getShared } from '../api'
import type { Shared } from '../api'
import Brand from '../components/Brand'
import Timeline from '../components/Timeline'
import { Paw } from '../components/icons'

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
    <div className="app">
      <Brand />

      <div className="stack">
        {loading && <LoadingView />}

        {!loading && error && (
          <section className="card">
            <div className="empty">
              <div className="empty__mark">
                <Paw size={24} />
              </div>
              <p>{error}</p>
              <p style={{ marginTop: 6, fontSize: '0.9rem' }}>
                Ask your sitter for an up-to-date link.
              </p>
            </div>
          </section>
        )}

        {!loading && !error && data && (
          <>
            <section className="card">
              <p className="eyebrow">You're watching over</p>
              <div className="petcard__head">
                <div className="avatar" aria-hidden="true">
                  {data.pet.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="petcard__name">{data.pet.name}</h1>
                  {data.pet.owner && (
                    <p className="petcard__owner">Owner: {data.pet.owner}</p>
                  )}
                </div>
              </div>

              {data.pet.careNotes && (
                <div className="notes">
                  <p className="notes__label">Care notes</p>
                  <p>{data.pet.careNotes}</p>
                </div>
              )}
            </section>

            <section className="card">
              <h2 className="section-title">Care timeline</h2>
              <Timeline entries={data.entries} />
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function LoadingView() {
  return (
    <section className="card" aria-busy="true" aria-label="Loading">
      <div className="petcard__head">
        <div className="skel skel--avatar" />
        <div style={{ flex: 1, display: 'grid', gap: 10 }}>
          <div className="skel skel--title" />
          <div className="skel skel--line" style={{ width: '35%' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <div className="skel skel--line" style={{ width: '80%' }} />
        <div className="skel skel--line" style={{ width: '65%' }} />
        <div className="skel skel--line" style={{ width: '72%' }} />
      </div>
    </section>
  )
}
