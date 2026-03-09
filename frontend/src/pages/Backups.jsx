import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';
import './Backups.css';

function formatSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function Backups() {
  const { user } = useAuth();
  const [backups, setBackups] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [restoreId, setRestoreId] = useState(null);

  useEffect(() => {
    fetchBackups();
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await axios.get(`${API_URL}/backups`);
      setBackups(resp.data);
    } catch (err) {
      setError('Failed to load backups.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const resp = await axios.get(`${API_URL}/backups/status`);
      setStatus(resp.data);
    } catch (err) {
      console.error('Failed to fetch backup status', err);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      await axios.post(`${API_URL}/backups`);
      await fetchBackups();
      await fetchStatus();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create backup.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this backup? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/backups/${id}`);
      fetchBackups();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete backup.');
    }
  };

  const handleRestore = async (id) => {
    try {
      await axios.post(`${API_URL}/backups/${id}/restore`);
      alert('Restore initiated successfully.');
      setRestoreId(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to restore backup.');
      setRestoreId(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You need admin role to view this page.</p>
      </div>
    );
  }

  return (
    <div className="backups-page">
      <div className="backups-header">
        <h1>💾 Backups</h1>
        <button className="btn btn-primary" onClick={handleCreateBackup} disabled={creating}>
          {creating ? '⏳ Creating...' : '+ Create Backup Now'}
        </button>
      </div>

      {status && (
        <div className="backup-status-cards">
          <div className="status-card">
            <div className="status-card-icon">🕐</div>
            <div>
              <div className="status-card-label">Last Backup</div>
              <div className="status-card-value">
                {status.last_backup ? new Date(status.last_backup).toLocaleString() : 'Never'}
              </div>
            </div>
          </div>
          <div className="status-card">
            <div className="status-card-icon">📅</div>
            <div>
              <div className="status-card-label">Next Scheduled</div>
              <div className="status-card-value">{status.next_scheduled}</div>
            </div>
          </div>
          <div className="status-card">
            <div className="status-card-icon">📦</div>
            <div>
              <div className="status-card-label">Total Backups</div>
              <div className="status-card-value">{status.total_backups}</div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Filename</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No backups found. Create one now!</td></tr>
                ) : backups.map(b => (
                  <tr key={b.id}>
                    <td>{new Date(b.created_at).toLocaleString()}</td>
                    <td className="filename-cell">{b.filename}</td>
                    <td>{formatSize(b.file_size)}</td>
                    <td><span className="type-badge">{b.backup_type}</span></td>
                    <td><span className="location-badge">{b.storage_location}</span></td>
                    <td>
                      <span className={`backup-status backup-status-${b.status}`}>
                        {b.status === 'completed' ? '✅' : b.status === 'failed' ? '❌' : '⏳'} {b.status}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        {b.status === 'completed' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => setRestoreId(b.id)}>
                            Restore
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restore confirmation modal */}
      {restoreId && (
        <div className="modal-overlay" onClick={() => setRestoreId(null)}>
          <div className="restore-modal" onClick={e => e.stopPropagation()}>
            <h2>⚠️ Confirm Restore</h2>
            <p>This will restore the database from the selected backup. This action may overwrite current data.</p>
            <p><strong>Are you sure you want to proceed?</strong></p>
            <div className="btn-group">
              <button className="btn btn-secondary" onClick={() => setRestoreId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleRestore(restoreId)}>Yes, Restore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Backups;
