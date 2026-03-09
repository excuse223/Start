import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './Login.css';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function ForcePasswordChange() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { clearForcePasswordChange, logout } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('forcePasswordChange.mismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('forcePasswordChange.tooShort'));
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/change-password`, {
        currentPassword,
        newPassword,
      });
      clearForcePasswordChange();
    } catch (err) {
      console.error('Password change error:', err);
      if (err.response?.status === 401) {
        setError(t('forcePasswordChange.wrongCurrent'));
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(t('forcePasswordChange.errorGeneral'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🔑 {t('forcePasswordChange.title')}</h1>
          <p>{t('forcePasswordChange.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="currentPassword">{t('forcePasswordChange.currentLabel')}</label>
            <input
              id="currentPassword"
              type="password"
              placeholder={t('forcePasswordChange.currentPlaceholder')}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">{t('forcePasswordChange.newLabel')}</label>
            <input
              id="newPassword"
              type="password"
              placeholder={t('forcePasswordChange.newPlaceholder')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('forcePasswordChange.confirmLabel')}</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder={t('forcePasswordChange.confirmPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            {loading ? t('forcePasswordChange.changing') : t('forcePasswordChange.changeButton')}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline',
            }}
          >
            {t('forcePasswordChange.logoutInstead')}
          </button>
        </div>
      </div>
    </div>
  );
}
