require('dotenv').config();

const express = require('express');

const app = express();
app.use(express.json());
const port = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('AI Capsule API is running');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  const db = require('./db');

  const DEV_USER = 'dev-user';
  
  app.get('/api/capsules', (req, res) => {
    const rows = db.prepare(
      'SELECT * FROM capsules WHERE user_id = ? ORDER BY id DESC'
    ).all(DEV_USER);
    res.json(rows);
  });
  
  app.post('/api/capsules', (req, res) => {
    const { project_name, prompt_title, prompt_text } = req.body;
  
    if (!project_name || !prompt_title || !prompt_text) {
      return res.status(400).json({
        error: 'project_name, prompt_title and prompt_text are required',
      });
    }
  
    const result = db.prepare(`
      INSERT INTO capsules (
        user_id, project_name, prompt_title, prompt_version, prompt_text,
        response_summary, category, usefulness, reviewed, improved,
        screenshot_url, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      DEV_USER,
      project_name,
      prompt_title,
      req.body.prompt_version || '',
      prompt_text,
      req.body.response_summary || '',
      req.body.category || '',
      req.body.usefulness || '',
      req.body.reviewed ? 1 : 0,
      req.body.improved ? 1 : 0,
      req.body.screenshot_url || '',
      req.body.notes || ''
    );
  
    const created = db.prepare('SELECT * FROM capsules WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  });
  
  app.put('/api/capsules/:id', (req, res) => {
    const existing = db.prepare('SELECT * FROM capsules WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }
  
    db.prepare(`
      UPDATE capsules SET
        project_name = ?,
        prompt_title = ?,
        prompt_version = ?,
        prompt_text = ?,
        response_summary = ?,
        category = ?,
        usefulness = ?,
        reviewed = ?,
        improved = ?,
        screenshot_url = ?,
        notes = ?
      WHERE id = ? AND user_id = ?
    `).run(
      req.body.project_name || existing.project_name,
      req.body.prompt_title || existing.prompt_title,
      req.body.prompt_version ?? existing.prompt_version,
      req.body.prompt_text || existing.prompt_text,
      req.body.response_summary ?? existing.response_summary,
      req.body.category ?? existing.category,
      req.body.usefulness ?? existing.usefulness,
      req.body.reviewed ? 1 : existing.reviewed,
      req.body.improved ? 1 : existing.improved,
      req.body.screenshot_url ?? existing.screenshot_url,
      req.body.notes ?? existing.notes,
      req.params.id,
      DEV_USER
    );
  
    const updated = db.prepare('SELECT * FROM capsules WHERE id = ?').get(req.params.id);
    res.json(updated);
  });
  
  app.delete('/api/capsules/:id', (req, res) => {
    const existing = db.prepare('SELECT * FROM capsules WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }
  
    db.prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?').run(req.params.id, DEV_USER);
    res.json({ status: 'deleted', id: Number(req.params.id) });
  });  

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});