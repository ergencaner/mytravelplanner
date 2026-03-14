const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/plans/:planId/itinerary', (req, res) => {
  const rows = db.prepare('SELECT * FROM itinerary_items WHERE plan_id = ? ORDER BY date, start_time').all(req.params.planId);
  res.json(rows);
});

router.post('/plans/:planId/itinerary', (req, res) => {
  const { date, start_time, end_time, title, description, activity_type, location, lat, lng } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Title and date are required' });

  const result = db.prepare(
    'INSERT INTO itinerary_items (plan_id, date, start_time, end_time, title, description, activity_type, location, lat, lng) VALUES (?,?,?,?,?,?,?,?,?,?)'
  ).run(req.params.planId, date, start_time, end_time, title, description, activity_type || 'custom', location, lat, lng);

  res.status(201).json(db.prepare('SELECT * FROM itinerary_items WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/itinerary/:id', (req, res) => {
  const { date, start_time, end_time, title, description, activity_type, location, lat, lng } = req.body;
  db.prepare(
    'UPDATE itinerary_items SET date=?, start_time=?, end_time=?, title=?, description=?, activity_type=?, location=?, lat=?, lng=? WHERE id=?'
  ).run(date, start_time, end_time, title, description, activity_type, location, lat, lng, req.params.id);
  res.json(db.prepare('SELECT * FROM itinerary_items WHERE id = ?').get(req.params.id));
});

router.delete('/itinerary/:id', (req, res) => {
  db.prepare('DELETE FROM itinerary_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
