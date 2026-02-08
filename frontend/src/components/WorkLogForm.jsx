import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:8000/api';

function WorkLogForm({ employeeId, onSuccess, onCancel }) {
  const { t } = useTranslation();
  
  // Get local date in YYYY-MM-DD format
  const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    date: getLocalDate(),
    hours: '',
    log_type: 'work',
    notes: ''
  });
  const [showWarning, setShowWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check if hours exceed 12
    if (name === 'hours') {
      const hours = parseFloat(value);
      if (hours > 12) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const hours = parseFloat(formData.hours);
    if (isNaN(hours) || hours <= 0) {
      alert(t('workLogs.invalidHours'));
      return;
    }

    if (hours > 24) {
      alert(t('workLogs.hoursExceed24'));
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        employee: employeeId,
        hours: hours
      };
      await axios.post(`${API_URL}/work-logs/`, payload);
      onSuccess();
    } catch (err) {
      let errorMessage = t('workLogs.addError');
      
      if (err.response && err.response.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          errorMessage = Object.entries(errors)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        } else {
          errorMessage = errors;
        }
      }
      
      alert(errorMessage);
      console.error('Error adding work log:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{t('workLogs.addWorkLog')}</h3>
      
      {showWarning && (
        <div className="alert alert-warning">
          ⚠️ {t('workLogs.warning12Hours', { hours: formData.hours })}
        </div>
      )}

      <div className="form-group">
        <label>{t('workLogs.date')} *</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>{t('common.hours')} *</label>
        <input
          type="number"
          name="hours"
          value={formData.hours}
          onChange={handleInputChange}
          step="0.5"
          min="0.5"
          max="24"
          required
          placeholder="e.g., 8.0"
        />
        <small className="form-error">
          {formData.hours && parseFloat(formData.hours) > 12 && 
            t('workLogs.warning12Hours', { hours: formData.hours })}
        </small>
      </div>

      <div className="form-group">
        <label>{t('common.type')} *</label>
        <select
          name="log_type"
          value={formData.log_type}
          onChange={handleInputChange}
          required
        >
          <option value="work">{t('charts.workHours')}</option>
          <option value="overtime">{t('charts.overtime')}</option>
          <option value="vacation">{t('charts.vacation')}</option>
          <option value="sick">{t('charts.sickLeave')}</option>
        </select>
      </div>

      <div className="form-group">
        <label>{t('workLogs.notes')}</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder={t('workLogs.notes')}
        />
      </div>

      <div className="btn-group">
        <button 
          type="submit" 
          className="btn btn-success"
          disabled={submitting}
        >
          {submitting ? t('common.loading') : t('workLogs.addWorkLog')}
        </button>
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={onCancel}
          disabled={submitting}
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}

export default WorkLogForm;
