import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="topbar">
      <Link className="brand" to="/">
        <span className="brand-mark" aria-hidden="true" />
        AI Capsule
      </Link>
      <nav className="topbar-nav">
        <Link to="/login">Sign in</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
    </header>
  )
}
