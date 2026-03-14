const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// GET all plans
router.get('/', (req, res) => {
  const plans = db.prepare('SELECT * FROM travel_plans ORDER BY created_at DESC').all();
  res.json(plans);
});

// GET single plan with all related data
router.get('/:id', (req, res) => {
  const plan = db.prepare('SELECT * FROM travel_plans WHERE id = ?').get(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  plan.accommodations = db.prepare('SELECT * FROM accommodations WHERE plan_id = ? ORDER BY check_in').all(req.params.id);
  plan.places = db.prepare('SELECT * FROM places_to_visit WHERE plan_id = ? ORDER BY visit_date, visit_time').all(req.params.id);
  plan.restaurants = db.prepare('SELECT * FROM restaurants WHERE plan_id = ? ORDER BY visit_date, visit_time').all(req.params.id);
  plan.transport = db.prepare('SELECT * FROM transport WHERE plan_id = ? ORDER BY departure_date, departure_time').all(req.params.id);
  plan.itinerary = db.prepare('SELECT * FROM itinerary_items WHERE plan_id = ? ORDER BY date, start_time').all(req.params.id);
  plan.summary_links = db.prepare('SELECT * FROM summary_links WHERE plan_id = ?').all(req.params.id);
  plan.files = db.prepare('SELECT * FROM files WHERE plan_id = ? ORDER BY uploaded_at DESC').all(req.params.id);

  res.json(plan);
});

// POST create plan
router.post('/', (req, res) => {
  const { title, description, destination, start_date, end_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const result = db.prepare(
    'INSERT INTO travel_plans (title, description, destination, start_date, end_date) VALUES (?, ?, ?, ?, ?)'
  ).run(title, description, destination, start_date, end_date);

  const plan = db.prepare('SELECT * FROM travel_plans WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(plan);
});

// PUT update plan
router.put('/:id', (req, res) => {
  const { title, description, destination, start_date, end_date } = req.body;
  db.prepare(
    'UPDATE travel_plans SET title=?, description=?, destination=?, start_date=?, end_date=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).run(title, description, destination, start_date, end_date, req.params.id);

  const plan = db.prepare('SELECT * FROM travel_plans WHERE id = ?').get(req.params.id);
  res.json(plan);
});

// POST upload cover image
router.post('/:id/cover', upload.single('cover'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const plan = db.prepare('SELECT * FROM travel_plans WHERE id = ?').get(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  // Remove old cover
  if (plan.cover_image) {
    const oldPath = path.join(__dirname, '..', 'uploads', plan.cover_image);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  db.prepare('UPDATE travel_plans SET cover_image=? WHERE id=?').run(req.file.filename, req.params.id);
  res.json({ filename: req.file.filename });
});

// DELETE plan
router.delete('/:id', (req, res) => {
  // Delete associated files
  const files = db.prepare('SELECT filename FROM files WHERE plan_id = ?').all(req.params.id);
  files.forEach(f => {
    const fpath = path.join(__dirname, '..', 'uploads', f.filename);
    if (fs.existsSync(fpath)) fs.unlinkSync(fpath);
  });

  db.prepare('DELETE FROM travel_plans WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
