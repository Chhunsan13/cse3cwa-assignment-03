import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'

export default function Login() {
  return (
    <div className="shell">
      <Header />
      <main className="card login-card">
        <p className="kicker">Sign in</p>
        <h1>Continue with GitHub</h1>
        <p className="muted">
          After GitHub approves the login, Express stores an application JWT in
          an HttpOnly cookie named token.
        </p>
        <p className="actions" style={{ justifyContent: 'center' }}>
          <a className="btn btn-primary" href="/auth/github">
            Sign in with GitHub
          </a>
        </p>
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    </div>
  )
}
