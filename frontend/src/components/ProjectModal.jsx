import React, { useState } from 'react';
import axios from 'axios';
import API_URL from '../config';
import './ProjectModal.css';

const STATUS_OPTIONS = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

function ProjectModal({ project, onSaved, onClose }) {
  const isEdit = Boolean(project);
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    client: project?.client || '',
    budget: project?.budget ?? '',
    deadline: project?.deadline || '',
    status: project?.status || 'planning',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        budget: form.budget !== '' ? parseFloat(form.budget) : null,
        deadline: form.deadline || null,
      };
      if (isEdit) {
        await axios.put(`${API_URL}/projects/${project.id}`, payload);
      } else {
        await axios.post(`${API_URL}/projects`, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="project-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Project' : 'New Project'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-row">
            <div className="form-group">
              <label>Project Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder="Project name" />
            </div>
            <div className="form-group">
              <label>Client</label>
              <input name="client" value={form.client} onChange={handleChange} placeholder="Client name" />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder="Project description..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Budget ($)</label>
              <input name="budget" type="number" step="0.01" min="0" value={form.budget} onChange={handleChange} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input name="deadline" type="date" value={form.deadline} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectModal;
