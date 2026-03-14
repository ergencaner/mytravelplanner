import { useState } from 'react';
import { api, geocode } from '../api';
import Modal from './Modal';
import FileUpload from './FileUpload';

const empty = { name: '', address: '', check_in: '', check_out: '', nights: '', booking_link: '', price: '', notes: '' };

export default function AccommodationSection({ plan, accommodations, files, onRefresh }) {
  const [modal, setModal] = useState(null); // null | 'add' | {item}
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [geo, setGeo] = useState('');

  const openAdd = () => { setForm(empty); setGeo(''); setModal('add'); };
  const openEdit = (item) => { setForm({ ...item, nights: item.nights || '' }); setGeo(''); setModal(item); };
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
      if (modal === 'add') await api.createAccommodation(plan.id, form);
      else await api.updateAccommodation(modal.id, form);
      onRefresh(); close();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this accommodation?')) return;
    await api.deleteAccommodation(id);
    onRefresh();
  };

  const accomFiles = (id) => files.filter(f => f.entity_type === 'accommodation' && f.entity_id === id);

  return (
    <div>
      <div className="section-header">
        <h3>🏨 Accommodations</h3>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add</button>
      </div>

      {accommodations.length === 0 && (
        <p className="text-muted text-small">No accommodations added yet.</p>
      )}

      <div className="items-list">
        {accommodations.map(item => (
          <div key={item.id} className="item-card">
            <div className="item-card-header">
              <div>
                <div className="item-card-title">{item.name}</div>
                {item.address && <div className="item-meta">📍 {item.address}</div>}
              </div>
              <div className="item-actions">
                <button className="btn-icon" onClick={() => openEdit(item)} title="Edit">✏️</button>
                <button className="btn-icon danger" onClick={() => handleDelete(item.id)} title="Delete">🗑️</button>
              </div>
            </div>
            <div className="item-card-body">
              {(item.check_in || item.check_out) && (
                <div className="item-meta">📅 {item.check_in || '?'} → {item.check_out || '?'}{item.nights ? ` (${item.nights} nights)` : ''}</div>
              )}
              {item.price && <div className="item-meta">💰 {item.price}</div>}
              {item.booking_link && <div className="item-meta">🔗 <a href={item.booking_link} target="_blank" rel="noreferrer">Booking Link</a></div>}
              {item.notes && <div className="item-meta">📝 {item.notes}</div>}
              {accomFiles(item.id).length > 0 && (
                <div className="item-meta">📎 {accomFiles(item.id).length} file(s) attached</div>
              )}
            </div>
            <div className="mt-3">
              <FileUpload planId={plan.id} entityType="accommodation" entityId={item.id} onUploaded={onRefresh} />
              {accomFiles(item.id).map(f => <FileChip key={f.id} file={f} onDelete={() => { api.deleteFile(f.id).then(onRefresh); }} />)}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Accommodation' : 'Edit Accommodation'} onClose={close}
          footer={<><button className="btn btn-ghost" onClick={close}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
          <FormFields form={form} set={set} geo={geo} onGeocode={handleGeocode} />
        </Modal>
      )}
    </div>
  );
}

function FormFields({ form, set, geo, onGeocode }) {
  return (
    <>
      <div className="form-group"><label>Name *</label><input className="form-control" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Hotel / Airbnb name" /></div>
      <div className="form-group">
        <label>Address</label>
        <div className="flex gap-2">
          <input className="form-control" value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="Full address" style={{ flex: 1 }} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={onGeocode} style={{ whiteSpace: 'nowrap' }}>📍 Find on Map</button>
        </div>
        {geo === 'found' && <p className="geocode-status geocode-ok">✓ Location found on map</p>}
        {geo === 'notfound' && <p className="geocode-status geocode-fail">Location not found automatically</p>}
      </div>
      <div className="form-row">
        <div className="form-group"><label>Check-in</label><input type="date" className="form-control" value={form.check_in || ''} onChange={e => set('check_in', e.target.value)} /></div>
        <div className="form-group"><label>Check-out</label><input type="date" className="form-control" value={form.check_out || ''} onChange={e => set('check_out', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Nights</label><input type="number" className="form-control" value={form.nights || ''} onChange={e => set('nights', e.target.value)} min="1" /></div>
        <div className="form-group"><label>Price</label><input className="form-control" value={form.price || ''} onChange={e => set('price', e.target.value)} placeholder="e.g. €120/night" /></div>
      </div>
      <div className="form-group"><label>Booking Link</label><input className="form-control" type="url" value={form.booking_link || ''} onChange={e => set('booking_link', e.target.value)} placeholder="https://airbnb.com/..." /></div>
      <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} /></div>
    </>
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
