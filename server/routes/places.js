const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/plans/:planId/places', (req, res) => {
  const rows = db.prepare('SELECT * FROM places_to_visit WHERE plan_id = ? ORDER BY visit_date, visit_time').all(req.params.planId);
  res.json(rows);
});

router.post('/plans/:planId/places', (req, res) => {
  const { name, address, category, visit_date, visit_time, duration_hours, ticket_link, price, notes, lat, lng, image_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const result = db.prepare(
    'INSERT INTO places_to_visit (plan_id, name, address, category, visit_date, visit_time, duration_hours, ticket_link, price, notes, lat, lng, image_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(req.params.planId, name, address, category, visit_date, visit_time, duration_hours, ticket_link, price, notes, lat, lng, image_url);

  res.status(201).json(db.prepare('SELECT * FROM places_to_visit WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/places/:id', (req, res) => {
  const { name, address, category, visit_date, visit_time, duration_hours, ticket_link, price, notes, lat, lng, image_url } = req.body;
  db.prepare(
    'UPDATE places_to_visit SET name=?, address=?, category=?, visit_date=?, visit_time=?, duration_hours=?, ticket_link=?, price=?, notes=?, lat=?, lng=?, image_url=? WHERE id=?'
  ).run(name, address, category, visit_date, visit_time, duration_hours, ticket_link, price, notes, lat, lng, image_url, req.params.id);
  res.json(db.prepare('SELECT * FROM places_to_visit WHERE id = ?').get(req.params.id));
});

router.delete('/places/:id', (req, res) => {
  db.prepare('DELETE FROM places_to_visit WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
