import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = 'http://localhost:8000/api';

function Charts({ summaryData }) {
  const { t } = useTranslation();
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const [employeesRes, logsRes] = await Promise.all([
        axios.get(`${API_URL}/employees/`),
        axios.get(`${API_URL}/work-logs/`)
      ]);

      const employees = employeesRes.data;
      const logs = logsRes.data;

      // Calculate hours per employee
      const employeeHours = employees.map(emp => {
        const empLogs = logs.filter(log => log.employee === emp.id);
        const totalHours = empLogs.reduce((sum, log) => sum + parseFloat(log.hours), 0);
        return {
          name: emp.name,
          hours: totalHours
        };
      });

      setEmployeeData(employeeHours);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pie chart data for hours by type
  const pieData = {
    labels: [t('charts.workHours'), t('charts.overtime'), t('charts.vacation'), t('charts.sickLeave')],
    datasets: [
      {
        label: t('workLogs.workHours'),
        data: [
          summaryData?.total_work_hours || 0,
          summaryData?.total_overtime_hours || 0,
          summaryData?.total_vacation_hours || 0,
          summaryData?.total_sick_hours || 0
        ],
        backgroundColor: [
          'rgba(39, 174, 96, 0.8)',   // Green for work
          'rgba(52, 152, 219, 0.8)',   // Blue for overtime
          'rgba(243, 156, 18, 0.8)',   // Yellow for vacation
          'rgba(231, 76, 60, 0.8)'     // Red for sick leave
        ],
        borderColor: [
          'rgba(39, 174, 96, 1)',
          'rgba(52, 152, 219, 1)',
          'rgba(243, 156, 18, 1)',
          'rgba(231, 76, 60, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // Bar chart data for hours by employee
  const barData = {
    labels: employeeData.map(emp => emp.name),
    datasets: [
      {
        label: t('workLogs.totalHours'),
        data: employeeData.map(emp => emp.hours),
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 2
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: t('charts.hoursDistribution'),
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value.toFixed(1)}h (${percentage}%)`;
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: t('charts.monthlyOverview'),
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${t('workLogs.workHours')}: ${context.parsed.y.toFixed(1)}h`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + 'h';
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const hasData = summaryData && (
    summaryData.total_work_hours > 0 ||
    summaryData.total_overtime_hours > 0 ||
    summaryData.total_vacation_hours > 0 ||
    summaryData.total_sick_hours > 0
  );

  if (!hasData) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
          {t('dashboard.noData')}
        </p>
      </div>
    );
  }

  return (
    <div className="charts-container">
      <div className="card">
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <Pie data={pieData} options={pieOptions} />
        </div>
      </div>
      
      {employeeData.length > 0 && (
        <div className="card">
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Charts;
