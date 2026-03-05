import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';
import './Calendar.css';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function Calendar() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [employeeId, setEmployeeId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      axios.get(`${API_URL}/employees`).then(r => setEmployees(r.data)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, employeeId]);

  const fetchCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { year, month };
      if (employeeId) params.employee_id = employeeId;
      const resp = await axios.get(`${API_URL}/calendar`, { params });
      setDays(resp.data.days);
    } catch (err) {
      setError('Failed to load calendar data.');
      setDays([]);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const dayMap = {};
  days.forEach(d => { dayMap[d.date] = d; });

  const daysInMonth = getDaysInMonth(year, month - 1);
  const firstDay = getFirstDayOfMonth(year, month - 1);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateStr = (d) => {
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const getCellClass = (d) => {
    if (!d) return 'calendar-cell empty';
    const entry = dayMap[dateStr(d)];
    if (!entry) return 'calendar-cell';
    const total = entry.work_hours + entry.overtime_hours + entry.vacation_hours + entry.sick_leave_hours;
    if (total === 0) return 'calendar-cell';
    if (entry.vacation_hours > 0) return 'calendar-cell day-vacation';
    if (entry.sick_leave_hours > 0) return 'calendar-cell day-sick';
    if (total >= 8) return 'calendar-cell day-full';
    return 'calendar-cell day-partial';
  };

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h1>📅 Work Calendar</h1>
        {(user?.role === 'admin' || user?.role === 'manager') && employees.length > 0 && (
          <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="employee-filter">
            <option value="">— My Calendar —</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="calendar-nav">
        <button className="nav-btn" onClick={prevMonth}>‹</button>
        <h2>{MONTH_NAMES[month - 1]} {year}</h2>
        <button className="nav-btn" onClick={nextMonth}>›</button>
        <button className="btn btn-secondary today-btn" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}>
          Today
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <>
          <div className="calendar-grid">
            {DAY_NAMES.map(name => (
              <div key={name} className="calendar-day-name">{name}</div>
            ))}
            {cells.map((d, idx) => {
              const entry = d ? dayMap[dateStr(d)] : null;
              const total = entry ? (entry.work_hours + entry.overtime_hours + entry.vacation_hours + entry.sick_leave_hours) : 0;
              const isToday = d && dateStr(d) === new Date().toISOString().slice(0, 10);
              return (
                <div
                  key={idx}
                  className={`${getCellClass(d)}${isToday ? ' today' : ''}`}
                  onClick={() => d && entry && setSelectedDay({ d, entry })}
                >
                  {d && (
                    <>
                      <span className="day-number">{d}</span>
                      {entry && total > 0 && (
                        <div className="day-hours">
                          {entry.work_hours > 0 && <span className="h-work">{entry.work_hours}h</span>}
                          {entry.vacation_hours > 0 && <span className="h-vac">🏖</span>}
                          {entry.sick_leave_hours > 0 && <span className="h-sick">🤒</span>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="calendar-legend">
            <span className="legend-item day-full">≥8h work</span>
            <span className="legend-item day-partial">partial work</span>
            <span className="legend-item day-vacation">vacation</span>
            <span className="legend-item day-sick">sick leave</span>
          </div>
        </>
      )}

      {selectedDay && (
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="day-modal" onClick={e => e.stopPropagation()}>
            <div className="day-modal-header">
              <h3>📅 {selectedDay.entry.date}</h3>
              <button onClick={() => setSelectedDay(null)} className="modal-close">✕</button>
            </div>
            <div className="day-modal-body">
              <div className="day-stat"><span>Work Hours</span><strong>{selectedDay.entry.work_hours}h</strong></div>
              <div className="day-stat"><span>Overtime</span><strong>{selectedDay.entry.overtime_hours}h</strong></div>
              <div className="day-stat"><span>Vacation</span><strong>{selectedDay.entry.vacation_hours}h</strong></div>
              <div className="day-stat"><span>Sick Leave</span><strong>{selectedDay.entry.sick_leave_hours}h</strong></div>
              {selectedDay.entry.notes && <div className="day-notes"><em>{selectedDay.entry.notes}</em></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
