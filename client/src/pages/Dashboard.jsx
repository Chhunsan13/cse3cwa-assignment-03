import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'


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
    <main>
      <p>
        <Link to="/">Home</Link>
      </p>
      <h1>Your capsules</h1>
      {error ? <p>{error}</p> : null}

      <form onSubmit={handleSubmit}>
        <h2>{editingId ? 'Update capsule' : 'Create capsule'}</h2>
        <p>
          <label>
            Project name
            <input
              value={form.project_name}
              onChange={(e) => updateField('project_name', e.target.value)}
              required
            />
          </label>
        </p>
        <p>
          <label>
            Prompt title
            <input
              value={form.prompt_title}
              onChange={(e) => updateField('prompt_title', e.target.value)}
              required
            />
          </label>
        </p>
        <p>
          <label>
            Version
            <input
              value={form.prompt_version}
              onChange={(e) => updateField('prompt_version', e.target.value)}
            />
          </label>
        </p>
        <p>
          <label>
            Prompt text
            <textarea
              value={form.prompt_text}
              onChange={(e) => updateField('prompt_text', e.target.value)}
              required
            />
          </label>
        </p>
        <p>
          <label>
            Response summary
            <textarea
              value={form.response_summary}
              onChange={(e) => updateField('response_summary', e.target.value)}
            />
          </label>
        </p>
        <p>
          <label>
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
        </p>
        <p>
          <label>
            Usefulness
            <select
              value={form.usefulness}
              onChange={(e) => updateField('usefulness', e.target.value)}
            >
              <option>Good</option>
              <option>Needs Improvement</option>
            </select>
          </label>
        </p>
        <p>
          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </label>
        </p>
        <button type="submit">{editingId ? 'Save changes' : 'Create'}</button>
        {editingId ? (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm(emptyForm)
            }}
          >
            Cancel
          </button>
        ) : null}
      </form>

      <section>
        {capsules.length === 0 ? (
          <p>No prompts saved yet.</p>
        ) : (
          capsules.map((capsule) => (
            <article key={capsule.id}>
              <h3>{capsule.prompt_title}</h3>
              <p>
                {capsule.project_name} · {capsule.prompt_version} · {capsule.category}
              </p>
              <p>{capsule.prompt_text}</p>
              <button type="button" onClick={() => startEdit(capsule)}>
                Edit
              </button>
              <button type="button" onClick={() => handleDelete(capsule.id)}>
                Delete
              </button>
            </article>
          ))
        )}
      </section>
    </main>
  )
}