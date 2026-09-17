import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'

const emptyForm = {
  project_name: '',
  prompt_title: '',
  prompt_version: 'v1',
  prompt_text: '',
  response_summary: '',
  category: 'Coding',
  usefulness: 'Good',
  notes: '',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [capsules, setCapsules] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch('/api/capsules', { credentials: 'include' })
    if (res.status === 401) {
      navigate('/login')
      return
    }
    const data = await res.json()
    setCapsules(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const url = editingId ? `/api/capsules/${editingId}` : '/api/capsules'
    const method = editingId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Save failed')
      return
    }

    setForm(emptyForm)
    setEditingId(null)
    await load()
  }

  function startEdit(capsule) {
    setEditingId(capsule.id)
    setForm({
      project_name: capsule.project_name || '',
      prompt_title: capsule.prompt_title || '',
      prompt_version: capsule.prompt_version || 'v1',
      prompt_text: capsule.prompt_text || '',
      response_summary: capsule.response_summary || '',
      category: capsule.category || 'Coding',
      usefulness: capsule.usefulness || 'Good',
      notes: capsule.notes || '',
    })
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this capsule?')) return
    await fetch(`/api/capsules/${id}`, { method: 'DELETE', credentials: 'include' })
    await load()
  }

  return (
    <div className="shell">
      <Header />
      <main>
        <div className="page-head">
          <div>
            <p className="kicker">Protected dashboard</p>
            <h1 className="page-title">Your capsules</h1>
            <p className="muted">Only records owned by your GitHub account are shown.</p>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <form className="card form-grid" onSubmit={handleSubmit}>
          <h2 className="wide">{editingId ? 'Update capsule' : 'Create capsule'}</h2>
          <label className="field">
            Project name
            <input
              value={form.project_name}
              onChange={(e) => updateField('project_name', e.target.value)}
              required
            />
          </label>
          <label className="field">
            Prompt title
            <input
              value={form.prompt_title}
              onChange={(e) => updateField('prompt_title', e.target.value)}
              required
            />
          </label>
          <label className="field">
            Version
            <input
              value={form.prompt_version}
              onChange={(e) => updateField('prompt_version', e.target.value)}
            />
          </label>
          <label className="field">
            Category
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
            >
              <option>Coding</option>
              <option>Writing</option>
              <option>Research</option>
            </select>
          </label>
          <label className="field wide">
            Prompt text
            <textarea
              value={form.prompt_text}
              onChange={(e) => updateField('prompt_text', e.target.value)}
              required
            />
          </label>
          <label className="field wide">
            Response summary
            <textarea
              value={form.response_summary}
              onChange={(e) => updateField('response_summary', e.target.value)}
            />
          </label>
          <label className="field">
            Usefulness
            <select
              value={form.usefulness}
              onChange={(e) => updateField('usefulness', e.target.value)}
            >
              <option>Good</option>
              <option>Needs Improvement</option>
            </select>
          </label>
          <label className="field wide">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </label>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              {editingId ? 'Save changes' : 'Create'}
            </button>
            {editingId ? (
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <section className="capsule-list">
          {capsules.length === 0 ? (
            <div className="card empty">No prompts saved yet. Create one above.</div>
          ) : (
            capsules.map((capsule) => (
              <article className="card capsule-card" key={capsule.id}>
                <p className="meta">
                  {capsule.project_name} · {capsule.prompt_version} · {capsule.category}
                </p>
                <h3>{capsule.prompt_title}</h3>
                <p className="prompt-text">{capsule.prompt_text}</p>
                {capsule.response_summary ? (
                  <p className="muted">{capsule.response_summary}</p>
                ) : null}
                <div className="form-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => startEdit(capsule)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" type="button" onClick={() => handleDelete(capsule.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  )
}
