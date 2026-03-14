import { useState } from 'react';
import { api } from '../api';
import Modal from './Modal';
import FileUpload from './FileUpload';

const TYPES = ['✈️ Flight', '🚂 Train', '🚌 Bus', '🚗 Car', '⛴️ Ferry', '🚇 Metro', '🚕 Taxi', '🚲 Bike', '🛳️ Cruise', '🚐 Transfer'];
const empty = { type: 'Flight', from_location: '', to_location: '', departure_date: '', departure_time: '', arrival_date: '', arrival_time: '', company: '', booking_reference: '', price: '', notes: '' };

const typeIcon = (t) => {
  const icons = { Flight: '✈️', Train: '🚂', Bus: '🚌', Car: '🚗', Ferry: '⛴️', Metro: '🚇', Taxi: '🚕', Bike: '🚲', Cruise: '🛳️', Transfer: '🚐' };
  return icons[t] || '🚀';
};

export default function TransportSection({ plan, transport, files, onRefresh }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm(empty); setModal('add'); };
  const openEdit = (item) => { setForm({ ...item }); setModal(item); };
  const close = () => setModal(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'add') await api.createTransport(plan.id, form);
      else await api.updateTransport(modal.id, form);
      onRefresh(); close();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transport entry?')) return;
    await api.deleteTransport(id);
    onRefresh();
  };

  const tFiles = (id) => files.filter(f => f.entity_type === 'transport' && f.entity_id === id);

  return (
    <div>
      <div className="section-header">
        <h3>🚀 Transport</h3>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add</button>
      </div>

      {transport.length === 0 && <p className="text-muted text-small">No transport entries added yet.</p>}

      <div className="items-list">
        {transport.map(item => (
          <div key={item.id} className="item-card">
            <div className="item-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.6rem' }}>{typeIcon(item.type)}</span>
                <div>
                  <div className="item-card-title">{item.from_location} → {item.to_location}</div>
                  <span className="item-card-badge badge-blue">{item.type}</span>
                </div>
              </div>
              <div className="item-actions">
                <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
              </div>
            </div>
            <div className="item-card-body">
              {item.departure_date && <div className="item-meta">🕐 Depart: {item.departure_date} {item.departure_time || ''}</div>}
              {item.arrival_date && <div className="item-meta">🏁 Arrive: {item.arrival_date} {item.arrival_time || ''}</div>}
              {item.company && <div className="item-meta">🏢 {item.company}</div>}
              {item.booking_reference && <div className="item-meta">🎫 Ref: {item.booking_reference}</div>}
              {item.price && <div className="item-meta">💰 {item.price}</div>}
              {item.notes && <div className="item-meta">📝 {item.notes}</div>}
            </div>
            <div className="mt-3">
              <FileUpload planId={plan.id} entityType="transport" entityId={item.id} onUploaded={onRefresh} />
              {tFiles(item.id).map(f => <FileChip key={f.id} file={f} onDelete={() => api.deleteFile(f.id).then(onRefresh)} />)}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Transport' : 'Edit Transport'} onClose={close}
          footer={<><button className="btn btn-ghost" onClick={close}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
          <div className="form-group">
            <label>Type</label>
            <select className="form-control" value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.map(t => { const name = t.split(' ').slice(1).join(' '); return <option key={name} value={name}>{t}</option>; })}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>From</label><input className="form-control" value={form.from_location || ''} onChange={e => set('from_location', e.target.value)} placeholder="City / Airport" /></div>
            <div className="form-group"><label>To</label><input className="form-control" value={form.to_location || ''} onChange={e => set('to_location', e.target.value)} placeholder="City / Airport" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Departure Date</label><input type="date" className="form-control" value={form.departure_date || ''} onChange={e => set('departure_date', e.target.value)} /></div>
            <div className="form-group"><label>Departure Time</label><input type="time" className="form-control" value={form.departure_time || ''} onChange={e => set('departure_time', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Arrival Date</label><input type="date" className="form-control" value={form.arrival_date || ''} onChange={e => set('arrival_date', e.target.value)} /></div>
            <div className="form-group"><label>Arrival Time</label><input type="time" className="form-control" value={form.arrival_time || ''} onChange={e => set('arrival_time', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Company / Carrier</label><input className="form-control" value={form.company || ''} onChange={e => set('company', e.target.value)} placeholder="e.g. Lufthansa" /></div>
            <div className="form-group"><label>Booking Reference</label><input className="form-control" value={form.booking_reference || ''} onChange={e => set('booking_reference', e.target.value)} placeholder="e.g. ABC123" /></div>
          </div>
          <div className="form-group"><label>Price</label><input className="form-control" value={form.price || ''} onChange={e => set('price', e.target.value)} placeholder="e.g. €240" /></div>
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
