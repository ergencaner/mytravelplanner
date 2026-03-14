const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/plans/:planId/transport', (req, res) => {
  const rows = db.prepare('SELECT * FROM transport WHERE plan_id = ? ORDER BY departure_date, departure_time').all(req.params.planId);
  res.json(rows);
});

router.post('/plans/:planId/transport', (req, res) => {
  const { type, from_location, to_location, departure_date, departure_time, arrival_date, arrival_time, company, booking_reference, price, notes } = req.body;
  if (!type) return res.status(400).json({ error: 'Type is required' });

  const result = db.prepare(
    'INSERT INTO transport (plan_id, type, from_location, to_location, departure_date, departure_time, arrival_date, arrival_time, company, booking_reference, price, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(req.params.planId, type, from_location, to_location, departure_date, departure_time, arrival_date, arrival_time, company, booking_reference, price, notes);

  res.status(201).json(db.prepare('SELECT * FROM transport WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/transport/:id', (req, res) => {
  const { type, from_location, to_location, departure_date, departure_time, arrival_date, arrival_time, company, booking_reference, price, notes } = req.body;
  db.prepare(
    'UPDATE transport SET type=?, from_location=?, to_location=?, departure_date=?, departure_time=?, arrival_date=?, arrival_time=?, company=?, booking_reference=?, price=?, notes=? WHERE id=?'
  ).run(type, from_location, to_location, departure_date, departure_time, arrival_date, arrival_time, company, booking_reference, price, notes, req.params.id);
  res.json(db.prepare('SELECT * FROM transport WHERE id = ?').get(req.params.id));
});

router.delete('/transport/:id', (req, res) => {
  db.prepare('DELETE FROM transport WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
