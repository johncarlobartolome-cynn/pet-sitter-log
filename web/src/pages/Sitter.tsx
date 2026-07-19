import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createPet, addEntry, listEntries } from '../api'
import type { Entry, Pet } from '../api'

export default function Sitter() {
  const [pet, setPet] = useState<Pet | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [error, setError] = useState<string | null>(null)

  // create-pet form
  const [name, setName] = useState('')
  const [owner, setOwner] = useState('')
  const [careNotes, setCareNotes] = useState('')

  // add-entry form
  const [type, setType] = useState('')
  const [note, setNote] = useState('')

  async function handleCreatePet(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    try {
      const created = await createPet({
        name,
        owner: owner || undefined,
        careNotes: careNotes || undefined,
      })
      setPet(created)
      setEntries([])
      setName('')
      setOwner('')
      setCareNotes('')
    } catch (err) {
      setError(String(err))
    }
  }

  async function handleAddEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!pet) return
    setError(null)
    try {
      await addEntry(pet.petId, { type, note: note || undefined })
      setType('')
      setNote('')
      const res = await listEntries(pet.petId) // refresh the list
      setEntries(res.entries)
    } catch (err) {
      setError(String(err))
    }
  }

  const shareUrl = pet ? `${window.location.origin}/share/${pet.shareToken}` : ''

  return (
    <main style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Pet Sitter Log</h1>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {!pet ? (
        <form onSubmit={handleCreatePet}>
          <h2>Create a pet</h2>
          <p>
            <input
              placeholder="Name (required)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </p>
          <p>
            <input
              placeholder="Owner (optional)"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </p>
          <p>
            <textarea
              placeholder="Care notes (optional)"
              value={careNotes}
              onChange={(e) => setCareNotes(e.target.value)}
            />
          </p>
          <button type="submit">Create pet</button>
        </form>
      ) : (
        <>
          <section>
            <h2>Pet created</h2>
            <p>petId: <code>{pet.petId}</code></p>
            <p>
              Share link:{' '}
              <Link to={`/share/${pet.shareToken}`}>Open owner view</Link>
            </p>
            <p><code>{shareUrl}</code></p>
          </section>

          <section>
            <h2>Add an entry</h2>
            <form onSubmit={handleAddEntry}>
              <p>
                <input
                  placeholder="Type, e.g. feed, walk (required)"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                />
              </p>
              <p>
                <textarea
                  placeholder="Note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </p>
              <button type="submit">Add entry</button>
            </form>
          </section>

          <section>
            <h2>Entries</h2>
            {entries.length === 0 ? (
              <p>No entries yet.</p>
            ) : (
              <ul>
                {entries.map((entry) => (
                  <li key={entry.createdAt}>
                    <strong>{entry.type}</strong>
                    {entry.note ? `: ${entry.note}` : ''}{' '}
                    <small>({new Date(entry.createdAt).toLocaleString()})</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  )
}
