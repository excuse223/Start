import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';
import './Settings.css';

const TABS = ['General', 'Work Hours', 'Appearance', 'Security'];

function Settings() {
  const { user } = useAuth();
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
      setError('Failed to load settings.');
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
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const set = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  if (user?.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You need admin role to view this page.</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="settings-layout">
        <div className="settings-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`tab-btn${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <div className="settings-content card">
            {activeTab === 'General' && (
              <div className="settings-section">
                <h2>General Settings</h2>
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={settings.company_name || ''}
                    onChange={e => set('company_name', e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="form-group">
                  <label>Company Logo URL</label>
                  <input
                    type="url"
                    value={settings.company_logo_url || ''}
                    onChange={e => set('company_logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select value={settings.currency || 'USD'} onChange={e => set('currency', e.target.value)}>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="PLN">PLN (zł)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Timezone</label>
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
                  <label>Date Format</label>
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
                <h2>Work Hours Configuration</h2>
                <div className="form-group">
                  <label>Default Work Hours per Day</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={settings.default_work_hours || '8'}
                    onChange={e => set('default_work_hours', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Overtime Threshold (hours/day)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={settings.overtime_threshold || '8'}
                    onChange={e => set('overtime_threshold', e.target.value)}
                  />
                  <small>Hours worked beyond this value count as overtime.</small>
                </div>
              </div>
            )}

            {activeTab === 'Appearance' && (
              <div className="settings-section">
                <h2>Appearance</h2>
                <p className="settings-note">💡 Use the 🌙/☀️ button in the sidebar to toggle dark/light mode.</p>
                <p className="settings-note" style={{ marginTop: '0.75rem' }}>
                  Date format and currency can be configured in the <strong>General</strong> tab.
                </p>
              </div>
            )}

            {activeTab === 'Security' && (
              <div className="settings-section">
                <h2>Security Settings</h2>
                <div className="form-group">
                  <label>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.session_timeout_minutes || '60'}
                    onChange={e => set('session_timeout_minutes', e.target.value)}
                  />
                  <small>Users will be logged out after this many minutes of inactivity.</small>
                </div>
                <div className="form-group">
                  <label>Minimum Password Length</label>
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
