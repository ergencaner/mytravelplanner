import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysBetween(start, end) {
  if (!start || !end) return null;
  const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
  return Math.round(diff) + 1;
}

const COVERS = ['🗼','🏝️','🗻','🌇','🏰','🎡','🌊','🏜️','🌅','🌃'];

export default function Home() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getPlans().then(setPlans).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="plans-header">
        <h2>My Trips {plans.length > 0 && <span style={{ color: '#6b7a8d', fontWeight: 400, fontSize: '1rem' }}>({plans.length})</span>}</h2>
        <Link to="/plans/new" className="btn btn-primary">+ New Trip</Link>
      </div>

      {plans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✈️</div>
          <h3>No trips yet</h3>
          <p>Start planning your next adventure!</p>
          <Link to="/plans/new" className="btn btn-primary">Create your first trip</Link>
        </div>
      ) : (
        <div className="plans-grid">
          {plans.map((plan, i) => (
            <Link key={plan.id} to={`/plans/${plan.id}`} className="plan-card card">
              <div className="plan-card-cover">
                {plan.cover_image
                  ? <img src={`/uploads/${plan.cover_image}`} alt={plan.title} />
                  : <div className="plan-card-cover-placeholder">{COVERS[i % COVERS.length]}</div>
                }
              </div>
              <div className="plan-card-body">
                <div className="plan-card-title">{plan.title}</div>
                {plan.destination && (
                  <div className="plan-card-destination">📍 {plan.destination}</div>
                )}
                {(plan.start_date || plan.end_date) && (
                  <div className="plan-card-dates">
                    {formatDate(plan.start_date)}{plan.end_date ? ` → ${formatDate(plan.end_date)}` : ''}
                  </div>
                )}
                <div className="plan-card-stats">
                  {daysBetween(plan.start_date, plan.end_date) && (
                    <span className="plan-card-stat">📅 {daysBetween(plan.start_date, plan.end_date)} days</span>
                  )}
                  <span className="plan-card-stat">🕐 {formatDate(plan.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
