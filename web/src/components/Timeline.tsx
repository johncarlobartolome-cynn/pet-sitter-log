import type { CSSProperties } from 'react'
import type { Entry } from '../api'
import { entryColor, formatEntryTime } from '../lib/entryMeta'
import { Paw } from './icons'

export default function Timeline({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <div className="empty">
        <div className="empty__mark">
          <Paw size={24} />
        </div>
        <p>No moments logged yet.</p>
      </div>
    )
  }

  return (
    <ol className="timeline">
      {entries.map((entry, i) => {
        const color = entryColor(entry.type)
        // stagger the entrance a little, but cap it so long lists stay snappy
        const style = {
          '--pill': color,
          animationDelay: `${Math.min(i, 6) * 45}ms`,
        } as CSSProperties

        return (
          <li className="entry rise" style={style} key={`${entry.createdAt}-${i}`}>
            <span className="entry__node" aria-hidden="true" />
            <div className="entry__head">
              <span className="pill">{entry.type}</span>
              <time className="entry__time" dateTime={entry.createdAt}>
                {formatEntryTime(entry.createdAt)}
              </time>
            </div>
            {entry.note && <p className="entry__note">{entry.note}</p>}
          </li>
        )
      })}
    </ol>
  )
}
