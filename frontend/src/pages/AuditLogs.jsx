import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import API_URL from '../config';
import './AuditLogs.css';

function AuditLogs() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      setError(t('auditLogs.failedLoad'));
    } finally {
      setLoading(false);
    }
  };

  const actionIcon = (action) => {
    const map = { created: '➕', updated: '✏️', deleted: '🗑️', logged_in: '🔑' };
    return map[action] || '📝';
  };

  const actionLabel = (action) => {
    const map = {
      created: t('auditLogs.actionCreated'),
      updated: t('auditLogs.actionUpdated'),
      deleted: t('auditLogs.actionDeleted'),
      logged_in: t('auditLogs.actionLoggedIn'),
    };
    return map[action] || action;
  };

  if (user?.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>{t('common.accessDenied')}</h2>
        <p>{t('common.accessDeniedAdmin')}</p>
      </div>
    );
  }

  return (
    <div className="audit-page">
      <div className="audit-header">
        <h1>📋 {t('auditLogs.title')}</h1>
      </div>

      <div className="audit-filters">
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="filter-select">
          <option value="">{t('auditLogs.allActions')}</option>
          <option value="created">{t('auditLogs.actionCreated')}</option>
          <option value="updated">{t('auditLogs.actionUpdated')}</option>
          <option value="deleted">{t('auditLogs.actionDeleted')}</option>
          <option value="logged_in">{t('auditLogs.actionLoggedIn')}</option>
        </select>
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="filter-select">
          <option value="">{t('auditLogs.allEntities')}</option>
          <option value="employee">{t('auditLogs.entityEmployee')}</option>
          <option value="work_log">{t('auditLogs.entityWorkLog')}</option>
          <option value="project">{t('auditLogs.entityProject')}</option>
          <option value="user">{t('auditLogs.entityUser')}</option>
        </select>
        <button className="btn btn-secondary" onClick={fetchLogs}>🔄 {t('common.refresh')}</button>
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
                  <th>{t('auditLogs.columnTime')}</th>
                  <th>{t('auditLogs.columnUser')}</th>
                  <th>{t('auditLogs.columnAction')}</th>
                  <th>{t('auditLogs.columnEntity')}</th>
                  <th>{t('auditLogs.columnId')}</th>
                  <th>{t('auditLogs.columnIp')}</th>
                  <th>{t('auditLogs.columnChanges')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>{t('auditLogs.noLogs')}</td></tr>
                ) : logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr>
                      <td className="time-cell">{new Date(log.created_at).toLocaleString()}</td>
                      <td>{log.user_id || '-'}</td>
                      <td>
                        <span className={`action-badge action-${log.action}`}>
                          {actionIcon(log.action)} {actionLabel(log.action)}
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
                            {expanded === log.id ? t('auditLogs.hide') : t('auditLogs.show')}
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
                                <strong>{t('auditLogs.before')}</strong>
                                <pre>{log.old_values}</pre>
                              </div>
                            )}
                            {log.new_values && (
                              <div className="changes-new">
                                <strong>{t('auditLogs.after')}</strong>
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
