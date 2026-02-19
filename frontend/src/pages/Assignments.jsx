import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';
import './Assignments.css';

function Assignments() {
  const { user: currentUser } = useAuth();
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedToAssign, setSelectedToAssign] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchManagers();
    fetchAllEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedManager) {
      fetchAssignments(selectedManager);
    } else {
      setAssignments([]);
    }
  }, [selectedManager]);

  const fetchManagers = async () => {
    try {
      const resp = await axios.get(`${API_URL}/users`);
      setManagers(resp.data.filter(u => u.role === 'manager'));
    } catch (err) {
      console.error('Error fetching managers:', err);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const resp = await axios.get(`${API_URL}/employees`);
      setAllEmployees(resp.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchAssignments = async (managerId) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await axios.get(`${API_URL}/assignments/manager/${managerId}`);
      setAssignments(resp.data);
    } catch (err) {
      setError('Failed to load assignments.');
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (assignmentId) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      await axios.delete(`${API_URL}/assignments/${assignmentId}`);
      fetchAssignments(selectedManager);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to remove assignment.';
      alert(msg);
    }
  };

  const handleAssign = async () => {
    if (selectedToAssign.length === 0) return;
    const errors = [];
    await Promise.all(
      selectedToAssign.map(empId =>
        axios.post(`${API_URL}/assignments`, {
          manager_user_id: Number(selectedManager),
          employee_id: empId,
        }).catch(err => {
          const msg = err.response?.data?.detail || `Failed to assign employee #${empId}.`;
          errors.push(msg);
        })
      )
    );
    setModalOpen(false);
    setSelectedToAssign([]);
    fetchAssignments(selectedManager);
    if (errors.length > 0) {
      alert('Some assignments failed:\n' + errors.join('\n'));
    }
  };

  const toggleSelect = (empId) => {
    setSelectedToAssign(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const assignedEmployeeIds = assignments.map(a => a.employee_id);
  const availableEmployees = allEmployees.filter(e => !assignedEmployeeIds.includes(e.id));

  if (currentUser?.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You need admin role to view this page.</p>
      </div>
    );
  }

  return (
    <div className="assignments-page">
      <h1>👔 Manager Assignments</h1>

      <div className="manager-selector">
        <label>Select Manager:</label>
        <select
          value={selectedManager}
          onChange={e => setSelectedManager(e.target.value)}
        >
          <option value="">— Choose a manager —</option>
          {managers.map(m => (
            <option key={m.id} value={m.id}>
              {m.username}
              {m.employee ? ` (${m.employee.first_name} ${m.employee.last_name})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedManager && (
        <div className="assignments-section">
          <div className="assignments-header">
            <h2>Assigned Employees ({assignments.length})</h2>
            <button
              className="btn btn-primary"
              onClick={() => { setSelectedToAssign([]); setModalOpen(true); }}
            >
              + Assign Employee
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : assignments.length === 0 ? (
            <p className="no-assignments">No employees assigned to this manager yet.</p>
          ) : (
            <div className="employee-cards">
              {assignments.map(a => (
                <div key={a.id} className="employee-card">
                  <div className="employee-card-info">
                    <strong>
                      {a.employee
                        ? `${a.employee.first_name} ${a.employee.last_name}`
                        : `Employee #${a.employee_id}`}
                    </strong>
                    {a.employee?.email && (
                      <span className="employee-card-email">{a.employee.email}</span>
                    )}
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemove(a.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-assign">
              <h2>Assign Employees</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            {availableEmployees.length === 0 ? (
              <p>All employees are already assigned to this manager.</p>
            ) : (
              <div className="assign-list">
                {availableEmployees.map(emp => (
                  <label key={emp.id} className="assign-item">
                    <input
                      type="checkbox"
                      checked={selectedToAssign.includes(emp.id)}
                      onChange={() => toggleSelect(emp.id)}
                    />
                    <span>
                      {emp.first_name} {emp.last_name}
                      {emp.email && <small> — {emp.email}</small>}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="modal-actions-assign">
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssign}
                disabled={selectedToAssign.length === 0}
              >
                Assign Selected ({selectedToAssign.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assignments;
