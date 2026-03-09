import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import API_URL from '../config';
import './ProjectModal.css';

const STATUS_OPTIONS = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

function ProjectModal({ project, onSaved, onClose }) {
  const { t } = useTranslation();
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
      setError(err.response?.data?.detail || t('projectModal.failedSave'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="project-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? t('projectModal.editProject') : t('projectModal.newProject')}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-row">
            <div className="form-group">
              <label>{t('projectModal.projectName')}</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder={t('projectModal.projectNamePlaceholder')} />
            </div>
            <div className="form-group">
              <label>{t('projectModal.clientLabel')}</label>
              <input name="client" value={form.client} onChange={handleChange} placeholder={t('projectModal.clientPlaceholder')} />
            </div>
          </div>

          <div className="form-group">
            <label>{t('projectModal.descriptionLabel')}</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder={t('projectModal.descriptionPlaceholder')} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('projectModal.budgetLabel')}</label>
              <input name="budget" type="number" step="0.01" min="0" value={form.budget} onChange={handleChange} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>{t('projectModal.deadlineLabel')}</label>
              <input name="deadline" type="date" value={form.deadline} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>{t('projectModal.statusLabel')}</label>
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('projectModal.saving') : isEdit ? t('projectModal.saveChanges') : t('projectModal.createProject')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectModal;
