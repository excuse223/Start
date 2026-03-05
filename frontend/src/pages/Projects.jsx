import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';
import ProjectModal from '../components/ProjectModal';
import './Projects.css';

const STATUS_OPTIONS = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

const statusLabel = (s) => {
  const map = { planning: 'Planning', active: 'Active', on_hold: 'On Hold', completed: 'Completed', cancelled: 'Cancelled' };
  return map[s] || s;
};

function Projects() {
  const { user } = useAuth();
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
      setError('Failed to load projects.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`${API_URL}/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete project.');
    }
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
        <h1>📁 Projects</h1>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button className="btn btn-primary" onClick={() => { setEditingProject(null); setModalOpen(true); }}>
            + New Project
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="projects-filters">
        <input
          type="text"
          placeholder="🔍 Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); }} className="status-filter">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={fetchProjects}>🔄 Refresh</button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Client</th>
                  <th>Budget</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Team</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No projects found.</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong>{p.description && <div className="project-desc">{p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''}</div>}</td>
                    <td>{p.client || '-'}</td>
                    <td>{p.budget != null ? `$${p.budget.toLocaleString()}` : '-'}</td>
                    <td>{p.deadline || '-'}</td>
                    <td><span className={`status-badge status-${p.status}`}>{statusLabel(p.status)}</span></td>
                    <td>{p.employees?.length || 0} members</td>
                    <td>
                      <div className="btn-group">
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                          <button className="btn btn-secondary" onClick={() => { setEditingProject(p); setModalOpen(true); }}>Edit</button>
                        )}
                        {user?.role === 'admin' && (
                          <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
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
