import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span>✈️</span>
        <h1>My Travel Planner</h1>
      </Link>
      <div className="navbar-actions">
        <button className="btn btn-accent" onClick={() => navigate('/plans/new')}>
          + New Trip
        </button>
      </div>
    </nav>
  );
}
