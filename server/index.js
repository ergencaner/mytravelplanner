const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api/plans', require('./routes/plans'));
app.use('/api', require('./routes/accommodations'));
app.use('/api', require('./routes/places'));
app.use('/api', require('./routes/transport'));
app.use('/api', require('./routes/restaurants'));
app.use('/api', require('./routes/itinerary'));
app.use('/api', require('./routes/summary'));
app.use('/api', require('./routes/files'));

// Serve React frontend (production build)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('<h1>Travel Planner API</h1><p>Run <code>npm run build:client</code> to build the frontend.</p>');
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌍 Travel Planner running at http://0.0.0.0:${PORT}`);
  console.log(`   Access from other devices: http://<your-ip>:${PORT}\n`);
});
