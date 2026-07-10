import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const API_URL = 'http://localhost:3000/api';

// Main App Component
function App() {
  const [activeSection, setActiveSection] = useState('reservations');

  return (
    <div className="container">
      <header>
        <h1>🌊 Thalassa Dive Resort Booking System</h1>
        <nav>
          <button 
            className={activeSection === 'reservations' ? 'active' : ''}
            onClick={() => setActiveSection('reservations')}
          >
            Reservations
          </button>
          <button 
            className={activeSection === 'new-reservation' ? 'active' : ''}
            onClick={() => setActiveSection('new-reservation')}
          >
            New Reservation
          </button>
          <button 
            className={activeSection === 'guests' ? 'active' : ''}
            onClick={() => setActiveSection('guests')}
          >
            Guests
          </button>
          <button 
            className={activeSection === 'calendar' ? 'active' : ''}
            onClick={() => setActiveSection('calendar')}
          >
            Calendar
          </button>
          <button 
            className={activeSection === 'templates' ? 'active' : ''}
            onClick={() => setActiveSection('templates')}
          >
            Email Templates
          </button>
        </nav>
      </header>

      {activeSection === 'reservations' && <ReservationsSection />}
      {activeSection === 'new-reservation' && <NewReservationSection />}
      {activeSection === 'guests' && <GuestsSection />}
      {activeSection === 'calendar' && <CalendarSection />}
      {activeSection === 'templates' && <TemplatesSection />}
    </div>
  );
}

