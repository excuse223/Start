import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

function Reports() {
  const [employees, setEmployees] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [filters, setFilters] = useState({
    employee: '',
    startDate: '',
    endDate: '',
    logType: ''
  });
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportStats, setReportStats] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, workLogs]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [employeesRes, logsRes] = await Promise.all([
        axios.get(`${API_URL}/employees/`),
        axios.get(`${API_URL}/work-logs/`)
      ]);
      setEmployees(employeesRes.data);
      setWorkLogs(logsRes.data);
    } catch (err) {
      setError('Failed to load report data. Please try again.');
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...workLogs];

    if (filters.employee) {
      filtered = filtered.filter(log => log.employee === parseInt(filters.employee));
    }

    if (filters.startDate) {
      filtered = filtered.filter(log => log.date >= filters.startDate);
    }

    if (filters.endDate) {
      filtered = filtered.filter(log => log.date <= filters.endDate);
    }

    if (filters.logType) {
      filtered = filtered.filter(log => log.log_type === filters.logType);
    }

    setFilteredLogs(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (logs) => {
    const stats = {
      totalHours: 0,
      workHours: 0,
      overtimeHours: 0,
      vacationHours: 0,
      sickHours: 0,
      totalLogs: logs.length
    };

    logs.forEach(log => {
      const hours = parseFloat(log.hours);
      stats.totalHours += hours;
      
      switch (log.log_type) {
        case 'work':
          stats.workHours += hours;
          break;
        case 'overtime':
          stats.overtimeHours += hours;
          break;
        case 'vacation':
          stats.vacationHours += hours;
          break;
        case 'sick':
          stats.sickHours += hours;
          break;
        default:
          break;
      }
    });

    setReportStats(stats);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    setFilters({
      employee: '',
      startDate: '',
      endDate: '',
      logType: ''
    });
  };

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      alert('No data to export');
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Employee', 'Type', 'Hours', 'Notes'];
    const rows = filteredLogs.map(log => {
      const employee = employees.find(e => e.id === log.employee);
      return [
        log.date,
        employee ? employee.name : 'Unknown',
        log.log_type,
        log.hours,
        log.notes || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `work_hours_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unknown';
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
      <h1>Reports</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h2>Filters</h2>
        <div className="report-filters">
          <div className="form-group">
            <label>Employee</label>
            <select
              name="employee"
              value={filters.employee}
              onChange={handleFilterChange}
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              name="logType"
              value={filters.logType}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              <option value="work">Work</option>
              <option value="overtime">Overtime</option>
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
            </select>
          </div>
        </div>

        <div className="report-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset Filters
          </button>
          <button 
            className="btn btn-success" 
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
          >
            📥 Export to CSV
          </button>
        </div>
      </div>

      {reportStats && (
        <div className="card">
          <h2>Summary</h2>
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Logs</h3>
              <div className="value">{reportStats.totalLogs}</div>
            </div>
            <div className="summary-card work">
              <h3>Work Hours</h3>
              <div className="value">{reportStats.workHours.toFixed(1)}h</div>
            </div>
            <div className="summary-card overtime">
              <h3>Overtime</h3>
              <div className="value">{reportStats.overtimeHours.toFixed(1)}h</div>
            </div>
            <div className="summary-card vacation">
              <h3>Vacation</h3>
              <div className="value">{reportStats.vacationHours.toFixed(1)}h</div>
            </div>
            <div className="summary-card sick">
              <h3>Sick Leave</h3>
              <div className="value">{reportStats.sickHours.toFixed(1)}h</div>
            </div>
            <div className="summary-card">
              <h3>Total Hours</h3>
              <div className="value">{reportStats.totalHours.toFixed(1)}h</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Work Logs ({filteredLogs.length})</h2>
        {filteredLogs.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
            No work logs found matching the selected filters.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Hours</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.date).toLocaleDateString()}</td>
                    <td>{getEmployeeName(log.employee)}</td>
                    <td>
                      <span className={`badge badge-${log.log_type}`}>
                        {log.log_type}
                      </span>
                    </td>
                    <td>{log.hours}h</td>
                    <td>{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
