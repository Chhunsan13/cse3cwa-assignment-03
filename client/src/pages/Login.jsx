import { Link } from 'react-router-dom'

export default function Login() {
  return (
    <main>
      <h1>Sign in</h1>
      <p>Continue with GitHub to open your prompt library.</p>
      <p>
        <button type="button">Sign in with GitHub</button>
      </p>
      <p>
        <Link to="/">Back to home</Link>
      </p>
    </main>
  )
}