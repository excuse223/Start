import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>⏰ Work Hours Tracker</h2>
      </div>

      <div className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          📊 Dashboard
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
          📈 Reports
        </NavLink>
        {isAdmin && (
          <NavLink to="/employees" className={({ isActive }) => isActive ? 'active' : ''}>
            👥 Employees
          </NavLink>
        )}
      </div>

      <div className="navbar-user">
        <span className="user-info">
          <span className="user-role">{user?.role}</span>
          <span className="user-name">{user?.username}</span>
        </span>
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </div>
    </nav>
  );
}
