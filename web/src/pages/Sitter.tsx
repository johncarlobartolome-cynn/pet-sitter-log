import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createPet, addEntry, listEntries } from '../api'
import type { Entry } from '../api'
import Brand from '../components/Brand'
import Timeline from '../components/Timeline'
import { Copy, Check, ArrowRight } from '../components/icons'

type Created = {
  petId: string
  shareToken: string
  name: string
  owner?: string
  careNotes?: string
}

const QUICK_TYPES = ['Feed', 'Walk', 'Meds', 'Play', 'Rest']

export default function Sitter() {
  const [created, setCreated] = useState<Created | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [adding, setAdding] = useState(false)

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
    setCreating(true)
    try {
      const res = await createPet({
        name,
        owner: owner || undefined,
        careNotes: careNotes || undefined,
      })
      setCreated({
        ...res,
        name,
        owner: owner || undefined,
        careNotes: careNotes || undefined,
      })
      setEntries([])
      setName('')
      setOwner('')
      setCareNotes('')
    } catch {
      setError('Could not create the log. Check the connection and try again.')
    } finally {
      setCreating(false)
    }
  }

  async function handleAddEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!created) return
    setError(null)
    setAdding(true)
    try {
      await addEntry(created.petId, { type, note: note || undefined })
      setType('')
      setNote('')
      const res = await listEntries(created.petId) // refresh the list
      setEntries(res.entries)
    } catch {
      setError('Could not add the entry. Check the connection and try again.')
    } finally {
      setAdding(false)
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy the link. Copy it manually instead.')
    }
  }

  const shareUrl = created
    ? `${window.location.origin}/share/${created.shareToken}`
    : ''

  return (
    <div className="app">
      <Brand />

      <div className="stack">
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}

        {!created ? (
          <section className="card">
            <p className="eyebrow">New log</p>
            <h1 className="h1">Start a care log</h1>
            <p className="lede">
              Add the pet you are looking after. You will get a private link to
              share a read-only view with their owner.
            </p>

            <form className="form" onSubmit={handleCreatePet}>
              <div className="field">
                <label className="field__label" htmlFor="name">
                  Pet name <span className="field__req">*</span>
                </label>
                <input
                  id="name"
                  className="input"
                  placeholder="Biscuit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="owner">
                  Owner <span className="field__opt">(optional)</span>
                </label>
                <input
                  id="owner"
                  className="input"
                  placeholder="Alex Rivera"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="careNotes">
                  Care notes <span className="field__opt">(optional)</span>
                </label>
                <textarea
                  id="careNotes"
                  className="textarea"
                  placeholder="Two scoops at 8am. Allergic to chicken. Loves the park."
                  value={careNotes}
                  onChange={(e) => setCareNotes(e.target.value)}
                />
              </div>

              <button className="btn btn--primary" type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create log'}
              </button>
            </form>
          </section>
        ) : (
          <>
            {/* Pet identity + share link */}
            <section className="card">
              <div className="petcard__head">
                <div className="avatar" aria-hidden="true">
                  {created.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="petcard__name">{created.name}</h1>
                  {created.owner && (
                    <p className="petcard__owner">Owner: {created.owner}</p>
                  )}
                </div>
              </div>

              {created.careNotes && (
                <div className="notes">
                  <p className="notes__label">Care notes</p>
                  <p>{created.careNotes}</p>
                </div>
              )}

              <div className="share">
                <p className="notes__label">Owner share link</p>
                <div className="share__row">
                  <input
                    className="share__url"
                    value={shareUrl}
                    readOnly
                    aria-label="Owner share link"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => copyLink(shareUrl)}
                  >
                    {copied ? <Check /> : <Copy />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <Link className="share__open" to={`/share/${created.shareToken}`}>
                  Open owner view <ArrowRight />
                </Link>
              </div>
            </section>

            {/* Add an entry */}
            <section className="card">
              <h2 className="section-title">Log a moment</h2>
              <form className="form" onSubmit={handleAddEntry}>
                <div className="field">
                  <label className="field__label" htmlFor="type">
                    Type <span className="field__req">*</span>
                  </label>
                  <div className="chips" role="group" aria-label="Quick types">
                    {QUICK_TYPES.map((t) => (
                      <button
                        type="button"
                        key={t}
                        className="chip"
                        aria-pressed={type === t}
                        onClick={() => setType(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <input
                    id="type"
                    className="input"
                    placeholder="Feed, walk, meds..."
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="note">
                    Note <span className="field__opt">(optional)</span>
                  </label>
                  <textarea
                    id="note"
                    className="textarea"
                    placeholder="Ate everything, then a short nap."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <button className="btn btn--primary" type="submit" disabled={adding}>
                  {adding ? 'Adding...' : 'Add to log'}
                </button>
              </form>
            </section>

            {/* Timeline */}
            <section className="card">
              <h2 className="section-title">Care timeline</h2>
              <Timeline entries={entries} />
            </section>
          </>
        )}
      </div>
    </div>
  )
}
