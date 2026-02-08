import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Charts from './Charts';

const API_URL = 'http://localhost:8000/api';

function Dashboard() {
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
      const response = await axios.get(`${API_URL}/work-logs/summary/`);
      setSummary(response.data);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
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
        <h1>Dashboard</h1>
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-primary" onClick={fetchSummary}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="summary-cards">
        <div className="summary-card work">
          <h3>Total Work Hours</h3>
          <div className="value">{summary?.total_work_hours?.toFixed(1) || 0}h</div>
        </div>
        <div className="summary-card overtime">
          <h3>Total Overtime</h3>
          <div className="value">{summary?.total_overtime_hours?.toFixed(1) || 0}h</div>
        </div>
        <div className="summary-card vacation">
          <h3>Total Vacation</h3>
          <div className="value">{summary?.total_vacation_hours?.toFixed(1) || 0}h</div>
        </div>
        <div className="summary-card sick">
          <h3>Total Sick Leave</h3>
          <div className="value">{summary?.total_sick_hours?.toFixed(1) || 0}h</div>
        </div>
      </div>

      <Charts summaryData={summary} />
    </div>
  );
}

export default Dashboard;
