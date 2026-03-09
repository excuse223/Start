import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import API_URL from '../config';
import './Settings.css';

function Settings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const TABS = useMemo(() => [
    { key: 'General', label: t('settings.tabGeneral') },
    { key: 'Work Hours', label: t('settings.tabWorkHours') },
    { key: 'Appearance', label: t('settings.tabAppearance') },
    { key: 'Security', label: t('settings.tabSecurity') },
  ], [t]);
  const [activeTab, setActiveTab] = useState('General');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`${API_URL}/settings`);
      const map = {};
      resp.data.forEach(s => { map[s.key] = s.value || ''; });
      setSettings(map);
    } catch (err) {
      setError(t('settings.failedLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.put(`${API_URL}/settings`, { settings });
      setSuccess(t('settings.savedSuccess'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || t('settings.failedSave'));
    } finally {
      setSaving(false);
    }
  };

  const set = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  if (user?.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>{t('common.accessDenied')}</h2>
        <p>{t('common.accessDeniedAdmin')}</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>⚙️ {t('settings.title')}</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? t('settings.savingSettings') : t('settings.saveSettings')}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="settings-layout">
        <div className="settings-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <div className="settings-content card">
            {activeTab === 'General' && (
              <div className="settings-section">
                <h2>{t('settings.generalTitle')}</h2>
                <div className="form-group">
                  <label>{t('settings.companyName')}</label>
                  <input
                    type="text"
                    value={settings.company_name || ''}
                    onChange={e => set('company_name', e.target.value)}
                    placeholder={t('settings.companyNamePlaceholder')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('settings.companyLogoUrl')}</label>
                  <input
                    type="url"
                    value={settings.company_logo_url || ''}
                    onChange={e => set('company_logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="form-group">
                  <label>{t('settings.currency')}</label>
                  <select value={settings.currency || 'USD'} onChange={e => set('currency', e.target.value)}>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="PLN">PLN (zł)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('settings.timezone')}</label>
                  <select value={settings.timezone || 'UTC'} onChange={e => set('timezone', e.target.value)}>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Chicago">America/Chicago</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Warsaw">Europe/Warsaw</option>
                    <option value="Europe/Berlin">Europe/Berlin</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('settings.dateFormat')}</label>
                  <select value={settings.date_format || 'DD/MM/YYYY'} onChange={e => set('date_format', e.target.value)}>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'Work Hours' && (
              <div className="settings-section">
                <h2>{t('settings.workHoursTitle')}</h2>
                <div className="form-group">
                  <label>{t('settings.defaultWorkHours')}</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={settings.default_work_hours || '8'}
                    onChange={e => set('default_work_hours', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>{t('settings.overtimeThreshold')}</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={settings.overtime_threshold || '8'}
                    onChange={e => set('overtime_threshold', e.target.value)}
                  />
                  <small>{t('settings.overtimeThresholdNote')}</small>
                </div>
              </div>
            )}

            {activeTab === 'Appearance' && (
              <div className="settings-section">
                <h2>{t('settings.appearanceTitle')}</h2>
                <p className="settings-note">{t('settings.appearanceNote1')}</p>
                <p className="settings-note" style={{ marginTop: '0.75rem' }}>
                  {t('settings.appearanceNote2')} <strong>{t('settings.tabGeneral')}</strong>.
                </p>
              </div>
            )}

            {activeTab === 'Security' && (
              <div className="settings-section">
                <h2>{t('settings.securityTitle')}</h2>
                <div className="form-group">
                  <label>{t('settings.sessionTimeout')}</label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.session_timeout_minutes || '60'}
                    onChange={e => set('session_timeout_minutes', e.target.value)}
                  />
                  <small>{t('settings.sessionTimeoutNote')}</small>
                </div>
                <div className="form-group">
                  <label>{t('settings.minPasswordLength')}</label>
                  <input
                    type="number"
                    min="8"
                    max="64"
                    value={settings.min_password_length || '12'}
                    onChange={e => set('min_password_length', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
