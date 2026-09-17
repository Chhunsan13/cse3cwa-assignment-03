require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const requireAuth = require('./middleware/requireAuth');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cookieParser());
const port = process.env.PORT || 3001;



app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  const db = require('./db');

  function cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }
  
  function baseUrl() {
    return (process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
  }
  
  app.get('/auth/github', (req, res) => {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: `${baseUrl()}/auth/github/callback`,
      scope: 'read:user user:email',
    });
    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  });
  
  app.get('/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.redirect('/login?error=missing_code');
    }
  
    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${baseUrl()}/auth/github/callback`,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        return res.redirect('/login?error=oauth_exchange');
      }
  
      const profileRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'ai-capsule',
        },
      });
      const profile = await profileRes.json();
      if (!profile.id) {
        return res.redirect('/login?error=profile');
      }
  
      const appJwt = jwt.sign(
        {
          userId: String(profile.id),
          login: profile.login,
          name: profile.name || profile.login,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      res.cookie('token', appJwt, cookieOptions());
      res.redirect('/dashboard');
    } catch {
      res.redirect('/login?error=oauth_failed');
    }
  });
  
  app.get('/auth/me', requireAuth, (req, res) => {
    res.json({
      userId: req.user.userId,
      login: req.user.login,
      name: req.user.name,
    });
  });
  
  app.post('/auth/logout', (req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/',
    });
    res.json({ status: 'ok' });
  });

  
  app.get('/api/capsules', requireAuth, (req, res) => {
    const rows = db.prepare(
      'SELECT * FROM capsules WHERE user_id = ? ORDER BY id DESC'
    ).all(req.user.userId);
    res.json(rows);
  });
  
  app.post('/api/capsules', requireAuth, (req, res) => {
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
      req.user.userId,
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
  
  app.put('/api/capsules/:id', requireAuth, (req, res) => {
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
      req.user.userId
    );
  
    const updated = db.prepare('SELECT * FROM capsules WHERE id = ?').get(req.params.id);
    res.json(updated);
  });
  
  app.delete('/api/capsules/:id', requireAuth, (req, res) => {
    const existing = db.prepare('SELECT * FROM capsules WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }
  
    db.prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?').run(req.params.id,req.user.userId);
    res.json({ status: 'deleted', id: Number(req.params.id) });
  });  

  const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next(err);
  });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});