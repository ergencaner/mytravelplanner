import { useState, useMemo } from 'react';
import { api, geocode } from '../api';
import Modal from './Modal';

const ACTIVITY_TYPES = ['visit', 'eat', 'transport', 'hotel', 'leisure', 'custom'];
const typeColors = { visit: 'badge-blue', eat: 'badge-orange', transport: 'badge-green', hotel: 'badge-purple', leisure: 'badge-gray', custom: 'badge-gray' };
const typeIcons = { visit: '🏛️', eat: '🍽️', transport: '🚀', hotel: '🏨', leisure: '🎯', custom: '📌' };
const typeCanvasColors = { visit: '#1a6fbb', eat: '#e8703a', transport: '#27ae60', hotel: '#7c3aed', leisure: '#6b7a8d', custom: '#6b7a8d' };

const empty = { date: '', start_time: '', end_time: '', title: '', description: '', activity_type: 'custom', location: '' };

function formatDay(dateStr) {
  if (!dateStr) return dateStr;
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function roundRect(ctx, x, y, w, h, r) {
  const radii = typeof r === 'number' ? [r, r, r, r] : r;
  const [tl, tr, br, bl] = radii;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}

function exportDayPlan(date, activities, planTitle) {
  const W = 820;
  const PAD = 36;
  const HEADER_H = 120;
  const ITEM_H = 92;
  const FOOTER_H = 44;
  const H = HEADER_H + PAD + activities.length * ITEM_H + (activities.length === 0 ? 70 : 0) + PAD + FOOTER_H;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#f0f4f8';
  ctx.fillRect(0, 0, W, H);

  // Header gradient
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#1a6fbb');
  grad.addColorStop(1, '#145a9a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, HEADER_H);

  // Decorative circles in header
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath(); ctx.arc(W - 60, -20, 100, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W - 20, HEADER_H + 10, 70, 0, Math.PI * 2); ctx.fill();

  // Trip name (small, above date)
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(truncate(planTitle, 60).toUpperCase(), PAD, 36);

  // Day label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(formatDay(date), PAD, 72);

  // Activity count
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '14px sans-serif';
  ctx.fillText(`${activities.length} activit${activities.length === 1 ? 'y' : 'ies'}`, PAD, 100);

  if (activities.length === 0) {
    ctx.fillStyle = '#6b7a8d';
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No activities planned for this day.', W / 2, HEADER_H + PAD + 35);
    ctx.textAlign = 'left';
  }

  // Activity cards
  activities.forEach((item, i) => {
    const cardX = PAD;
    const cardY = HEADER_H + PAD + i * ITEM_H;
    const cardW = W - PAD * 2;
    const cardH = ITEM_H - 10;
    const color = typeCanvasColors[item.activity_type] || '#6b7a8d';

    // Card shadow (approximated)
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    roundRect(ctx, cardX + 2, cardY + 3, cardW, cardH, 10);
    ctx.fill();

    // Card background
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cardX, cardY, cardW, cardH, 10);
    ctx.fill();

    // Left color accent bar
    ctx.fillStyle = color;
    roundRect(ctx, cardX, cardY, 6, cardH, [10, 0, 0, 10]);
    ctx.fill();

    const textX = cardX + 20;

    // Time
    ctx.fillStyle = color;
    ctx.font = 'bold 12px sans-serif';
    const timeStr = (item.start_time || '--:--') + (item.end_time ? ` – ${item.end_time}` : '');
    ctx.fillText(timeStr, textX, cardY + 22);

    // Title
    ctx.fillStyle = '#1a2332';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const icon = { visit: '▶', eat: '▶', transport: '▶', hotel: '▶', leisure: '▶', custom: '▶' }[item.activity_type] || '▶';
    ctx.fillText(truncate(item.title, 58), textX, cardY + 46);

    // Location or description
    const detail = item.location ? `  ${item.location}` : item.description;
    if (detail) {
      ctx.fillStyle = '#6b7a8d';
      ctx.font = '13px sans-serif';
      ctx.fillText(truncate(detail, 72), textX, cardY + 67);
    }

    // Activity type badge (right side)
    const badgeX = cardX + cardW - 90;
    const badgeY = cardY + 14;
    ctx.fillStyle = color + '22';
    roundRect(ctx, badgeX, badgeY, 80, 22, 6);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.activity_type.toUpperCase(), badgeX + 40, badgeY + 15);
    ctx.textAlign = 'left';
  });

  // Footer
  const footerY = H - FOOTER_H;
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, footerY, W, FOOTER_H);
  ctx.fillStyle = '#6b7a8d';
  ctx.font = '12px sans-serif';
  ctx.fillText('My Travel Planner', PAD, footerY + 28);
  ctx.textAlign = 'right';
  ctx.fillText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), W - PAD, footerY + 28);
  ctx.textAlign = 'left';

  // Download
  const link = document.createElement('a');
  link.download = `day-plan-${date}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" title="Download daily plan as image"
                onClick={() => exportDayPlan(date, grouped[date] || [], plan.title)}>
                📥 Export
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => openAdd(date)}>+ Activity</button>
            </div>
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
