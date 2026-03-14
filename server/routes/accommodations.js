const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/plans/:planId/accommodations', (req, res) => {
  const rows = db.prepare('SELECT * FROM accommodations WHERE plan_id = ? ORDER BY check_in').all(req.params.planId);
  res.json(rows);
});

router.post('/plans/:planId/accommodations', (req, res) => {
  const { name, address, check_in, check_out, nights, booking_link, price, notes, lat, lng } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const result = db.prepare(
    'INSERT INTO accommodations (plan_id, name, address, check_in, check_out, nights, booking_link, price, notes, lat, lng) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).run(req.params.planId, name, address, check_in, check_out, nights, booking_link, price, notes, lat, lng);

  res.status(201).json(db.prepare('SELECT * FROM accommodations WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/accommodations/:id', (req, res) => {
  const { name, address, check_in, check_out, nights, booking_link, price, notes, lat, lng } = req.body;
  db.prepare(
    'UPDATE accommodations SET name=?, address=?, check_in=?, check_out=?, nights=?, booking_link=?, price=?, notes=?, lat=?, lng=? WHERE id=?'
  ).run(name, address, check_in, check_out, nights, booking_link, price, notes, lat, lng, req.params.id);
  res.json(db.prepare('SELECT * FROM accommodations WHERE id = ?').get(req.params.id));
});

router.delete('/accommodations/:id', (req, res) => {
  db.prepare('DELETE FROM accommodations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
