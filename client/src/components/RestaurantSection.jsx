import { useState } from 'react';
import { api, geocode, fetchPlaceImage } from '../api';
import Modal from './Modal';

const MEAL_TYPES = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snack', 'Coffee', 'Drinks'];
const PRICE_RANGES = ['€ (Budget)', '€€ (Mid-range)', '€€€ (Upscale)', '€€€€ (Fine dining)'];
const empty = { name: '', address: '', cuisine: '', meal_type: 'Dinner', visit_date: '', visit_time: '', reservation_link: '', price_range: '', notes: '' };

export default function RestaurantSection({ plan, restaurants, onRefresh }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [geo, setGeo] = useState('');
  const [lightbox, setLightbox] = useState(null);

  const openAdd = () => { setForm(empty); setGeo(''); setModal('add'); };
  const openEdit = (item) => { setForm({ ...item }); setGeo(''); setModal(item); };
  const close = () => setModal(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGeocode = async () => {
    if (!form.address) return;
    setGeo('searching');
    const r = await geocode(form.address);
    if (r) {
      setForm(f => ({ ...f, lat: r.lat, lng: r.lng }));
      setGeo('found');
      if (!form.image_url) {
        const imgUrl = await fetchPlaceImage(form.name || form.address);
        if (imgUrl) setForm(f => ({ ...f, image_url: imgUrl }));
      }
    } else setGeo('notfound');
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (modal === 'add') await api.createRestaurant(plan.id, form);
      else await api.updateRestaurant(modal.id, form);
      onRefresh(); close();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this restaurant?')) return;
    await api.deleteRestaurant(id);
    onRefresh();
  };

  const mealIcon = (m) => ({ Breakfast: '🌅', Brunch: '🥐', Lunch: '🥗', Dinner: '🍽️', Snack: '🍿', Coffee: '☕', Drinks: '🍷' }[m] || '🍴');

  return (
    <div>
      <div className="section-header">
        <h3>🍽️ Dining</h3>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add</button>
      </div>

      {restaurants.length === 0 && <p className="text-muted text-small">No dining spots added yet.</p>}

      <div className="items-list">
        {restaurants.map(item => (
          <div key={item.id} className="item-card">
            {item.image_url && (
              <img src={item.image_url} alt={item.name} onClick={() => setLightbox(item.image_url)} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: '8px 8px 0 0', display: 'block', cursor: 'zoom-in' }} onError={e => { e.target.style.display = 'none'; }} />
            )}
            <div className="item-card-header">
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.6rem' }}>{mealIcon(item.meal_type)}</span>
                <div>
                  <div className="item-card-title">{item.name}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                    {item.meal_type && <span className="item-card-badge badge-orange">{item.meal_type}</span>}
                    {item.cuisine && <span className="item-card-badge badge-gray">{item.cuisine}</span>}
                    {item.price_range && <span className="item-card-badge badge-green">{item.price_range}</span>}
                  </div>
                </div>
              </div>
              <div className="item-actions">
                <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
              </div>
            </div>
            <div className="item-card-body">
              {item.address && <div className="item-meta">📍 {item.address} {item.lat ? '✓ on map' : ''}</div>}
              {(item.visit_date || item.visit_time) && <div className="item-meta">📅 {item.visit_date || ''} {item.visit_time || ''}</div>}
              {item.reservation_link && <div className="item-meta">🔗 <a href={item.reservation_link} target="_blank" rel="noreferrer">Reservation</a></div>}
              {item.notes && <div className="item-meta">📝 {item.notes}</div>}
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={lightbox} alt="Full view" style={{ maxWidth: '92vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)} style={{ position: 'fixed', top: 18, right: 22, background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Restaurant / Dining' : 'Edit Dining'} onClose={close}
          footer={<><button className="btn btn-ghost" onClick={close}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
          <div className="form-group"><label>Name *</label><input className="form-control" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Restaurant name" /></div>
          <div className="form-row">
            <div className="form-group">
              <label>Meal Type</label>
              <select className="form-control" value={form.meal_type || 'Dinner'} onChange={e => set('meal_type', e.target.value)}>
                {MEAL_TYPES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Cuisine</label><input className="form-control" value={form.cuisine || ''} onChange={e => set('cuisine', e.target.value)} placeholder="e.g. French, Italian" /></div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <div className="flex gap-2">
              <input className="form-control" value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="Full address" style={{ flex: 1 }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleGeocode}>📍 Map</button>
            </div>
            {geo === 'found' && <p className="geocode-status geocode-ok">✓ Found on map</p>}
            {geo === 'notfound' && <p className="geocode-status geocode-fail">Not found automatically</p>}
          </div>
          <div className="form-row">
            <div className="form-group"><label>Date</label><input type="date" className="form-control" value={form.visit_date || ''} onChange={e => set('visit_date', e.target.value)} /></div>
            <div className="form-group"><label>Time</label><input type="time" className="form-control" value={form.visit_time || ''} onChange={e => set('visit_time', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price Range</label>
              <select className="form-control" value={form.price_range || ''} onChange={e => set('price_range', e.target.value)}>
                <option value="">Select...</option>
                {PRICE_RANGES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Reservation Link</label><input className="form-control" type="url" value={form.reservation_link || ''} onChange={e => set('reservation_link', e.target.value)} placeholder="https://..." /></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} /></div>
          {form.image_url && (
            <div className="form-group">
              <label>Auto-fetched Image</label>
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                <img src={form.image_url} alt="Restaurant preview" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6 }} onError={e => { e.target.style.display = 'none'; }} />
                <button type="button" onClick={() => set('image_url', '')} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: '0.8rem' }}>✕ Remove</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
