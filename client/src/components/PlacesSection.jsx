import { useState } from 'react';
import { api, geocode } from '../api';
import Modal from './Modal';
import FileUpload from './FileUpload';

const CATEGORIES = ['Museum', 'Monument', 'Park', 'Beach', 'Church', 'Castle', 'Market', 'Viewpoint', 'Theater', 'Gallery', 'Theme Park', 'Zoo', 'Other'];
const empty = { name: '', address: '', category: 'Museum', visit_date: '', visit_time: '', duration_hours: '', ticket_link: '', price: '', notes: '' };

const catIcon = (c) => ({ Museum: '🏛️', Monument: '🗽', Park: '🌳', Beach: '🏖️', Church: '⛪', Castle: '🏰', Market: '🛒', Viewpoint: '🔭', Theater: '🎭', Gallery: '🖼️', 'Theme Park': '🎡', Zoo: '🦁' }[c] || '📍');

export default function PlacesSection({ plan, places, files, onRefresh }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [geo, setGeo] = useState('');

  const openAdd = () => { setForm(empty); setGeo(''); setModal('add'); };
  const openEdit = (item) => { setForm({ ...item }); setGeo(''); setModal(item); };
  const close = () => setModal(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGeocode = async () => {
    if (!form.address) return;
    setGeo('searching');
    const r = await geocode(form.address);
    if (r) { setForm(f => ({ ...f, lat: r.lat, lng: r.lng })); setGeo('found'); }
    else setGeo('notfound');
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (modal === 'add') await api.createPlace(plan.id, form);
      else await api.updatePlace(modal.id, form);
      onRefresh(); close();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this place?')) return;
    await api.deletePlace(id);
    onRefresh();
  };

  const placeFiles = (id) => files.filter(f => f.entity_type === 'place' && f.entity_id === id);

  return (
    <div>
      <div className="section-header">
        <h3>🗺️ Places to Visit</h3>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add</button>
      </div>

      {places.length === 0 && <p className="text-muted text-small">No places added yet.</p>}

      <div className="items-list">
        {places.map(item => (
          <div key={item.id} className="item-card">
            <div className="item-card-header">
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.6rem' }}>{catIcon(item.category)}</span>
                <div>
                  <div className="item-card-title">{item.name}</div>
                  {item.category && <span className="item-card-badge badge-blue">{item.category}</span>}
                </div>
              </div>
              <div className="item-actions">
                <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
              </div>
            </div>
            <div className="item-card-body">
              {item.address && <div className="item-meta">📍 {item.address} {item.lat ? '✓ on map' : ''}</div>}
              {(item.visit_date || item.visit_time) && <div className="item-meta">📅 {item.visit_date || ''} {item.visit_time || ''}{item.duration_hours ? ` · ${item.duration_hours}h` : ''}</div>}
              {item.price && <div className="item-meta">💰 {item.price}</div>}
              {item.ticket_link && <div className="item-meta">🎫 <a href={item.ticket_link} target="_blank" rel="noreferrer">Ticket Link</a></div>}
              {item.notes && <div className="item-meta">📝 {item.notes}</div>}
            </div>
            <div className="mt-3">
              <FileUpload planId={plan.id} entityType="place" entityId={item.id} onUploaded={onRefresh} />
              {placeFiles(item.id).map(f => <FileChip key={f.id} file={f} onDelete={() => api.deleteFile(f.id).then(onRefresh)} />)}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Place to Visit' : 'Edit Place'} onClose={close}
          footer={<><button className="btn btn-ghost" onClick={close}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
          <div className="form-group"><label>Name *</label><input className="form-control" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Eiffel Tower" /></div>
          <div className="form-group">
            <label>Category</label>
            <select className="form-control" value={form.category || 'Museum'} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
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
            <div className="form-group"><label>Visit Date</label><input type="date" className="form-control" value={form.visit_date || ''} onChange={e => set('visit_date', e.target.value)} /></div>
            <div className="form-group"><label>Visit Time</label><input type="time" className="form-control" value={form.visit_time || ''} onChange={e => set('visit_time', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Duration (hours)</label><input type="number" className="form-control" value={form.duration_hours || ''} onChange={e => set('duration_hours', e.target.value)} step="0.5" min="0" /></div>
            <div className="form-group"><label>Price / Entry Fee</label><input className="form-control" value={form.price || ''} onChange={e => set('price', e.target.value)} placeholder="e.g. €15" /></div>
          </div>
          <div className="form-group"><label>Ticket / Booking Link</label><input className="form-control" type="url" value={form.ticket_link || ''} onChange={e => set('ticket_link', e.target.value)} placeholder="https://..." /></div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} /></div>
        </Modal>
      )}
    </div>
  );
}

function FileChip({ file, onDelete }) {
  const isImg = file.mime_type?.startsWith('image/');
  const isPdf = file.mime_type === 'application/pdf';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f8fafc', borderRadius: 6, marginTop: 4, border: '1px solid #e2e8f0' }}>
      <span>{isImg ? '🖼️' : isPdf ? '📄' : '📎'}</span>
      <a href={`/uploads/${file.filename}`} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.original_name}</a>
      <a href={`/uploads/${file.filename}`} download={file.original_name} className="btn btn-ghost btn-sm">⬇</a>
      <button className="btn-icon danger btn-sm" onClick={onDelete}>✕</button>
    </div>
  );
}
