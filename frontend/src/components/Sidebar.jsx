import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

function Sidebar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="sidebar">
      <h1>Work Hours</h1>
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
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          <span>📊</span>
          {t('navigation.dashboard')}
        </NavLink>
        <NavLink 
          to="/employees" 
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          <span>👥</span>
          {t('navigation.employees')}
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink 
            to="/users" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span>👤</span>
            {t('navigation.users')}
          </NavLink>
        )}
        {user?.role === 'admin' && (
          <NavLink 
            to="/assignments" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span>👔</span>
            {t('navigation.assignments')}
          </NavLink>
        )}
        <NavLink 
          to="/reports" 
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          <span>📈</span>
          {t('navigation.reports')}
        </NavLink>
      </nav>
      {user && (
        <div className="sidebar-user">
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
