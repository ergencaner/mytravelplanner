import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

export default function PlanForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ title: '', description: '', destination: '', start_date: '', end_date: '' });
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.getPlan(id).then(p => {
        setForm({ title: p.title || '', description: p.description || '', destination: p.destination || '', start_date: p.start_date || '', end_date: p.end_date || '' });
        setLoading(false);
      }).catch(() => navigate('/'));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Trip title is required');
    setSaving(true); setError('');
    try {
      let plan;
      if (isEdit) {
        plan = await api.updatePlan(id, form);
      } else {
        plan = await api.createPlan(form);
      }
      if (coverFile) await api.uploadCover(plan.id, coverFile);
      navigate(`/plans/${plan.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="form-page">
      <h2>{isEdit ? '✏️ Edit Trip' : '✈️ New Trip'}</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <div className="form-group">
            <label>Trip Name <span className="required">*</span></label>
            <input className="form-control" placeholder="e.g. Paris Summer 2025" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Destination</label>
            <input className="form-control" placeholder="e.g. Paris, France" value={form.destination} onChange={e => set('destination', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" className="form-control" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" className="form-control" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Description / Notes</label>
            <textarea className="form-control" placeholder="Brief overview of the trip..." value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
          <div className="form-group">
            <label>Cover Photo</label>
            <input type="file" className="form-control" accept="image/*" onChange={e => setCoverFile(e.target.files[0])} />
            {coverFile && <p className="text-small text-muted mt-2">Selected: {coverFile.name}</p>}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(isEdit ? `/plans/${id}` : '/')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Trip'}
          </button>
        </div>
      </form>
    </div>
  );
}
