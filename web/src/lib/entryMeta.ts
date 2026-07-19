// Map a free-text entry type to a color so the timeline nodes carry meaning.
// Color is always paired with the type label in the UI, never color alone.
const TYPE_COLORS: Array<[string, string]> = [
  ['feed', '#d98a2b'],
  ['food', '#d98a2b'],
  ['meal', '#d98a2b'],
  ['treat', '#d98a2b'],
  ['walk', '#2f8f6f'],
  ['outside', '#2f8f6f'],
  ['potty', '#2f8f6f'],
  ['med', '#c0564a'],
  ['pill', '#c0564a'],
  ['play', '#3e7cc0'],
  ['rest', '#7c6fd1'],
  ['sleep', '#7c6fd1'],
  ['nap', '#7c6fd1'],
]

const DEFAULT_COLOR = '#64748b'

export function entryColor(type: string): string {
  const t = type.toLowerCase().trim()
  for (const [key, color] of TYPE_COLORS) {
    if (t.includes(key)) return color
  }
  return DEFAULT_COLOR
}

export function formatEntryTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
