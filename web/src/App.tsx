import { Routes, Route } from 'react-router-dom'
import Sitter from './pages/Sitter'
import Owner from './pages/Owner'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Sitter />} />
      <Route path="/share/:token" element={<Owner />} />
    </Routes>
  )
}
