import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';
import './AuditLogs.css';

function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, entityFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity_type = entityFilter;
      const resp = await axios.get(`${API_URL}/audit`, { params });
      setLogs(resp.data);
    } catch (err) {
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const actionIcon = (action) => {
    const map = { created: '➕', updated: '✏️', deleted: '🗑️', logged_in: '🔑' };
    return map[action] || '📝';
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
    <div className="audit-page">
      <div className="audit-header">
        <h1>📋 Audit Logs</h1>
      </div>

      <div className="audit-filters">
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="filter-select">
          <option value="">All Actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
          <option value="logged_in">Logged In</option>
        </select>
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="filter-select">
          <option value="">All Entities</option>
          <option value="employee">Employee</option>
          <option value="work_log">Work Log</option>
          <option value="project">Project</option>
          <option value="user">User</option>
        </select>
        <button className="btn btn-secondary" onClick={fetchLogs}>🔄 Refresh</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>ID</th>
                  <th>IP</th>
                  <th>Changes</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No audit logs found.</td></tr>
                ) : logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr>
                      <td className="time-cell">{new Date(log.created_at).toLocaleString()}</td>
                      <td>{log.user_id || '-'}</td>
                      <td>
                        <span className={`action-badge action-${log.action}`}>
                          {actionIcon(log.action)} {log.action}
                        </span>
                      </td>
                      <td>{log.entity_type}</td>
                      <td>{log.entity_id || '-'}</td>
                      <td className="ip-cell">{log.ip_address || '-'}</td>
                      <td>
                        {(log.old_values || log.new_values) && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                          >
                            {expanded === log.id ? 'Hide' : 'Show'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr className="changes-row">
                        <td colSpan="7">
                          <div className="changes-detail">
                            {log.old_values && (
                              <div className="changes-old">
                                <strong>Before:</strong>
                                <pre>{log.old_values}</pre>
                              </div>
                            )}
                            {log.new_values && (
                              <div className="changes-new">
                                <strong>After:</strong>
                                <pre>{log.new_values}</pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;