// Reservations Section
function ReservationsSection() {
  const [reservations, setReservations] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({ property_id: '', status: '' });
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadReservations();
    loadProperties();
  }, []);

  useEffect(() => {
    loadReservations();
  }, [filters]);

  const loadProperties = async () => {
    try {
      const res = await fetch(`${API_URL}/properties`);
      const data = await res.json();
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadReservations = async () => {
    try {
      let url = `${API_URL}/reservations?`;
      if (filters.property_id) url += `property_id=${filters.property_id}&`;
      if (filters.status) url += `status=${filters.status}&`;
      
      const res = await fetch(url);
      const data = await res.json();
      setReservations(data);
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_URL}/reservations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      loadReservations();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const viewDetails = async (id) => {
    try {
      const res = await fetch(`${API_URL}/reservations/${id}`);
      const data = await res.json();
      setSelectedReservation(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading reservation:', error);
    }
  };

  const sendEmail = async (templateType) => {
    try {
      await fetch(`${API_URL}/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedReservation.email,
          template_type: templateType,
          reservation_id: selectedReservation.id
        })
      });
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email');
    }
  };

  return (
    <div className="section active">
      <h2>Reservations</h2>
      
      <div className="filters">
        <select 
          value={filters.property_id} 
          onChange={(e) => setFilters({...filters, property_id: e.target.value})}
        >
          <option value="">All Properties</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        
        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          <option value="pending">Confirmation Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Guest</th>
            <th>Property</th>
            <th>Room</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(r => (
            <tr key={r.id}>
              <td>{r.first_name} {r.last_name}</td>
              <td>{r.property_name}</td>
              <td>{r.room_name}</td>
              <td>{r.check_in_date}</td>
              <td>{r.check_out_date}</td>
              <td>
                <span className={`status-badge status-${r.status}`}>
                  {r.status.replace('_', ' ')}
                </span>
              </td>
              <td>
                <button className="secondary" onClick={() => viewDetails(r.id)}>View</button>
                {' '}
                <select 
                  value={r.status} 
                  onChange={(e) => updateStatus(r.id, e.target.value)}
                  style={{padding: '5px'}}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && selectedReservation && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowModal(false)}>&times;</button>
            <h2>Reservation Details</h2>
            
            <div className="form-group">
              <label>Guest:</label>
              <p>{selectedReservation.first_name} {selectedReservation.last_name}</p>
            </div>
            
            <div className="form-group">
              <label>Email:</label>
              <p>{selectedReservation.email}</p>
            </div>
            
            <div className="form-group">
              <label>Country:</label>
              <p>{selectedReservation.country_origin} {selectedReservation.is_expat && `(Expat - ${selectedReservation.country_residence})`}</p>
            </div>
            
            <div className="form-group">
              <label>Property:</label>
              <p>{selectedReservation.property_name}</p>
            </div>
            
            <div className="form-group">
              <label>Room:</label>
              <p>{selectedReservation.room_name} ({selectedReservation.bed_type}, sleeps {selectedReservation.sleeps})</p>
            </div>
            
            <div className="form-group">
              <label>Dates:</label>
              <p>{selectedReservation.check_in_date} to {selectedReservation.check_out_date}</p>
            </div>
            
            <div className="form-group">
              <label>Status:</label>
              <p><span className={`status-badge status-${selectedReservation.status}`}>{selectedReservation.status.replace('_', ' ')}</span></p>
            </div>
            
            <div className="form-group">
              <label>Arrival Flight:</label>
              <p>{selectedReservation.arrival_flight || 'N/A'} at {selectedReservation.arrival_time || 'N/A'}</p>
            </div>
            
            <div className="form-group">
              <label>Departure Flight:</label>
              <p>{selectedReservation.departure_flight || 'N/A'} at {selectedReservation.departure_time || 'N/A'}</p>
            </div>
            
            {selectedReservation.notes && (
              <div className="form-group">
                <label>Notes:</label>
                <p>{selectedReservation.notes}</p>
              </div>
            )}
            
            <div className="btn-group">
              <button className="primary" onClick={() => sendEmail('pre_checkin')}>
                Send Pre-Checkin Email
              </button>
              <button className="primary" onClick={() => sendEmail('post_checkout')}>
                Send Post-Checkout Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// New Reservation Section
function NewReservationSection() {
  const [properties, setProperties] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    guest_id: '',
    check_in_date: '',
    check_out_date: '',
    room_id: '',
    notes: '',
    arrival_flight: '',
    arrival_time: '',
    departure_flight: '',
    departure_time: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    loadProperties();
    loadGuests();
  }, []);

  useEffect(() => {
    if (formData.guest_id && formData.check_in_date && formData.check_out_date) {
      loadAvailableRooms();
    }
  }, [formData.guest_id, formData.check_in_date, formData.check_out_date]);

  const loadProperties = async () => {
    const res = await fetch(`${API_URL}/properties`);
    const data = await res.json();
    setProperties(data);
  };

  const loadGuests = async () => {
    const res = await fetch(`${API_URL}/guests`);
    const data = await res.json();
    setGuests(data);
  };

  const loadAvailableRooms = async () => {
    const url = `${API_URL}/rooms/available?check_in=${formData.check_in_date}&check_out=${formData.check_out_date}`;
    const res = await fetch(url);
    const data = await res.json();
    setRooms(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      setMessage({ type: 'success', text: 'Reservation created successfully!' });
      setFormData({
        guest_id: '',
        check_in_date: '',
        check_out_date: '',
        room_id: '',
        notes: '',
        arrival_flight: '',
        arrival_time: '',
        departure_flight: '',
        departure_time: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleCreateGuest = async (e) => {
    e.preventDefault();
    const newGuest = {
      first_name: e.target.first_name.value,
      last_name: e.target.last_name.value,
      email: e.target.email.value,
      country_origin: e.target.country_origin.value,
      country_residence: e.target.country_residence.value
    };

    try {
      const res = await fetch(`${API_URL}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuest)
      });

      const guest = await res.json();
      setGuests([...guests, guest]);
      setFormData({...formData, guest_id: guest.id});
      setShowGuestModal(false);
    } catch (error) {
      alert('Error creating guest');
    }
  };

  // Group rooms by property
  const roomsByProperty = {};
  rooms.forEach(room => {
    if (!roomsByProperty[room.property_id]) {
      roomsByProperty[room.property_id] = [];
    }
    roomsByProperty[room.property_id].push(room);
  });

  return (
    <div className="section active">
      <h2>New Reservation</h2>

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Guest *</label>
          <div style={{display: 'flex', gap: '10px'}}>
            <select
              value={formData.guest_id}
              onChange={(e) => setFormData({...formData, guest_id: e.target.value})}
              required
              style={{flex: 1}}
            >
              <option value="">Select Guest</option>
              {guests.map(g => (
                <option key={g.id} value={g.id}>
                  {g.first_name} {g.last_name} ({g.email})
                </option>
              ))}
            </select>
            <button type="button" className="secondary" onClick={() => setShowGuestModal(true)}>
              + New Guest
            </button>
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
          <div className="form-group">
            <label>Check-in Date *</label>
            <input
              type="date"
              value={formData.check_in_date}
              onChange={(e) => setFormData({...formData, check_in_date: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Check-out Date *</label>
            <input
              type="date"
              value={formData.check_out_date}
              onChange={(e) => setFormData({...formData, check_out_date: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Room *</label>
          <select
            value={formData.room_id}
            onChange={(e) => setFormData({...formData, room_id: e.target.value})}
            required
          >
            <option value="">Select Room</option>
            {Object.entries(roomsByProperty).map(([propertyId, propertyRooms]) => {
              const property = properties.find(p => p.id == propertyId);
              return (
                <optgroup key={propertyId} label={property?.name}>
                  {propertyRooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.room_name} - {room.bed_type} (sleeps {room.sleeps}) {room.has_ac ? 'AC' : 'Fan'}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          {!formData.room_id && rooms.length > 0 && (
            <small>Select dates above to see available rooms</small>
          )}
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
          <div className="form-group">
            <label>Arrival Flight</label>
            <input
              type="text"
              placeholder="Flight number"
              value={formData.arrival_flight}
              onChange={(e) => setFormData({...formData, arrival_flight: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Arrival Time</label>
            <input
              type="time"
              value={formData.arrival_time}
              onChange={(e) => setFormData({...formData, arrival_time: e.target.value})}
            />
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
          <div className="form-group">
            <label>Departure Flight</label>
            <input
              type="text"
              placeholder="Flight number"
              value={formData.departure_flight}
              onChange={(e) => setFormData({...formData, departure_flight: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Departure Time</label>
            <input
              type="time"
              value={formData.departure_time}
              onChange={(e) => setFormData({...formData, departure_time: e.target.value})}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Any special requests or notes..."
          />
        </div>

        <button type="submit" className="primary">Create Reservation</button>
      </form>

      {/* New Guest Modal */}
      {showGuestModal && (
        <div className="modal-overlay active" onClick={() => setShowGuestModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowGuestModal(false)}>&times;</button>
            <h2>New Guest</h2>
            <form onSubmit={handleCreateGuest}>
              <div className="form-group">
                <label>First Name *</label>
                <input type="text" name="first_name" required />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input type="text" name="last_name" required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="email" required />
              </div>
              <div className="form-group">
                <label>Country of Origin *</label>
                <input type="text" name="country_origin" required />
              </div>
              <div className="form-group">
                <label>Country of Residence</label>
                <input type="text" name="country_residence" placeholder="Leave blank if same as origin" />
                <small>If different from origin, guest will be marked as "Expat"</small>
              </div>
              <button type="submit" className="primary">Create Guest</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Guests Section
function GuestsSection() {
  const [guests, setGuests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    const res = await fetch(`${API_URL}/guests`);
    const data = await res.json();
    setGuests(data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const newGuest = {
      first_name: e.target.first_name.value,
      last_name: e.target.last_name.value,
      email: e.target.email.value,
      country_origin: e.target.country_origin.value,
      country_residence: e.target.country_residence.value
    };

    try {
      await fetch(`${API_URL}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuest)
      });
      loadGuests();
      setShowModal(false);
    } catch (error) {
      alert('Error creating guest');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const updatedGuest = {
      first_name: e.target.first_name.value,
      last_name: e.target.last_name.value,
      email: e.target.email.value,
      country_origin: e.target.country_origin.value,
      country_residence: e.target.country_residence.value
    };

    try {
      await fetch(`${API_URL}/guests/${editingGuest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGuest)
      });
      loadGuests();
      setShowModal(false);
      setEditingGuest(null);
    } catch (error) {
      alert('Error updating guest');
    }
  };

  return (
    <div className="section active">
      <h2>Guests</h2>
      
      <button className="primary" onClick={() => setShowModal(true)} style={{marginBottom: '20px'}}>
        + Add New Guest
      </button>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Origin</th>
            <th>Residence</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {guests.map(g => (
            <tr key={g.id}>
              <td>{g.first_name} {g.last_name}</td>
              <td>{g.email}</td>
              <td>{g.country_origin}</td>
              <td>{g.is_expat ? `${g.country_residence} (Expat)` : g.country_origin}</td>
              <td>
                <button className="secondary" onClick={() => {setEditingGuest(g); setShowModal(true);}}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowModal(false)}>&times;</button>
            <h2>{editingGuest ? 'Edit Guest' : 'New Guest'}</h2>
            <form onSubmit={editingGuest ? handleEdit : handleCreate}>
              <div className="form-group">
                <label>First Name *</label>
                <input 
                  type="text" 
                  name="first_name" 
                  defaultValue={editingGuest?.first_name} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input 
                  type="text" 
                  name="last_name" 
                  defaultValue={editingGuest?.last_name} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input 
                  type="email" 
                  name="email" 
                  defaultValue={editingGuest?.email} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Country of Origin *</label>
                <input 
                  type="text" 
                  name="country_origin" 
                  defaultValue={editingGuest?.country_origin} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Country of Residence</label>
                <input 
                  type="text" 
                  name="country_residence" 
                  defaultValue={editingGuest?.country_residence || ''} 
                  placeholder="Leave blank if same as origin" 
                />
                <small>If different from origin, guest will be marked as "Expat"</small>
              </div>
              <button type="submit" className="primary">
                {editingGuest ? 'Update Guest' : 'Create Guest'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Calendar Section
function CalendarSection() {
  const [date, setDate] = useState(new Date());
  const [occupancyData, setOccupancyData] = useState([]);
  const [summary, setSummary] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    loadOccupancyData();
    loadSummary();
  }, [date, selectedProperty]);

  const loadProperties = async () => {
    const res = await fetch(`${API_URL}/properties`);
    const data = await res.json();
    setProperties(data);
  };

  const loadOccupancyData = async () => {
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    let url = `${API_URL}/calendar/occupancy?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
    if (selectedProperty) url += `&property_id=${selectedProperty}`;
    
    const res = await fetch(url);
    const data = await res.json();
    setOccupancyData(data);
  };

  const loadSummary = async () => {
    const today = date.toISOString().split('T')[0];
    let url = `${API_URL}/calendar/summary?date=${today}`;
    if (selectedProperty) url += `&property_id=${selectedProperty}`;
    
    const res = await fetch(url);
    const data = await res.json();
    setSummary(data);
  };

  const getTileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      const dayReservations = occupancyData.filter(r => 
        r.check_in_date <= dateStr && r.check_out_date > dateStr
      );
      
      if (dayReservations.length > 0) {
        return (
          <div style={{fontSize: '0.7rem', marginTop: '5px'}}>
            <div style={{background: '#00a8cc', color: 'white', borderRadius: '3px', padding: '2px 5px'}}>
              {dayReservations.length} guest{dayReservations.length !== 1 ? 's' : ''}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="section active">
      <h2>Occupancy Calendar</h2>

      <div className="filters">
        <select 
          value={selectedProperty} 
          onChange={(e) => setSelectedProperty(e.target.value)}
        >
          <option value="">All Properties</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="calendar-container">
        <Calendar
          onChange={setDate}
          value={date}
          tileContent={getTileContent}
        />
      </div>

      <h3 style={{marginTop: '30px'}}>Today's Occupancy Summary</h3>
      
      {summary.map(s => (
        <div key={s.property_id} className="card" style={{marginTop: '15px'}}>
          <h3>{s.property_name}</h3>
          <p>Rooms: {s.occupied_rooms} / {s.total_rooms} occupied</p>
          <div className="occupancy-bar">
            <div 
              className="occupancy-fill" 
              style={{width: `${(s.occupied_rooms / s.total_rooms) * 100}%`}}
            />
          </div>
          <p>Beds: {s.occupied_beds} / {s.total_beds} occupied</p>
          <p>Checked in today: {s.checked_in_rooms} rooms</p>
        </div>
      ))}

      <h3 style={{marginTop: '30px'}}>Upcoming Arrivals & Departures</h3>
      
      <table>
        <thead>
          <tr>
            <th>Guest</th>
            <th>Property</th>
            <th>Room</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {occupancyData.slice(0, 20).map(r => (
            <tr key={r.reservation_id}>
              <td>{r.first_name} {r.last_name}</td>
              <td>{r.property_name}</td>
              <td>{r.room_name}</td>
              <td>{r.check_in_date}</td>
              <td>{r.check_out_date}</td>
              <td>
                <span className={`status-badge status-${r.status}`}>
                  {r.status.replace('_', ' ')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Email Templates Section
function TemplatesSection() {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    template_type: '',
    subject: '',
    body: '',
    is_active: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const res = await fetch(`${API_URL}/email-templates`);
    const data = await res.json();
    setTemplates(data);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      template_type: template.template_type,
      subject: template.subject,
      body: template.body,
      is_active: template.is_active === 1
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await fetch(`${API_URL}/email-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      loadTemplates();
      setEditingTemplate(null);
    } catch (error) {
      alert('Error updating template');
    }
  };

  return (
    <div className="section active">
      <h2>Email Templates</h2>

      <div className="card-grid">
        {templates.map(t => (
          <div key={t.id} className="card">
            <h3>{t.template_type === 'pre_checkin' ? 'Pre-Checkin Email' : 'Post-Checkout Email'}</h3>
            <p><strong>Subject:</strong> {t.subject}</p>
            <p><strong>Status:</strong> {t.is_active ? 'Active' : 'Inactive'}</p>
            <div style={{marginTop: '15px'}}>
              <button className="secondary" onClick={() => handleEdit(t)}>Edit Template</button>
            </div>
            <div style={{marginTop: '10px', fontSize: '0.85rem', color: '#666'}}>
              <p>Available placeholders:</p>
              <code>{`{{guest_name}}, {{property_name}}, {{check_in_date}}, {{check_out_date}}, {{room_name}}, {{arrival_flight}}, {{arrival_time}}, {{departure_flight}}, {{departure_time}}`}</code>
            </div>
          </div>
        ))}
      </div>

      {editingTemplate && (
        <div className="modal-overlay active" onClick={() => setEditingTemplate(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setEditingTemplate(null)}>&times;</button>
            <h2>Edit Email Template</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Template Type</label>
                <select
                  value={formData.template_type}
                  onChange={(e) => setFormData({...formData, template_type: e.target.value})}
                  disabled
                >
                  <option value="pre_checkin">Pre-Checkin</option>
                  <option value="post_checkout">Post-Checkout</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Body</label>
                <textarea
                  rows="10"
                  value={formData.body}
                  onChange={(e) => setFormData({...formData, body: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    style={{width: 'auto', marginRight: '10px'}}
                  />
                  Active
                </label>
              </div>
              
              <button type="submit" className="primary">Save Template</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
