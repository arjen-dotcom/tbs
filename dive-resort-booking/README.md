# Thalassa Dive Resort Booking System

A comprehensive online booking system for dive resorts with multi-property support.

## Features

- **Multi-Property Support**: Manage reservations across 3 properties:
  - Thalassa Manado
  - Thalassa Lembeh
  - Guesthouse Thalassa

- **Reservation Management**:
  - Create, view, update, and delete reservations
  - Assign guests to specific rooms
  - Split accommodation between properties (multiple reservations per guest)
  - Track room status: Confirmation Pending, Confirmed, Checked In, Checked Out

- **Guest Management**:
  - Store guest information (name, email, country of origin/residence)
  - Automatic "Expat" marking when residence differs from origin
  - Guest search and filtering

- **Room Inventory**:
  - Complete room inventory for all 3 properties
  - Bed configurations: Double (sleeps 2), Twin (sleeps 2), Single (sleeps 1)
  - AC/Fan indicators for Guesthouse rooms
  - Real-time availability checking

- **Calendar View**:
  - Interactive calendar showing occupancy
  - Filter by property
  - Daily occupancy summaries
  - Visual indicators for guest counts

- **Email Templates**:
  - Pre-checkin automated emails
  - Post-checkout automated emails
  - Customizable templates with placeholders
  - One-click email sending from reservation details

- **Flight Information**:
  - Track arrival and departure flights
  - Record flight times for transfer coordination

## Tech Stack

- **Backend**: Node.js, Express, Better-SQLite3
- **Frontend**: React, Vite, react-calendar
- **Email**: Nodemailer (configurable SMTP)

## Installation

### Backend Setup

```bash
cd backend
npm install
node database.js  # Initialize database
npm start         # Start server on port 3000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev       # Start dev server on port 5173
```

## Environment Variables (Optional)

For email functionality, set these environment variables:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM=noreply@thalassa.com
```

## API Endpoints

### Properties
- `GET /api/properties` - Get all properties

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/available?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD` - Get available rooms

### Guests
- `GET /api/guests` - Get all guests
- `POST /api/guests` - Create new guest
- `PUT /api/guests/:id` - Update guest

### Reservations
- `GET /api/reservations` - Get all reservations
- `POST /api/reservations` - Create new reservation
- `PUT /api/reservations/:id` - Update reservation
- `PATCH /api/reservations/:id/status` - Update status
- `DELETE /api/reservations/:id` - Delete reservation

### Calendar
- `GET /api/calendar/occupancy?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Get occupancy data
- `GET /api/calendar/summary?date=YYYY-MM-DD` - Get occupancy summary

### Email Templates
- `GET /api/email-templates` - Get all templates
- `PUT /api/email-templates/:id` - Update template
- `POST /api/email/send` - Send email

## Room Configurations

### Thalassa Manado
- Villa Ginseng: 1 Double + 1 Twin room
- Villa Saguer: 1 Double + 1 Twin room
- Bungalows B1-B6: Mix of Double and Twin
- Bintang Suite: 1 Double + 1 Twin
- Single Rooms S1-S2

### Thalassa Lembeh
- Bungalows B4-B16: Mix of Double and Twin rooms
- Single Rooms S1-S3

### Guesthouse Thalassa
- Rooms 1-6: Mix of Double (AC/Fan) and Single (Fan)
- Garden Rooms 1-2: Double (AC/Fan)

## Usage

1. **Create a Guest**: Go to the Guests section and add new guests
2. **Make a Reservation**: 
   - Select guest (or create new)
   - Choose check-in/check-out dates
   - Select available room from any property
   - Add flight information and notes
3. **Manage Status**: Update reservation status as guest progresses through stay
4. **Send Emails**: Use pre-configured templates to send automated emails
5. **View Calendar**: Check occupancy across all properties

## License

ISC
