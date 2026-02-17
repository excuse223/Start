import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import API_URL from '../config';
import PrintableReport from './PrintableReport';

function Reports() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const printableRef = useRef();
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
    
    // Read employee parameter from URL
    const employeeParam = searchParams.get('employee');
    if (employeeParam) {
      setFilters(prev => ({ ...prev, employee: employeeParam }));
    }
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
        axios.get(`${API_URL}/employees`),
        axios.get(`${API_URL}/work-logs`)
      ]);
      setEmployees(employeesRes.data);
      setWorkLogs(logsRes.data);
    } catch (err) {
      setError(t('reports.generateError'));
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...workLogs];

    if (filters.employee) {
      filtered = filtered.filter(log => log.employee_id === parseInt(filters.employee));
    }

    if (filters.startDate) {
      filtered = filtered.filter(log => log.work_date >= filters.startDate);
    }

    if (filters.endDate) {
      filtered = filtered.filter(log => log.work_date <= filters.endDate);
    }

    if (filters.logType) {
      filtered = filtered.filter(log => {
        const logType = getLogType(log);
        return logType === filters.logType;
      });
    }

    setFilteredLogs(filtered);
    calculateStats(filtered);
  };

  const getLogType = (log) => {
    if (parseFloat(log.work_hours) > 0) return 'work';
    if (parseFloat(log.overtime_hours) > 0) return 'overtime';
    if (parseFloat(log.vacation_hours) > 0) return 'vacation';
    if (parseFloat(log.sick_leave_hours) > 0) return 'sick';
    return 'other';
  };

  const getTotalHours = (log) => {
    return (
      parseFloat(log.work_hours || 0) +
      parseFloat(log.overtime_hours || 0) +
      parseFloat(log.vacation_hours || 0) +
      parseFloat(log.sick_leave_hours || 0) +
      parseFloat(log.other_hours || 0) +
      parseFloat(log.absent_hours || 0)
    );
  };

  const calculateStats = (logs) => {
    const stats = {
      totalHours: 0,
      workHours: 0,
      overtimeHours: 0,
      vacationHours: 0,
      sickHours: 0,
      absentHours: 0,
      totalLogs: logs.length
    };

    logs.forEach(log => {
      const workHours = parseFloat(log.work_hours || 0);
      const overtimeHours = parseFloat(log.overtime_hours || 0);
      const vacationHours = parseFloat(log.vacation_hours || 0);
      const sickHours = parseFloat(log.sick_leave_hours || 0);
      const otherHours = parseFloat(log.other_hours || 0);
      const absentHours = parseFloat(log.absent_hours || 0);

      stats.workHours += workHours;
      stats.overtimeHours += overtimeHours;
      stats.vacationHours += vacationHours;
      stats.sickHours += sickHours;
      stats.absentHours += absentHours;
      stats.totalHours += workHours + overtimeHours + vacationHours + sickHours + otherHours + absentHours;
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
      alert(t('reports.noData'));
      return;
    }

    // Create CSV content
    const headers = [t('workLogs.date'), t('employees.title'), t('common.type'), t('common.hours'), t('workLogs.notes')];
    const rows = filteredLogs.map(log => {
      const employee = employees.find(e => e.id === log.employee_id);
      return [
        log.work_date,
        employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
        getLogType(log),
        getTotalHours(log).toFixed(1),
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

  const handlePrint = useReactToPrint({
    content: () => printableRef.current,
    documentTitle: `Work_Hours_Report_${new Date().toISOString().split('T')[0]}`,
  });

  const handleExportPDF = async () => {
    if (filteredLogs.length === 0) {
      alert(t('reports.noData'));
      return;
    }

    try {
      const element = printableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`work_hours_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('reports.generateError'));
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown';
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
      <h1>{t('reports.title')}</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h2>{t('common.filter')}</h2>
        <div className="report-filters">
          <div className="form-group">
            <label>{t('employees.title')}</label>
            <select
              name="employee"
              value={filters.employee}
              onChange={handleFilterChange}
            >
              <option value="">{t('common.allEmployees')}</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t('reports.startDate')}</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group">
            <label>{t('reports.endDate')}</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group">
            <label>{t('common.type')}</label>
            <select
              name="logType"
              value={filters.logType}
              onChange={handleFilterChange}
            >
              <option value="">{t('common.allTypes')}</option>
              <option value="work">{t('charts.workHours')}</option>
              <option value="overtime">{t('charts.overtime')}</option>
              <option value="vacation">{t('charts.vacation')}</option>
              <option value="sick">{t('charts.sickLeave')}</option>
            </select>
          </div>
        </div>

        <div className="report-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            {t('common.reset')}
          </button>
          <button 
            className="btn btn-success" 
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
          >
            📥 {t('reports.exportToCsv')}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleExportPDF}
            disabled={filteredLogs.length === 0}
          >
            📄 {t('reports.exportToPdf')}
          </button>
          <button 
            className="btn btn-info" 
            onClick={handlePrint}
            disabled={filteredLogs.length === 0}
          >
            🖨️ {t('reports.print')}
          </button>
        </div>
      </div>

      {reportStats && (
        <div className="card">
          <h2>{t('dashboard.statistics')}</h2>
          <div className="summary-cards">
            <div className="summary-card">
              <h3>{t('reports.totalLogs')}</h3>
              <div className="value">{reportStats.totalLogs}</div>
            </div>
            <div className="summary-card work">
              <h3>{t('charts.workHours')}</h3>
              <div className="value">{reportStats.workHours.toFixed(1)}h</div>
            </div>
            <div className="summary-card overtime">
              <h3>{t('charts.overtime')}</h3>
              <div className="value">{reportStats.overtimeHours.toFixed(1)}h</div>
            </div>
            <div className="summary-card vacation">
              <h3>{t('charts.vacation')}</h3>
              <div className="value">{reportStats.vacationHours.toFixed(1)}h</div>
            </div>
            <div className="summary-card sick">
              <h3>{t('charts.sickLeave')}</h3>
              <div className="value">{reportStats.sickHours.toFixed(1)}h</div>
            </div>
            <div className="summary-card">
              <h3>{t('workLogs.totalHours')}</h3>
              <div className="value">{reportStats.totalHours.toFixed(1)}h</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>{t('workLogs.title')} ({filteredLogs.length})</h2>
        {filteredLogs.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
            {t('workLogs.noLogs')}
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('workLogs.date')}</th>
                  <th>{t('employees.title')}</th>
                  <th>{t('common.type')}</th>
                  <th>{t('common.hours')}</th>
                  <th>{t('workLogs.notes')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.work_date).toLocaleDateString()}</td>
                    <td>{getEmployeeName(log.employee_id)}</td>
                    <td>
                      <span className={`badge badge-${getLogType(log)}`}>
                        {getLogType(log)}
                      </span>
                    </td>
                    <td>{getTotalHours(log).toFixed(1)}h</td>
                    <td>{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden printable report */}
      <div style={{ display: 'none' }}>
        <PrintableReport 
          ref={printableRef}
          reportData={{ filteredLogs, stats: reportStats }}
          employees={employees}
          filters={filters}
        />
      </div>
    </div>
  );
}

export default Reports;
