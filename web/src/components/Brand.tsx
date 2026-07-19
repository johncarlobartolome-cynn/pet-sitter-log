import { Link } from 'react-router-dom'
import { Paw } from './icons'

export default function Brand() {
  return (
    <header className="brand">
      <Link to="/" className="brand__mark" aria-label="Pet Sitter Log home">
        <Paw size={20} />
      </Link>
      <span className="brand__word">Pet Sitter Log</span>
      <span className="brand__tag">care journal</span>
    </header>
  )
}
