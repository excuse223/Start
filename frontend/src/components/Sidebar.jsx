import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="sidebar">
      <h1>Work Hours</h1>
      <nav>
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          <span>📊</span>
          Dashboard
        </NavLink>
        <NavLink 
          to="/employees" 
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          <span>👥</span>
          Employees
        </NavLink>
        <NavLink 
          to="/reports" 
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          <span>📈</span>
          Reports
        </NavLink>
      </nav>
    </div>
  );
}

export default Sidebar;
