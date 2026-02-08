import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import WorkLogForm from './WorkLogForm';

const API_URL = 'http://localhost:8000/api';

function EmployeeDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddLog, setShowAddLog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [employeeRes, logsRes] = await Promise.all([
        axios.get(`${API_URL}/employees/${id}/`),
        axios.get(`${API_URL}/work-logs/?employee=${id}`)
      ]);
      setEmployee(employeeRes.data);
      setWorkLogs(logsRes.data);
      setEditData(employeeRes.data);
    } catch (err) {
      setError(t('employees.loadError'));
      console.error('Error fetching employee data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/employees/${id}/`, editData);
      setEmployee(editData);
      setEditMode(false);
    } catch (err) {
      alert(t('employees.updateError'));
      console.error('Error updating employee:', err);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm(t('workLogs.deleteConfirm'))) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/work-logs/${logId}/`);
      fetchEmployeeData();
    } catch (err) {
      alert(t('workLogs.deleteError'));
      console.error('Error deleting work log:', err);
    }
  };

  const getLogTypeColor = (type) => {
    const colors = {
      work: '#27ae60',
      overtime: '#3498db',
      vacation: '#f39c12',
      sick: '#e74c3c'
    };
    return colors[type] || '#95a5a6';
  };

  const calculateTotalHours = () => {
    return workLogs.reduce((sum, log) => sum + parseFloat(log.hours), 0).toFixed(1);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/employees')}>
          {t('employees.backToList')}
        </button>
      </div>
    );
  }

  if (!employee) {
    return <div className="alert alert-error">{t('employees.loadError')}</div>;
  }

  return (
    <div>
      <div className="employee-header">
        <h1>{employee.first_name} {employee.last_name}</h1>
        <div className="btn-group">
          <button 
            className="btn btn-primary" 
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? t('employees.cancelEdit') : t('employees.editEmployee')}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/employees')}
          >
            {t('employees.backToList')}
          </button>
        </div>
      </div>

      <div className="card">
        {editMode ? (
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label>{t('employees.firstName')} *</label>
              <input
                type="text"
                value={editData.first_name || ''}
                onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                required
                placeholder={t('employees.firstName')}
              />
            </div>
            <div className="form-group">
              <label>{t('employees.lastName')} *</label>
              <input
                type="text"
                value={editData.last_name || ''}
                onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                required
                placeholder={t('employees.lastName')}
              />
            </div>
            <div className="form-group">
              <label>{t('employees.emailOptional')}</label>
              <input
                type="email"
                value={editData.email || ''}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                placeholder={t('employees.emailOptional')}
              />
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-success">
                {t('employees.saveChanges')}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setEditMode(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <div className="employee-info">
            <div className="info-item">
              <label>{t('employees.firstName')}</label>
              <div className="value">{employee.first_name}</div>
            </div>
            <div className="info-item">
              <label>{t('employees.lastName')}</label>
              <div className="value">{employee.last_name}</div>
            </div>
            <div className="info-item">
              <label>{t('employees.email')}</label>
              <div className="value">{employee.email || t('employees.notProvided')}</div>
            </div>
            <div className="info-item">
              <label>{t('employees.totalHoursLogged')}</label>
              <div className="value">{calculateTotalHours()}h</div>
            </div>
          </div>
        )}
      </div>

      <div className="work-logs">
        <div className="employee-header">
          <h2>{t('workLogs.title')}</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddLog(!showAddLog)}
          >
            {showAddLog ? t('common.cancel') : '+ ' + t('workLogs.addWorkLog')}
          </button>
        </div>

        {showAddLog && (
          <div className="card">
            <WorkLogForm 
              employeeId={id}
              onSuccess={() => {
                setShowAddLog(false);
                fetchEmployeeData();
              }}
              onCancel={() => setShowAddLog(false)}
            />
          </div>
        )}

        <div className="card">
          {workLogs.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
              {t('workLogs.noLogs')}
            </p>
          ) : (
            workLogs.map(log => (
              <div 
                key={log.id} 
                className={`work-log-item ${log.log_type}`}
                style={{ borderLeftColor: getLogTypeColor(log.log_type) }}
              >
                <div className="work-log-header">
                  <div>
                    <strong>{new Date(log.date).toLocaleDateString()}</strong>
                    <span className={`badge badge-${log.log_type}`} style={{ marginLeft: '1rem' }}>
                      {log.log_type}
                    </span>
                  </div>
                  <div>
                    <strong>{log.hours}h</strong>
                    <button 
                      className="btn btn-danger" 
                      style={{ marginLeft: '1rem' }}
                      onClick={() => handleDeleteLog(log.id)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
                {log.notes && (
                  <div style={{ marginTop: '0.5rem', color: '#7f8c8d' }}>
                    {log.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetails;
