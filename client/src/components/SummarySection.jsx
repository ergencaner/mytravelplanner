import { useState } from 'react';
import { api } from '../api';
import Modal from './Modal';

const CATS = ['General', 'Accommodation', 'Transport', 'Attractions', 'Dining', 'Tips', 'Weather', 'Budget'];
const catIcon = (c) => ({ General: '🌐', Accommodation: '🏨', Transport: '✈️', Attractions: '🏛️', Dining: '🍽️', Tips: '💡', Weather: '☀️', Budget: '💰' }[c] || '🔗');

export default function SummarySection({ plan, summaryLinks, onRefresh, onUpdatePlan }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: '', url: '', category: 'General', notes: '' });
  const [saving, setSaving] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [desc, setDesc] = useState(plan.description || '');
  const [savingDesc, setSavingDesc] = useState(false);

  const openAdd = () => { setForm({ title: '', url: '', category: 'General', notes: '' }); setModal('add'); };
  const openEdit = (item) => { setForm({ ...item }); setModal(item); };
  const close = () => setModal(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.url) return;
    setSaving(true);
    try {
      if (modal === 'add') await api.createSummaryLink(plan.id, form);
      else await api.updateSummaryLink(modal.id, form);
      onRefresh(); close();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this link?')) return;
    await api.deleteSummaryLink(id);
    onRefresh();
  };

  const handleSaveDesc = async () => {
    setSavingDesc(true);
    await api.updatePlan(plan.id, { ...plan, description: desc });
    onUpdatePlan();
    setSavingDesc(false);
    setEditingDesc(false);
  };

  const grouped = CATS.reduce((acc, cat) => {
    const links = summaryLinks.filter(l => l.category === cat);
    if (links.length) acc[cat] = links;
    return acc;
  }, {});
  const ungrouped = summaryLinks.filter(l => !CATS.includes(l.category));

  return (
    <div>
      {/* Trip Summary */}
      <div className="section-header">
        <h3>📖 Trip Summary</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => { setDesc(plan.description || ''); setEditingDesc(true); }}>✏️ Edit</button>
      </div>
      <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 24 }}>
        {editingDesc ? (
          <>
            <textarea className="form-control" value={desc} onChange={e => setDesc(e.target.value)} rows={8} placeholder="Write a summary of this trip — highlights, tips, overall experience..." />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingDesc(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveDesc} disabled={savingDesc}>{savingDesc ? 'Saving...' : 'Save'}</button>
            </div>
          </>
        ) : (
          <p className="summary-text" style={{ color: plan.description ? 'var(--text)' : 'var(--text-muted)' }}>
            {plan.description || 'No summary yet. Click Edit to add one.'}
          </p>
        )}
      </div>

      {/* Source Links */}
      <div className="section-header">
        <h3>🔗 Research & Source Links</h3>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Link</button>
      </div>

      {summaryLinks.length === 0 && <p className="text-muted text-small">No links added yet. Add useful references and sources.</p>}

      {Object.entries(grouped).map(([cat, links]) => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>{catIcon(cat)} {cat}</div>
          {links.map(link => <LinkCard key={link.id} link={link} onEdit={() => openEdit(link)} onDelete={() => handleDelete(link.id)} />)}
        </div>
      ))}
      {ungrouped.map(link => <LinkCard key={link.id} link={link} onEdit={() => openEdit(link)} onDelete={() => handleDelete(link.id)} />)}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Link' : 'Edit Link'} onClose={close}
          footer={<><button className="btn btn-ghost" onClick={close}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
          <div className="form-group"><label>URL *</label><input className="form-control" type="url" value={form.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://..." /></div>
          <div className="form-group"><label>Title</label><input className="form-control" value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="Link title / description" /></div>
          <div className="form-group">
            <label>Category</label>
            <select className="form-control" value={form.category || 'General'} onChange={e => set('category', e.target.value)}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} /></div>
        </Modal>
      )}
    </div>
  );
}

function LinkCard({ link, onEdit, onDelete }) {
  return (
    <div className="link-card">
      <span className="link-card-icon">{({ General: '🌐', Accommodation: '🏨', Transport: '✈️', Attractions: '🏛️', Dining: '🍽️', Tips: '💡', Weather: '☀️', Budget: '💰' }[link.category] || '🔗')}</span>
      <div className="link-card-content">
        <div className="link-card-title">{link.title || link.url}</div>
        <a className="link-card-url" href={link.url} target="_blank" rel="noreferrer">{link.url}</a>
        {link.notes && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{link.notes}</div>}
      </div>
      <div className="link-card-actions">
        <button className="btn-icon" onClick={onEdit}>✏️</button>
        <button className="btn-icon danger" onClick={onDelete}>🗑️</button>
      </div>
    </div>
  );
}
