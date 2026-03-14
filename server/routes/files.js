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

// List files for a plan (optionally filtered by entity)
router.get('/plans/:planId/files', (req, res) => {
  const { entity_type, entity_id } = req.query;
  let query = 'SELECT * FROM files WHERE plan_id = ?';
  const params = [req.params.planId];
  if (entity_type) { query += ' AND entity_type = ?'; params.push(entity_type); }
  if (entity_id) { query += ' AND entity_id = ?'; params.push(entity_id); }
  query += ' ORDER BY uploaded_at DESC';
  res.json(db.prepare(query).all(...params));
});

// Upload file
router.post('/plans/:planId/files', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { entity_type = 'plan', entity_id } = req.body;
  const result = db.prepare(
    'INSERT INTO files (plan_id, entity_type, entity_id, filename, original_name, mime_type, file_size) VALUES (?,?,?,?,?,?,?)'
  ).run(
    req.params.planId,
    entity_type,
    entity_id || null,
    req.file.filename,
    req.file.originalname,
    req.file.mimetype,
    req.file.size
  );

  res.status(201).json(db.prepare('SELECT * FROM files WHERE id = ?').get(result.lastInsertRowid));
});

// Delete file
router.delete('/files/:id', (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });

  const fpath = path.join(__dirname, '..', 'uploads', file.filename);
  if (fs.existsSync(fpath)) fs.unlinkSync(fpath);

  db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
