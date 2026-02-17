import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Charts from './Charts';
import API_URL from '../config';

function Dashboard() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/work-logs/summary`);
      setSummary(response.data);
    } catch (err) {
      setError(t('common.error'));
      console.error('Error fetching summary:', err);
    } finally {
      setLoading(false);
    }
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
      <div className="dashboard">
        <h1>{t('dashboard.title')}</h1>
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-primary" onClick={fetchSummary}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>{t('dashboard.title')}</h1>
      
      <div className="summary-cards">
        <div className="summary-card work">
          <h3>{t('dashboard.workHours')}</h3>
          <div className="value">{summary?.total_work_hours?.toFixed(1) || 0}h</div>
        </div>
        <div className="summary-card overtime">
          <h3>{t('dashboard.overtime')}</h3>
          <div className="value">{summary?.total_overtime_hours?.toFixed(1) || 0}h</div>
        </div>
        <div className="summary-card vacation">
          <h3>{t('dashboard.vacation')}</h3>
          <div className="value">{summary?.total_vacation_hours?.toFixed(1) || 0}h</div>
        </div>
        <div className="summary-card sick">
          <h3>{t('dashboard.sickLeave')}</h3>
          <div className="value">{summary?.total_sick_leave_hours?.toFixed(1) || 0}h</div>
        </div>
      </div>

      <Charts summaryData={summary} />
    </div>
  );
}

export default Dashboard;
