const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Configure email transporter (update with your SMTP settings)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password'
  }
});

// ==================== PROPERTIES ====================

// Get all properties
app.get('/api/properties', (req, res) => {
  try {
    const properties = db.prepare('SELECT * FROM properties').all();
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ROOMS ====================

// Get all rooms with property info
app.get('/api/rooms', (req, res) => {
  try {
    const { property_id } = req.query;
    let query = `
      SELECT r.*, p.name as property_name, p.type as property_type
      FROM rooms r
      JOIN properties p ON r.property_id = p.id
    `;
    
    if (property_id) {
      query += ' WHERE r.property_id = ?';
      const rooms = db.prepare(query).all(property_id);
      res.json(rooms);
    } else {
      const rooms = db.prepare(query).all();
      res.json(rooms);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available rooms for a date range
app.get('/api/rooms/available', (req, res) => {
  try {
    const { check_in, check_out, property_id } = req.query;
    
    let query = `
      SELECT r.*, p.name as property_name, p.type as property_type
      FROM rooms r
      JOIN properties p ON r.property_id = p.id
      WHERE r.id NOT IN (
        SELECT room_id FROM reservations
        WHERE status IN ('pending', 'confirmed', 'checked_in')
        AND NOT (check_out_date <= ? OR check_in_date >= ?)
      )
    `;
    
    const params = [check_out, check_in];
    
    if (property_id) {
      query += ' AND r.property_id = ?';
      params.push(property_id);
    }
    
    const rooms = db.prepare(query).all(...params);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== GUESTS ====================

// Get all guests
app.get('/api/guests', (req, res) => {
  try {
    const guests = db.prepare('SELECT * FROM guests ORDER BY last_name, first_name').all();
    res.json(guests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get guest by ID
app.get('/api/guests/:id', (req, res) => {
  try {
    const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.id);
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    res.json(guest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new guest
app.post('/api/guests', (req, res) => {
  try {
    const { first_name, last_name, email, country_origin, country_residence } = req.body;
    
    const is_expat = country_residence && country_residence !== country_origin ? 1 : 0;
    
    const stmt = db.prepare(`
      INSERT INTO guests (first_name, last_name, email, country_origin, country_residence, is_expat)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(first_name, last_name, email, country_origin, country_residence || null, is_expat);
    
    res.status(201).json({
      id: result.lastInsertRowid,
      first_name,
      last_name,
      email,
      country_origin,
      country_residence: country_residence || null,
      is_expat: is_expat === 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update guest
app.put('/api/guests/:id', (req, res) => {
  try {
    const { first_name, last_name, email, country_origin, country_residence } = req.body;
    const is_expat = country_residence && country_residence !== country_origin ? 1 : 0;
    
    const stmt = db.prepare(`
      UPDATE guests 
      SET first_name = ?, last_name = ?, email = ?, country_origin = ?, country_residence = ?, is_expat = ?
      WHERE id = ?
    `);
    
    stmt.run(first_name, last_name, email, country_origin, country_residence || null, is_expat, req.params.id);
    
    res.json({
      id: parseInt(req.params.id),
      first_name,
      last_name,
      email,
      country_origin,
      country_residence: country_residence || null,
      is_expat: is_expat === 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RESERVATIONS ====================

// Get all reservations
app.get('/api/reservations', (req, res) => {
  try {
    const { property_id, status, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        r.id,
        r.check_in_date,
        r.check_out_date,
        r.room_id,
        r.status,
        r.notes,
        r.arrival_flight,
        r.arrival_time,
        r.departure_flight,
        r.departure_time,
        r.created_at,
        r.updated_at,
        g.id as guest_id,
        g.first_name,
        g.last_name,
        g.email,
        g.country_origin,
        g.country_residence,
        g.is_expat,
        rm.room_name,
        rm.bed_type,
        rm.sleeps,
        rm.has_ac,
        p.id as property_id,
        p.name as property_name,
        p.type as property_type
      FROM reservations r
      JOIN guests g ON r.guest_id = g.id
      JOIN rooms rm ON r.room_id = rm.id
      JOIN properties p ON rm.property_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (property_id) {
      query += ' AND p.id = ?';
      params.push(property_id);
    }
    
    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    
    if (start_date) {
      query += ' AND r.check_in_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND r.check_out_date <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY r.check_in_date DESC';
    
    const reservations = db.prepare(query).all(...params);
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reservation by ID
app.get('/api/reservations/:id', (req, res) => {
  try {
    const reservation = db.prepare(`
      SELECT 
        r.*,
        g.first_name,
        g.last_name,
        g.email,
        g.country_origin,
        g.country_residence,
        g.is_expat,
        rm.room_name,
        rm.bed_type,
        rm.sleeps,
        rm.has_ac,
        rm.property_id,
        p.name as property_name,
        p.type as property_type
      FROM reservations r
      JOIN guests g ON r.guest_id = g.id
      JOIN rooms rm ON r.room_id = rm.id
      JOIN properties p ON rm.property_id = p.id
      WHERE r.id = ?
    `).get(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new reservation
app.post('/api/reservations', (req, res) => {
  try {
    const { 
      guest_id, 
      check_in_date, 
      check_out_date, 
      room_id, 
      notes, 
      arrival_flight, 
      arrival_time, 
      departure_flight, 
      departure_time 
    } = req.body;
    
    // Validate dates
    if (new Date(check_in_date) >= new Date(check_out_date)) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }
    
    // Check room availability
    const existing = db.prepare(`
      SELECT id FROM reservations
      WHERE room_id = ?
      AND status IN ('pending', 'confirmed', 'checked_in')
      AND NOT (check_out_date <= ? OR check_in_date >= ?)
    `).get(room_id, check_out_date, check_in_date);
    
    if (existing) {
      return res.status(400).json({ error: 'Room is not available for the selected dates' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO reservations (guest_id, check_in_date, check_out_date, room_id, status, notes, arrival_flight, arrival_time, departure_flight, departure_time)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      guest_id, 
      check_in_date, 
      check_out_date, 
      room_id, 
      notes || null, 
      arrival_flight || null, 
      arrival_time || null, 
      departure_flight || null, 
      departure_time || null
    );
    
    res.status(201).json({
      id: result.lastInsertRowid,
      guest_id,
      check_in_date,
      check_out_date,
      room_id,
      status: 'pending',
      notes: notes || null,
      arrival_flight: arrival_flight || null,
      arrival_time: arrival_time || null,
      departure_flight: departure_flight || null,
      departure_time: departure_time || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update reservation
app.put('/api/reservations/:id', (req, res) => {
  try {
    const { 
      guest_id, 
      check_in_date, 
      check_out_date, 
      room_id, 
      status, 
      notes, 
      arrival_flight, 
      arrival_time, 
      departure_flight, 
      departure_time 
    } = req.body;
    
    // Validate dates if provided
    if (check_in_date && check_out_date && new Date(check_in_date) >= new Date(check_out_date)) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }
    
    // Check room availability if room or dates changed
    if (room_id || check_in_date || check_out_date) {
      const current = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
      const checkRoom = room_id || current.room_id;
      const checkIn = check_in_date || current.check_in_date;
      const checkOut = check_out_date || current.check_out_date;
      
      const existing = db.prepare(`
        SELECT id FROM reservations
        WHERE room_id = ?
        AND id != ?
        AND status IN ('pending', 'confirmed', 'checked_in')
        AND NOT (check_out_date <= ? OR check_in_date >= ?)
      `).get(checkRoom, req.params.id, checkOut, checkIn);
      
      if (existing) {
        return res.status(400).json({ error: 'Room is not available for the selected dates' });
      }
    }
    
    const stmt = db.prepare(`
      UPDATE reservations 
      SET guest_id = COALESCE(?, guest_id),
          check_in_date = COALESCE(?, check_in_date),
          check_out_date = COALESCE(?, check_out_date),
          room_id = COALESCE(?, room_id),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          arrival_flight = COALESCE(?, arrival_flight),
          arrival_time = COALESCE(?, arrival_time),
          departure_flight = COALESCE(?, departure_flight),
          departure_time = COALESCE(?, departure_time),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      guest_id, 
      check_in_date, 
      check_out_date, 
      room_id, 
      status, 
      notes, 
      arrival_flight, 
      arrival_time, 
      departure_flight, 
      departure_time,
      req.params.id
    );
    
    res.json({
      id: parseInt(req.params.id),
      guest_id,
      check_in_date,
      check_out_date,
      room_id,
      status,
      notes,
      arrival_flight,
      arrival_time,
      departure_flight,
      departure_time
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete reservation
app.delete('/api/reservations/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM reservations WHERE id = ?').run(req.params.id);
    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update reservation status
app.patch('/api/reservations/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'checked_in', 'checked_out'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    db.prepare(`
      UPDATE reservations 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.params.id);
    
    res.json({ id: parseInt(req.params.id), status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CALENDAR / OCCUPANCY ====================

// Get occupancy data for calendar view
app.get('/api/calendar/occupancy', (req, res) => {
  try {
    const { start_date, end_date, property_id } = req.query;
    
    let query = `
      SELECT 
        r.id as reservation_id,
        r.check_in_date,
        r.check_out_date,
        r.status,
        r.room_id,
        rm.room_name,
        rm.bed_type,
        rm.sleeps,
        p.id as property_id,
        p.name as property_name,
        g.first_name,
        g.last_name
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN properties p ON rm.property_id = p.id
      JOIN guests g ON r.guest_id = g.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (start_date) {
      query += ' AND r.check_out_date > ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND r.check_in_date < ?';
      params.push(end_date);
    }
    
    if (property_id) {
      query += ' AND p.id = ?';
      params.push(property_id);
    }
    
    const reservations = db.prepare(query).all(...params);
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get room occupancy summary
app.get('/api/calendar/summary', (req, res) => {
  try {
    const { date, property_id } = req.query;
    
    let query = `
      SELECT 
        p.id as property_id,
        p.name as property_name,
        p.type as property_type,
        COUNT(DISTINCT rm.id) as total_rooms,
        COUNT(DISTINCT CASE WHEN r.id IS NOT NULL AND r.status IN ('pending', 'confirmed', 'checked_in') THEN rm.id END) as occupied_rooms,
        COUNT(DISTINCT CASE WHEN r.id IS NOT NULL AND r.status = 'checked_in' THEN rm.id END) as checked_in_rooms,
        SUM(CASE WHEN r.id IS NOT NULL AND r.status IN ('pending', 'confirmed', 'checked_in') THEN rm.sleeps ELSE 0 END) as occupied_beds,
        SUM(rm.sleeps) as total_beds
      FROM properties p
      JOIN rooms rm ON p.id = rm.property_id
      LEFT JOIN reservations r ON rm.id = r.room_id 
        AND r.status IN ('pending', 'confirmed', 'checked_in')
        AND r.check_in_date <= ? 
        AND r.check_out_date > ?
      WHERE 1=1
    `;
    
    const params = [date || new Date().toISOString().split('T')[0], date || new Date().toISOString().split('T')[0]];
    
    if (property_id) {
      query += ' AND p.id = ?';
      params.push(property_id);
    }
    
    query += ' GROUP BY p.id, p.name, p.type';
    
    const summary = db.prepare(query).all(...params);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EMAIL TEMPLATES ====================

// Get all email templates
app.get('/api/email-templates', (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM email_templates').all();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get template by type
app.get('/api/email-templates/:type', (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM email_templates WHERE template_type = ?').get(req.params.type);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update email template
app.put('/api/email-templates/:id', (req, res) => {
  try {
    const { template_type, subject, body, is_active } = req.body;
    
    db.prepare(`
      UPDATE email_templates 
      SET template_type = ?, subject = ?, body = ?, is_active = ?
      WHERE id = ?
    `).run(template_type, subject, body, is_active ? 1 : 0, req.params.id);
    
    res.json({
      id: parseInt(req.params.id),
      template_type,
      subject,
      body,
      is_active: is_active ? 1 : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send email to guest
app.post('/api/email/send', async (req, res) => {
  try {
    const { to, subject, body, template_type, reservation_id } = req.body;
    
    // If template_type is provided, get the template and merge with reservation data
    let emailBody = body;
    let emailSubject = subject;
    
    if (template_type && reservation_id) {
      const template = db.prepare('SELECT * FROM email_templates WHERE template_type = ?').get(template_type);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      const reservation = db.prepare(`
        SELECT 
          r.*,
          g.first_name,
          g.last_name,
          rm.room_name,
          p.name as property_name
        FROM reservations r
        JOIN guests g ON r.guest_id = g.id
        JOIN rooms rm ON r.room_id = rm.id
        JOIN properties p ON rm.property_id = p.id
        WHERE r.id = ?
      `).get(reservation_id);
      
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      
      // Replace placeholders
      emailBody = template.body
        .replace('{{guest_name}}', `${reservation.first_name} ${reservation.last_name}`)
        .replace('{{property_name}}', reservation.property_name)
        .replace('{{check_in_date}}', reservation.check_in_date)
        .replace('{{check_out_date}}', reservation.check_out_date)
        .replace('{{room_name}}', reservation.room_name)
        .replace('{{arrival_flight}}', reservation.arrival_flight || 'N/A')
        .replace('{{arrival_time}}', reservation.arrival_time || 'N/A')
        .replace('{{departure_flight}}', reservation.departure_flight || 'N/A')
        .replace('{{departure_time}}', reservation.departure_time || 'N/A');
      
      emailSubject = template.subject;
    }
    
    // Send email (in development, this will log to console)
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@thalassa.com',
      to,
      subject: emailSubject,
      text: emailBody
    };
    
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      await transporter.sendMail(mailOptions);
    } else {
      console.log('Email would be sent:', mailOptions);
    }
    
    res.json({ message: 'Email sent successfully', to, subject: emailSubject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API Endpoints:');
  console.log('  GET    /api/properties - Get all properties');
  console.log('  GET    /api/rooms - Get all rooms');
  console.log('  GET    /api/rooms/available - Get available rooms');
  console.log('  GET    /api/guests - Get all guests');
  console.log('  POST   /api/guests - Create new guest');
  console.log('  PUT    /api/guests/:id - Update guest');
  console.log('  GET    /api/reservations - Get all reservations');
  console.log('  POST   /api/reservations - Create new reservation');
  console.log('  PUT    /api/reservations/:id - Update reservation');
  console.log('  PATCH  /api/reservations/:id/status - Update reservation status');
  console.log('  DELETE /api/reservations/:id - Delete reservation');
  console.log('  GET    /api/calendar/occupancy - Get calendar occupancy data');
  console.log('  GET    /api/calendar/summary - Get occupancy summary');
  console.log('  GET    /api/email-templates - Get all email templates');
  console.log('  PUT    /api/email-templates/:id - Update email template');
  console.log('  POST   /api/email/send - Send email to guest');
});
