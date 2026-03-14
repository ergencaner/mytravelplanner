const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/plans/:planId/restaurants', (req, res) => {
  const rows = db.prepare('SELECT * FROM restaurants WHERE plan_id = ? ORDER BY visit_date, visit_time').all(req.params.planId);
  res.json(rows);
});

router.post('/plans/:planId/restaurants', (req, res) => {
  const { name, address, cuisine, meal_type, visit_date, visit_time, reservation_link, price_range, notes, lat, lng } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const result = db.prepare(
    'INSERT INTO restaurants (plan_id, name, address, cuisine, meal_type, visit_date, visit_time, reservation_link, price_range, notes, lat, lng) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(req.params.planId, name, address, cuisine, meal_type, visit_date, visit_time, reservation_link, price_range, notes, lat, lng);

  res.status(201).json(db.prepare('SELECT * FROM restaurants WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/restaurants/:id', (req, res) => {
  const { name, address, cuisine, meal_type, visit_date, visit_time, reservation_link, price_range, notes, lat, lng } = req.body;
  db.prepare(
    'UPDATE restaurants SET name=?, address=?, cuisine=?, meal_type=?, visit_date=?, visit_time=?, reservation_link=?, price_range=?, notes=?, lat=?, lng=? WHERE id=?'
  ).run(name, address, cuisine, meal_type, visit_date, visit_time, reservation_link, price_range, notes, lat, lng, req.params.id);
  res.json(db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id));
});

router.delete('/restaurants/:id', (req, res) => {
  db.prepare('DELETE FROM restaurants WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
