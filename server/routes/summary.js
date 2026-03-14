const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/plans/:planId/summary-links', (req, res) => {
  const rows = db.prepare('SELECT * FROM summary_links WHERE plan_id = ?').all(req.params.planId);
  res.json(rows);
});

router.post('/plans/:planId/summary-links', (req, res) => {
  const { title, url, category, notes } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const result = db.prepare(
    'INSERT INTO summary_links (plan_id, title, url, category, notes) VALUES (?,?,?,?,?)'
  ).run(req.params.planId, title, url, category, notes);

  res.status(201).json(db.prepare('SELECT * FROM summary_links WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/summary-links/:id', (req, res) => {
  const { title, url, category, notes } = req.body;
  db.prepare('UPDATE summary_links SET title=?, url=?, category=?, notes=? WHERE id=?')
    .run(title, url, category, notes, req.params.id);
  res.json(db.prepare('SELECT * FROM summary_links WHERE id = ?').get(req.params.id));
});

router.delete('/summary-links/:id', (req, res) => {
  db.prepare('DELETE FROM summary_links WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
