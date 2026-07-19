import { useParams } from 'react-router-dom'

// Stub: the read-only owner view is filled in by T24 (uses getShared(token)).
export default function Owner() {
  const { token } = useParams()

  return (
    <main style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Owner view</h1>
      <p>Read-only view for share token:</p>
      <p><code>{token}</code></p>
      <p>Coming soon (T24).</p>
    </main>
  )
}
