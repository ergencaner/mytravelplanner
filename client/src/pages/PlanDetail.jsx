import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import MapView from '../components/MapView';
import AccommodationSection from '../components/AccommodationSection';
import TransportSection from '../components/TransportSection';
import PlacesSection from '../components/PlacesSection';
import RestaurantSection from '../components/RestaurantSection';
import ItinerarySection from '../components/ItinerarySection';
import SummarySection from '../components/SummarySection';
import FilesSection from '../components/FilesSection';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysBetween(start, end) {
  if (!start || !end) return null;
  return Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
}

const TABS = [
  { id: 'overview', label: '🗺️ Map', icon: '🗺️' },
  { id: 'accommodation', label: '🏨 Stay', icon: '🏨' },
  { id: 'transport', label: '🚀 Transport', icon: '🚀' },
  { id: 'places', label: '🏛️ Places', icon: '🏛️' },
  { id: 'dining', label: '🍽️ Dining', icon: '🍽️' },
  { id: 'itinerary', label: '📅 Itinerary', icon: '📅' },
  { id: 'summary', label: '📖 Summary', icon: '📖' },
  { id: 'files', label: '📎 Files', icon: '📎' },
];

export default function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [coverInput, setCoverInput] = useState(null);

  const load = useCallback(() => {
    api.getPlan(id).then(p => { setPlan(p); setLoading(false); }).catch(() => navigate('/'));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!confirm(`Delete "${plan.title}"? This cannot be undone.`)) return;
    await api.deletePlan(id);
    navigate('/');
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await api.uploadCover(id, file);
    load();
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const days = daysBetween(plan.start_date, plan.end_date);
  const tabCounts = {
    accommodation: plan.accommodations?.length,
    transport: plan.transport?.length,
    places: plan.places?.length,
    dining: plan.restaurants?.length,
    itinerary: plan.itinerary?.length,
    files: plan.files?.length,
  };

  return (
    <div>
      {/* Header */}
      <div className="plan-header">
        <div className="plan-header-cover" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('cover-input').click()}>
          {plan.cover_image
            ? <img src={`/uploads/${plan.cover_image}`} alt={plan.title} />
            : <div style={{ fontSize: '5rem' }}>✈️</div>
          }
          <div style={{ position: 'absolute', bottom: 70, right: 16, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem' }}>📷 Change Cover</div>
        </div>
        <input id="cover-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />

        <div className="plan-header-overlay">
          <div className="plan-header-title">{plan.title}</div>
          <div className="plan-header-meta">
            {plan.destination && <span>📍 {plan.destination}</span>}
            {(plan.start_date || plan.end_date) && (
              <span>📅 {formatDate(plan.start_date)}{plan.end_date ? ` – ${formatDate(plan.end_date)}` : ''}</span>
            )}
            {days && <span>🌙 {days} days</span>}
          </div>
        </div>

        <div className="plan-header-actions">
          <Link to={`/plans/${id}/edit`} className="btn btn-outline btn-sm" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}>✏️ Edit</Link>
          <button className="btn btn-sm" style={{ background: 'rgba(231,76,60,0.8)', color: 'white', border: 'none' }} onClick={handleDelete}>🗑️ Delete</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div className="tab-list">
          {TABS.map(tab => (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
              {tabCounts[tab.id] > 0 && <span className="tab-count">{tabCounts[tab.id]}</span>}
            </button>
          ))}
        </div>

        <div className="tab-panel">
          {activeTab === 'overview' && (
            <div>
              {plan.description && (
                <div style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1.5px solid var(--border)' }}>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{plan.description}</p>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>📍 Map View</h3>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#2196f3', borderRadius: '50%', display: 'inline-block' }} /> Places</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#ff9800', borderRadius: '50%', display: 'inline-block' }} /> Dining</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#9c27b0', borderRadius: '50%', display: 'inline-block' }} /> Stay</span>
                  </div>
                </div>
                <MapView
                  places={plan.places || []}
                  restaurants={plan.restaurants || []}
                  accommodations={plan.accommodations || []}
                />
              </div>
              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginTop: 16 }}>
                {[
                  { icon: '🏨', label: 'Accommodations', count: plan.accommodations?.length || 0, tab: 'accommodation' },
                  { icon: '🚀', label: 'Transport', count: plan.transport?.length || 0, tab: 'transport' },
                  { icon: '🏛️', label: 'Places', count: plan.places?.length || 0, tab: 'places' },
                  { icon: '🍽️', label: 'Dining', count: plan.restaurants?.length || 0, tab: 'dining' },
                  { icon: '📅', label: 'Activities', count: plan.itinerary?.length || 0, tab: 'itinerary' },
                  { icon: '📎', label: 'Files', count: plan.files?.length || 0, tab: 'files' },
                ].map(s => (
                  <div key={s.tab} onClick={() => setActiveTab(s.tab)} style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>{s.count}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'accommodation' && (
            <AccommodationSection plan={plan} accommodations={plan.accommodations || []} files={plan.files || []} onRefresh={load} />
          )}
          {activeTab === 'transport' && (
            <TransportSection plan={plan} transport={plan.transport || []} files={plan.files || []} onRefresh={load} />
          )}
          {activeTab === 'places' && (
            <PlacesSection plan={plan} places={plan.places || []} files={plan.files || []} onRefresh={load} />
          )}
          {activeTab === 'dining' && (
            <RestaurantSection plan={plan} restaurants={plan.restaurants || []} onRefresh={load} />
          )}
          {activeTab === 'itinerary' && (
            <ItinerarySection plan={plan} itinerary={plan.itinerary || []} onRefresh={load} />
          )}
          {activeTab === 'summary' && (
            <SummarySection plan={plan} summaryLinks={plan.summary_links || []} onRefresh={load} onUpdatePlan={load} />
          )}
          {activeTab === 'files' && (
            <FilesSection plan={plan} files={plan.files || []} onRefresh={load} />
          )}
        </div>
      </div>
    </div>
  );
}
