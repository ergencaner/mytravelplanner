const express = require('express');
const https = require('https');
const router = express.Router();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Follow a redirect and return the final URL
function getRedirectUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      res.resume();
      if (res.statusCode === 301 || res.statusCode === 302) {
        resolve(res.headers.location);
      } else {
        reject(new Error(`Unexpected status: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

// GET /api/place-image?q=place+name
router.get('/place-image', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'Missing query' });
  if (!API_KEY) return res.status(503).json({ error: 'Google Places API key not configured' });

  try {
    // Step 1: Text Search to find the place and get a photo reference
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${API_KEY}`;
    const searchData = await new Promise((resolve, reject) => {
      https.get(searchUrl, r => {
        let body = '';
        r.on('data', chunk => body += chunk);
        r.on('end', () => resolve(JSON.parse(body)));
      }).on('error', reject);
    });

    const photoRef = searchData?.results?.[0]?.photos?.[0]?.photo_reference;
    if (!photoRef) return res.json({ imageUrl: null });

    // Step 2: Follow the photo redirect to get the clean CDN URL (no API key exposed)
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${API_KEY}`;
    const imageUrl = await getRedirectUrl(photoUrl);

    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
