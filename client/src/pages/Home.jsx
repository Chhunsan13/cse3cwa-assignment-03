import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main>
      <h1>AI Capsule</h1>
      <p>
        A private place to save, review and improve the AI prompts you use
        for coding, writing and study.
      </p>
      <p>
        <Link to="/login">Sign in</Link>
      </p>
    </main>
  )
}