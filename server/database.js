const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'travel.db');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS travel_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    destination TEXT,
    start_date TEXT,
    end_date TEXT,
    cover_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS accommodations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    check_in TEXT,
    check_out TEXT,
    nights INTEGER,
    booking_link TEXT,
    price TEXT,
    notes TEXT,
    lat REAL,
    lng REAL,
    FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS places_to_visit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    category TEXT,
    visit_date TEXT,
    visit_time TEXT,
    duration_hours REAL,
    ticket_link TEXT,
    price TEXT,
    notes TEXT,
    lat REAL,
    lng REAL,
    FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    cuisine TEXT,
    meal_type TEXT,
    visit_date TEXT,
    visit_time TEXT,
    reservation_link TEXT,
    price_range TEXT,
    notes TEXT,
    lat REAL,
    lng REAL,
    FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transport (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    from_location TEXT,
    to_location TEXT,
    departure_date TEXT,
    departure_time TEXT,
    arrival_date TEXT,
    arrival_time TEXT,
    company TEXT,
    booking_reference TEXT,
    price TEXT,
    notes TEXT,
    FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS itinerary_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    title TEXT NOT NULL,
    description TEXT,
    activity_type TEXT DEFAULT 'custom',
    location TEXT,
    lat REAL,
    lng REAL,
    FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS summary_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    title TEXT,
    url TEXT NOT NULL,
    category TEXT,
    notes TEXT,
    FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE CASCADE
  );
`);

// Migrations: add image_url column if not already present
try { db.exec('ALTER TABLE places_to_visit ADD COLUMN image_url TEXT'); } catch {}
try { db.exec('ALTER TABLE restaurants ADD COLUMN image_url TEXT'); } catch {}

module.exports = db;
