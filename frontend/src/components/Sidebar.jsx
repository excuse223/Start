import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';

function Sidebar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const isAdmin = user?.role === 'admin';
  const isAdminOrManager = isAdmin || user?.role === 'manager';

  return (
    <div className="sidebar">
      <h1>Work Hours</h1>

      <div className="sidebar-search">
        <GlobalSearch />
      </div>

      <div className="language-switcher">
        <button 
          onClick={() => changeLanguage('pl')} 
          className={i18n.language === 'pl' ? 'active' : ''}
          title="Polski"
        >
          🇵🇱 PL
        </button>
        <button 
          onClick={() => changeLanguage('en')} 
          className={i18n.language === 'en' ? 'active' : ''}
          title="English"
        >
          🇬🇧 EN
        </button>
      </div>

      <nav>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          <span>📊</span>
          {t('navigation.dashboard')}
        </NavLink>
        <NavLink to="/employees" className={({ isActive }) => isActive ? 'active' : ''}>
          <span>👥</span>
          {t('navigation.employees')}
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => isActive ? 'active' : ''}>
          <span>📅</span>
          {t('navigation.calendar', 'Calendar')}
        </NavLink>
        {isAdminOrManager && (
          <NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>📁</span>
            {t('navigation.projects', 'Projects')}
          </NavLink>
        )}
        <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
          <span>📈</span>
          {t('navigation.reports')}
        </NavLink>
        {isAdmin && (
          <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>👤</span>
            {t('navigation.users')}
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/assignments" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>👔</span>
            {t('navigation.assignments')}
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/backups" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>💾</span>
            {t('navigation.backups', 'Backups')}
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/audit-logs" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>📋</span>
            {t('navigation.auditLogs', 'Audit Logs')}
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>⚙️</span>
            {t('navigation.settings', 'Settings')}
          </NavLink>
        )}
      </nav>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-actions">
            <NotificationBell />
            <ThemeToggle />
          </div>
          <span className="sidebar-username">{user.username}</span>
          <span className="sidebar-role">{user.role}</span>
          <button onClick={logout} className="sidebar-logout">
            {t('common.logout')}
          </button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
