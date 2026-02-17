import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import API_URL from '../config';

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
    work_hours: '',
    overtime_hours: '',
    vacation_hours: '',
    sick_leave_hours: '',
    other_hours: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation - at least one hour type must be filled
    const work = parseFloat(formData.work_hours) || 0;
    const overtime = parseFloat(formData.overtime_hours) || 0;
    const vacation = parseFloat(formData.vacation_hours) || 0;
    const sick = parseFloat(formData.sick_leave_hours) || 0;
    const other = parseFloat(formData.other_hours) || 0;

    const totalHours = work + overtime + vacation + sick + other;

    if (totalHours <= 0) {
      alert(t('workLogs.invalidHours'));
      return;
    }

    if (totalHours > 24) {
      alert(t('workLogs.hoursExceed24'));
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        employee_id: employeeId,
        work_date: formData.date,
        work_hours: work,
        overtime_hours: overtime,
        vacation_hours: vacation,
        sick_leave_hours: sick,
        other_hours: other,
        notes: formData.notes || ''
      };
      
      await axios.post(`${API_URL}/work-logs`, payload);
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
        <label>{t('charts.workHours')}</label>
        <input
          type="number"
          name="work_hours"
          value={formData.work_hours}
          onChange={handleInputChange}
          step="0.5"
          min="0"
          max="24"
          placeholder="0"
        />
      </div>

      <div className="form-group">
        <label>{t('charts.overtime')}</label>
        <input
          type="number"
          name="overtime_hours"
          value={formData.overtime_hours}
          onChange={handleInputChange}
          step="0.5"
          min="0"
          max="24"
          placeholder="0"
        />
      </div>

      <div className="form-group">
        <label>{t('charts.vacation')}</label>
        <input
          type="number"
          name="vacation_hours"
          value={formData.vacation_hours}
          onChange={handleInputChange}
          step="0.5"
          min="0"
          max="24"
          placeholder="0"
        />
      </div>

      <div className="form-group">
        <label>{t('charts.sickLeave')}</label>
        <input
          type="number"
          name="sick_leave_hours"
          value={formData.sick_leave_hours}
          onChange={handleInputChange}
          step="0.5"
          min="0"
          max="24"
          placeholder="0"
        />
      </div>

      <div className="form-group">
        <label>{t('charts.other')}</label>
        <input
          type="number"
          name="other_hours"
          value={formData.other_hours}
          onChange={handleInputChange}
          step="0.5"
          min="0"
          max="24"
          placeholder="0"
        />
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
