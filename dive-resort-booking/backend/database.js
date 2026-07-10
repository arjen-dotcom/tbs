const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'booking.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Properties table
  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('resort', 'guesthouse'))
  );

  -- Rooms table
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    room_name TEXT NOT NULL,
    bed_type TEXT NOT NULL CHECK(bed_type IN ('double', 'twin', 'single')),
    sleeps INTEGER NOT NULL DEFAULT 1,
    has_ac INTEGER DEFAULT 0,
    FOREIGN KEY (property_id) REFERENCES properties(id),
    UNIQUE(property_id, room_name)
  );

  -- Guests table
  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    country_origin TEXT NOT NULL,
    country_residence TEXT,
    is_expat INTEGER DEFAULT 0
  );

  -- Reservations table
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    room_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'checked_in', 'checked_out')),
    notes TEXT,
    arrival_flight TEXT,
    arrival_time TEXT,
    departure_flight TEXT,
    departure_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES guests(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
  );

  -- Email templates table
  CREATE TABLE IF NOT EXISTS email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_type TEXT NOT NULL CHECK(template_type IN ('pre_checkin', 'post_checkout')),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Insert default properties
  INSERT OR IGNORE INTO properties (name, type) VALUES 
    ('Thalassa Manado', 'resort'),
    ('Thalassa Lembeh', 'resort'),
    ('Guesthouse Thalassa', 'guesthouse');

  -- Insert rooms for Thalassa Manado
  INSERT OR IGNORE INTO rooms (property_id, room_name, bed_type, sleeps, has_ac) 
  SELECT p.id, 'Villa Ginseng - Double', 'double', 2, 1 FROM properties p WHERE p.name = 'Thalassa Manado'
  UNION ALL SELECT p.id, 'Villa Ginseng - Twin', 'twin', 2, 1 FROM properties p WHERE p.name = 'Thalassa Manado'
  UNION ALL SELECT p.id, 'Villa Saguer - Double', 'double', 2, 1 FROM properties p WHERE p.name = 'Thalassa Manado'
  UNION ALL SELECT p.id, 'Villa Saguer - Twin', 'twin', 2, 1 FROM properties p WHERE p.name = 'Thalassa Manado'
  UNION ALL SELECT p.id, 'B1', 'double', 2, 1 FROM properties p WHERE p.name = 'Thalassa Manado'
  UNION ALL SELECT p.id, 'B2', 'twin', 2, 1 FROM properties p WHERE p.name = 'Thalassa Manado'
  UNION ALL SELECT p.id, 'B3', 'double', 2, 1 FROM properties p WHERE p.name = 'Thalassa Manado'
  UNION ALL SELECT p.id, 'B4', 'twin', 2, 1 FROM properties p WHERE p.name = 'Thalassa Manado'
  UNION ALL SELECT p.id, 'B5', 'double', 2, 1 FROM properties p WHERE p.name = 'Thalassa Manado'
  UNION ALL SELECT p.id, 'B6', 'double', 2, 1 FROM properties p WHERE p.name = 'Thalassa Manado'
  UNION ALL SELECT p.id, 'Bintang Suite - Double', 'double', 2, 1 FROM properties p WHERE p.name = 'Thalassa Manado'
  UNION ALL SELECT p.id, 'Bintang Suite - Twin', 'twin', 2, 1 FROM properties p WHERE p.name = 'Thalassa Manado'
  UNION ALL SELECT p.id, 'S1', 'single', 1, 1 FROM properties p WHERE p.name = 'Thalassa Manado'
  UNION ALL SELECT p.id, 'S2', 'single', 1, 1 FROM properties p WHERE p.name = 'Thalassa Manado';

  -- Insert rooms for Thalassa Lembeh
  INSERT OR IGNORE INTO rooms (property_id, room_name, bed_type, sleeps, has_ac) 
  SELECT p.id, 'B4', 'double', 2, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'B5', 'twin', 2, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'B6', 'double', 2, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'B7', 'double', 2, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'B8', 'double', 2, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'B9', 'double', 2, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'B10', 'twin', 2, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'B11', 'twin', 2, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'B12', 'double', 2, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'B14', 'twin', 2, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'B15', 'twin', 2, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'B16', 'twin', 2, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'S1', 'single', 1, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'S2', 'single', 1, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh'
  UNION ALL SELECT p.id, 'S3', 'single', 1, 1 FROM properties p WHERE p.name = 'Thalassa Lembeh';

  -- Insert rooms for Guesthouse Thalassa
  INSERT OR IGNORE INTO rooms (property_id, room_name, bed_type, sleeps, has_ac) 
  SELECT p.id, 'Room 1', 'double', 2, 1 FROM properties p WHERE p.name = 'Guesthouse Thalassa'
  UNION ALL SELECT p.id, 'Room 2', 'double', 2, 1 FROM properties p WHERE p.name = 'Guesthouse Thalassa'
  UNION ALL SELECT p.id, 'Room 3', 'twin', 2, 0 FROM properties p WHERE p.name = 'Guesthouse Thalassa'
  UNION ALL SELECT p.id, 'Room 4', 'double', 2, 0 FROM properties p WHERE p.name = 'Guesthouse Thalassa'
  UNION ALL SELECT p.id, 'Room 5', 'double', 2, 1 FROM properties p WHERE p.name = 'Guesthouse Thalassa'
  UNION ALL SELECT p.id, 'Room 6', 'single', 1, 0 FROM properties p WHERE p.name = 'Guesthouse Thalassa'
  UNION ALL SELECT p.id, 'Garden Room 1', 'double', 2, 1 FROM properties p WHERE p.name = 'Guesthouse Thalassa'
  UNION ALL SELECT p.id, 'Garden Room 2', 'double', 2, 0 FROM properties p WHERE p.name = 'Guesthouse Thalassa';

  -- Insert default email templates
  INSERT OR IGNORE INTO email_templates (template_type, subject, body) VALUES
    ('pre_checkin', 'Welcome to Thalassa - Your Upcoming Stay', 
     'Dear {{guest_name}},\n\nWe are excited to welcome you to {{property_name}}!\n\nYour reservation details:\nCheck-in: {{check_in_date}}\nCheck-out: {{check_out_date}}\nRoom: {{room_name}}\n\nArrival Flight: {{arrival_flight}} at {{arrival_time}}\nDeparture Flight: {{departure_flight}} at {{departure_time}}\n\nIf you have any questions, please do not hesitate to contact us.\n\nBest regards,\nThalassa Team'),
    ('post_checkout', 'Thank You for Staying at Thalassa', 
     'Dear {{guest_name}},\n\nThank you for choosing to stay at {{property_name}}.\n\nWe hope you enjoyed your stay with us from {{check_in_date}} to {{check_out_date}}.\n\nWe would love to hear about your experience. Please feel free to leave us a review.\n\nWe look forward to welcoming you back soon!\n\nBest regards,\nThalassa Team');
`);

console.log('Database initialized successfully!');

module.exports = db;
