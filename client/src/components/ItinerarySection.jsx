import { useState, useMemo } from 'react';
import { api, geocode } from '../api';
import Modal from './Modal';

const ACTIVITY_TYPES = ['visit', 'eat', 'transport', 'hotel', 'leisure', 'custom'];
const typeColors = { visit: 'badge-blue', eat: 'badge-orange', transport: 'badge-green', hotel: 'badge-purple', leisure: 'badge-gray', custom: 'badge-gray' };
const typeIcons = { visit: '🏛️', eat: '🍽️', transport: '🚀', hotel: '🏨', leisure: '🎯', custom: '📌' };

const empty = { date: '', start_time: '', end_time: '', title: '', description: '', activity_type: 'custom', location: '' };

function formatDay(dateStr) {
  if (!dateStr) return dateStr;
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function ItinerarySection({ plan, itinerary, onRefresh }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [geo, setGeo] = useState('');
  const [defaultDate, setDefaultDate] = useState('');

  const openAdd = (date = '') => { setForm({ ...empty, date }); setGeo(''); setDefaultDate(date); setModal('add'); };
  const openEdit = (item) => { setForm({ ...item }); setGeo(''); setModal(item); };
  const close = () => setModal(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGeocode = async () => {
    if (!form.location) return;
    setGeo('searching');
    const r = await geocode(form.location);
    if (r) { setForm(f => ({ ...f, lat: r.lat, lng: r.lng })); setGeo('found'); }
    else setGeo('notfound');
  };

  const handleSave = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      if (modal === 'add') await api.createItineraryItem(plan.id, form);
      else await api.updateItineraryItem(modal.id, form);
      onRefresh(); close();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this activity?')) return;
    await api.deleteItineraryItem(id);
    onRefresh();
  };

  // Group by date
  const grouped = useMemo(() => {
    const map = {};
    itinerary.forEach(item => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    return map;
  }, [itinerary]);

  // Generate days if plan has dates
  const planDays = useMemo(() => {
    if (!plan.start_date || !plan.end_date) return [];
    const days = [];
    const start = new Date(plan.start_date + 'T00:00:00');
    const end = new Date(plan.end_date + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, [plan.start_date, plan.end_date]);

  const allDates = [...new Set([...planDays, ...Object.keys(grouped)])].sort();

  return (
    <div>
      <div className="section-header">
        <h3>📅 Day-by-Day Itinerary</h3>
        <button className="btn btn-primary btn-sm" onClick={() => openAdd()}>+ Add Activity</button>
      </div>

      {allDates.length === 0 && (
        <p className="text-muted text-small">No itinerary yet. Add travel dates to the trip and start scheduling activities.</p>
      )}

      {allDates.map(date => (
        <div key={date} className="itinerary-day">
          <div className="itinerary-day-header">
            <span>📆 {formatDay(date)}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => openAdd(date)}>+ Activity</button>
          </div>

          {(!grouped[date] || grouped[date].length === 0) ? (
            <p className="text-muted text-small" style={{ paddingLeft: 16, marginTop: 8 }}>No activities planned — click + Activity to add some.</p>
          ) : (
            <div className="timeline">
              {grouped[date].map(item => (
                <div key={item.id} className={`timeline-item type-${item.activity_type}`}>
                  <div className="timeline-time">
                    {item.start_time || '--:--'}{item.end_time ? ` – ${item.end_time}` : ''}
                  </div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="timeline-title">{typeIcons[item.activity_type] || '📌'} {item.title}</div>
                        {item.location && <div className="timeline-desc">📍 {item.location}</div>}
                        {item.description && <div className="timeline-desc">{item.description}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                        <span className={`item-card-badge ${typeColors[item.activity_type] || 'badge-gray'}`}>{item.activity_type}</span>
                        <button className="btn-icon" style={{ padding: '2px 6px' }} onClick={() => openEdit(item)}>✏️</button>
                        <button className="btn-icon danger" style={{ padding: '2px 6px' }} onClick={() => handleDelete(item.id)}>🗑️</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Activity' : 'Edit Activity'} onClose={close}
          footer={<><button className="btn btn-ghost" onClick={close}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
          <div className="form-group"><label>Title *</label><input className="form-control" value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="Activity title" /></div>
          <div className="form-row">
            <div className="form-group"><label>Date *</label><input type="date" className="form-control" value={form.date || ''} onChange={e => set('date', e.target.value)} /></div>
            <div className="form-group">
              <label>Type</label>
              <select className="form-control" value={form.activity_type || 'custom'} onChange={e => set('activity_type', e.target.value)}>
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{typeIcons[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Start Time</label><input type="time" className="form-control" value={form.start_time || ''} onChange={e => set('start_time', e.target.value)} /></div>
            <div className="form-group"><label>End Time</label><input type="time" className="form-control" value={form.end_time || ''} onChange={e => set('end_time', e.target.value)} /></div>
          </div>
          <div className="form-group">
            <label>Location</label>
            <div className="flex gap-2">
              <input className="form-control" value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="Place name or address" style={{ flex: 1 }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleGeocode}>📍 Map</button>
            </div>
            {geo === 'found' && <p className="geocode-status geocode-ok">✓ Found on map</p>}
          </div>
          <div className="form-group"><label>Description / Notes</label><textarea className="form-control" value={form.description || ''} onChange={e => set('description', e.target.value)} rows={3} /></div>
        </Modal>
      )}
    </div>
  );
}
