import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import API_URL from '../config';

function EmployeeList() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    hourly_rate: '',
    overtime_rate: ''
  });

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/employees`);
      setEmployees(response.data);
    } catch (err) {
      setError(t('employees.loadError'));
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Filter out empty strings for optional numeric fields
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        ...(formData.email && { email: formData.email })
      };
      
      // Add hourly_rate if valid
      if (formData.hourly_rate) {
        const hourlyRate = parseFloat(formData.hourly_rate);
        if (!isNaN(hourlyRate)) {
          payload.hourly_rate = hourlyRate;
        }
      }
      
      // Add overtime_rate if valid
      if (formData.overtime_rate) {
        const overtimeRate = parseFloat(formData.overtime_rate);
        if (!isNaN(overtimeRate)) {
          payload.overtime_rate = overtimeRate;
        }
      }
      
      await axios.post(`${API_URL}/employees`, payload);
      setShowAddForm(false);
      setFormData({ first_name: '', last_name: '', email: '', hourly_rate: '', overtime_rate: '' });
      fetchEmployees();
    } catch (err) {
      alert(t('employees.addError'));
      console.error('Error adding employee:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('employees.deleteConfirm'))) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/employees/${id}`);
      fetchEmployees();
    } catch (err) {
      alert(t('employees.deleteError'));
      console.error('Error deleting employee:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="employee-header">
        <h1>{t('employees.title')}</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? t('common.cancel') : '+ ' + t('employees.addEmployee')}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showAddForm && (
        <div className="card">
          <h2>{t('employees.addEmployee')}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('employees.firstName')} *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                placeholder={t('employees.firstName')}
              />
            </div>
            <div className="form-group">
              <label>{t('employees.lastName')} *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                placeholder={t('employees.lastName')}
              />
            </div>
            <div className="form-group">
              <label>{t('employees.emailOptional')}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('employees.emailOptional')}
              />
            </div>
            <div className="form-group">
              <label>{t('employees.hourlyRateOptional')}</label>
              <input
                type="number"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder={t('employees.hourlyRateOptional')}
              />
            </div>
            <div className="form-group">
              <label>{t('employees.overtimeRateOptional')}</label>
              <input
                type="number"
                name="overtime_rate"
                value={formData.overtime_rate}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder={t('employees.overtimeRateOptional')}
              />
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-success">
                {t('employees.addEmployee')}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowAddForm(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('employees.firstName')}</th>
                <th>{t('employees.lastName')}</th>
                <th>{t('employees.email')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                    {t('employees.noEmployees')}
                  </td>
                </tr>
              ) : (
                employees.map(employee => (
                  <tr key={employee.id}>
                    <td>{employee.first_name}</td>
                    <td>{employee.last_name}</td>
                    <td>{employee.email || '-'}</td>
                    <td>
                      <div className="btn-group">
                        <Link 
                          to={`/employees/${employee.id}`} 
                          className="btn btn-primary"
                          title={t('common.view')}
                        >
                          {t('employees.view')}
                        </Link>
                        <Link
                          to={`/reports?employee=${employee.id}`}
                          className="btn btn-info"
                          title={t('common.viewReports')}
                        >
                          📊
                        </Link>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDelete(employee.id)}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default EmployeeList;
