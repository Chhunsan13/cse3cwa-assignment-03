import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'

export default function Home() {
  return (
    <div className="shell">
      <Header />
      <main className="hero">
        <p className="kicker">Private prompt library</p>
        <h1>Keep the prompts that actually work.</h1>
        <p className="lede">
          AI Capsule is a small workspace for saving, reviewing and improving the
          prompts you use with ChatGPT, Copilot, Gemini and Claude.
        </p>
        <div className="actions">
          <Link className="btn btn-primary" to="/login">
            Sign in with GitHub
          </Link>
          <Link className="btn btn-ghost" to="/dashboard">
            Open dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
