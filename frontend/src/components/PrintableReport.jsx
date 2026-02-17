import React from 'react';
import { useTranslation } from 'react-i18next';

const PrintableReport = React.forwardRef(({ 
  reportData, 
  employees, 
  filters 
}, ref) => {
  const { t } = useTranslation();

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown';
  };

  const getLogType = (log) => {
    if (parseFloat(log.work_hours) > 0) return t('charts.workHours');
    if (parseFloat(log.overtime_hours) > 0) return t('charts.overtime');
    if (parseFloat(log.vacation_hours) > 0) return t('charts.vacation');
    if (parseFloat(log.sick_leave_hours) > 0) return t('charts.sickLeave');
    if (parseFloat(log.absent_hours) > 0) return t('workLogs.absentHours');
    return t('charts.other');
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

  const calculateCosts = () => {
    let totalCost = 0;
    let workCost = 0;
    let overtimeCost = 0;

    reportData.filteredLogs.forEach(log => {
      const employee = employees.find(e => e.id === log.employee_id);
      if (employee && employee.hourly_rate) {
        const hourlyRate = parseFloat(employee.hourly_rate);
        const overtimeRate = parseFloat(employee.overtime_rate || hourlyRate * 1.5);
        
        // Calculate paid hours (excluding absent_hours which are unpaid)
        const paidWorkHours = parseFloat(log.work_hours || 0);
        const paidOvertimeHours = parseFloat(log.overtime_hours || 0);
        
        const logWorkCost = paidWorkHours * hourlyRate;
        const logOvertimeCost = paidOvertimeHours * overtimeRate;
        
        workCost += logWorkCost;
        overtimeCost += logOvertimeCost;
        totalCost += logWorkCost + logOvertimeCost;
      }
    });

    return { totalCost, workCost, overtimeCost };
  };

  const costs = calculateCosts();
  const hasAnyCosts = costs.totalCost > 0;

  return (
    <div ref={ref} className="printable-report">
      <div className="report-header">
        <h1>{t('reports.title')}</h1>
        <div className="report-date">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="report-filters-summary">
        {filters.employee && (
          <div className="filter-item">
            <strong>{t('employees.title')}:</strong> {getEmployeeName(parseInt(filters.employee))}
          </div>
        )}
        {filters.startDate && (
          <div className="filter-item">
            <strong>{t('reports.startDate')}:</strong> {new Date(filters.startDate).toLocaleDateString()}
          </div>
        )}
        {filters.endDate && (
          <div className="filter-item">
            <strong>{t('reports.endDate')}:</strong> {new Date(filters.endDate).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="report-stats">
        <h2>{t('dashboard.statistics')}</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">{t('reports.totalLogs')}</div>
            <div className="stat-value">{reportData.stats.totalLogs}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">{t('charts.workHours')}</div>
            <div className="stat-value">{reportData.stats.workHours.toFixed(1)}h</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">{t('charts.overtime')}</div>
            <div className="stat-value">{reportData.stats.overtimeHours.toFixed(1)}h</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">{t('charts.vacation')}</div>
            <div className="stat-value">{reportData.stats.vacationHours.toFixed(1)}h</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">{t('charts.sickLeave')}</div>
            <div className="stat-value">{reportData.stats.sickHours.toFixed(1)}h</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">{t('workLogs.absentHours')}</div>
            <div className="stat-value">{reportData.stats.absentHours.toFixed(1)}h</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">{t('workLogs.totalHours')}</div>
            <div className="stat-value">{reportData.stats.totalHours.toFixed(1)}h</div>
          </div>
        </div>
      </div>

      {hasAnyCosts && (
        <div className="report-costs">
          <h2>{t('reports.costBreakdown')}</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">{t('reports.workCost')}</div>
              <div className="stat-value">{costs.workCost.toFixed(2)} PLN</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">{t('reports.overtimeCost')}</div>
              <div className="stat-value">{costs.overtimeCost.toFixed(2)} PLN</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">{t('reports.totalCost')}</div>
              <div className="stat-value">{costs.totalCost.toFixed(2)} PLN</div>
            </div>
          </div>
        </div>
      )}

      <div className="report-table">
        <h2>{t('workLogs.title')}</h2>
        <table>
          <thead>
            <tr>
              <th>{t('workLogs.date')}</th>
              <th>{t('employees.title')}</th>
              <th>{t('common.type')}</th>
              <th>{t('charts.workHours')}</th>
              <th>{t('charts.overtime')}</th>
              <th>{t('charts.vacation')}</th>
              <th>{t('charts.sickLeave')}</th>
              <th>{t('charts.other')}</th>
              <th>{t('workLogs.absentHours')}</th>
              <th>{t('common.hours')}</th>
            </tr>
          </thead>
          <tbody>
            {reportData.filteredLogs.map(log => (
              <tr key={log.id}>
                <td>{new Date(log.work_date).toLocaleDateString()}</td>
                <td>{getEmployeeName(log.employee_id)}</td>
                <td>{getLogType(log)}</td>
                <td>{parseFloat(log.work_hours || 0).toFixed(1)}</td>
                <td>{parseFloat(log.overtime_hours || 0).toFixed(1)}</td>
                <td>{parseFloat(log.vacation_hours || 0).toFixed(1)}</td>
                <td>{parseFloat(log.sick_leave_hours || 0).toFixed(1)}</td>
                <td>{parseFloat(log.other_hours || 0).toFixed(1)}</td>
                <td>{parseFloat(log.absent_hours || 0).toFixed(1)}</td>
                <td><strong>{getTotalHours(log).toFixed(1)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

PrintableReport.displayName = 'PrintableReport';

export default PrintableReport;
