import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import API_URL from '../config';
import ProjectModal from '../components/ProjectModal';
import './Projects.css';

const STATUS_OPTIONS = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

function Projects() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = statusFilter ? { status_filter: statusFilter } : {};
      const resp = await axios.get(`${API_URL}/projects`, { params });
      setProjects(resp.data);
    } catch (err) {
      setError(t('projects.failedLoad'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('projects.deleteConfirm'))) return;
    try {
      await axios.delete(`${API_URL}/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.detail || t('projects.failedDelete'));
    }
  };

  const statusLabel = (s) => {
    const map = {
      planning: t('projects.statusPlanning'),
      active: t('projects.statusActive'),
      on_hold: t('projects.statusOnHold'),
      completed: t('projects.statusCompleted'),
      cancelled: t('projects.statusCancelled'),
    };
    return map[s] || s;
  };

  const filtered = projects.filter(p => {
    const matchStatus = !statusFilter || p.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(q) || (p.client || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1>📁 {t('projects.title')}</h1>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button className="btn btn-primary" onClick={() => { setEditingProject(null); setModalOpen(true); }}>
            {t('projects.newProject')}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="projects-filters">
        <input
          type="text"
          placeholder={t('projects.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); }} className="status-filter">
          <option value="">{t('projects.allStatuses')}</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={fetchProjects}>{t('projects.refresh')}</button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('projects.columnName')}</th>
                  <th>{t('projects.columnClient')}</th>
                  <th>{t('projects.columnBudget')}</th>
                  <th>{t('projects.columnDeadline')}</th>
                  <th>{t('projects.columnStatus')}</th>
                  <th>{t('projects.columnTeam')}</th>
                  <th>{t('projects.columnActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>{t('projects.noProjects')}</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong>{p.description && <div className="project-desc">{p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''}</div>}</td>
                    <td>{p.client || '-'}</td>
                    <td>{p.budget != null ? `$${p.budget.toLocaleString()}` : '-'}</td>
                    <td>{p.deadline || '-'}</td>
                    <td><span className={`status-badge status-${p.status}`}>{statusLabel(p.status)}</span></td>
                    <td>{t('projects.members', { count: p.employees?.length || 0 })}</td>
                    <td>
                      <div className="btn-group">
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                          <button className="btn btn-secondary" onClick={() => { setEditingProject(p); setModalOpen(true); }}>{t('common.edit')}</button>
                        )}
                        {user?.role === 'admin' && (
                          <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>{t('common.delete')}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <ProjectModal
          project={editingProject}
          onSaved={() => { setModalOpen(false); setEditingProject(null); fetchProjects(); }}
          onClose={() => { setModalOpen(false); setEditingProject(null); }}
        />
      )}
    </div>
  );
}

export default Projects;
