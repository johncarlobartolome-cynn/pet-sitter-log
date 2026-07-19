// Small inline SVG icons (no emoji). Consistent 24px box, currentColor.
type IconProps = { size?: number }

export function Paw({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <ellipse cx="7" cy="8.5" rx="1.9" ry="2.4" />
      <ellipse cx="12" cy="6.6" rx="1.9" ry="2.5" />
      <ellipse cx="17" cy="8.5" rx="1.9" ry="2.4" />
      <path d="M12 11.2c-2.7 0-5 2.1-5 4.4 0 1.7 1.4 2.6 3 2.6.9 0 1.4-.3 2-.3s1.1.3 2 .3c1.6 0 3-.9 3-2.6 0-2.3-2.3-4.4-5-4.4Z" />
    </svg>
  )
}

export function Copy({ size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export function Check({ size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 6.5" />
    </svg>
  )
}

export function ArrowRight({ size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
