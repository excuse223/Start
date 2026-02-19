import React, { useState } from 'react';
import axios from 'axios';
import API_URL from '../config';
import './UserModal.css';

const ROLES = ['admin', 'manager', 'employee'];

function generatePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const all = upper + lower + digits + '!@#$%';
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  for (let i = 3; i < 12; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

function UserModal({ editingUser, employees, onSaved, onClose }) {
  const isEdit = !!editingUser;
  const [username, setUsername] = useState(editingUser?.username || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(editingUser?.role || 'employee');
  const [employeeId, setEmployeeId] = useState(
    editingUser?.employee_id != null ? String(editingUser.employee_id) : ''
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleGenerate = () => {
    setPassword(generatePassword());
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isEdit && !password) {
      setError('Password is required.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        const payload = { role };
        if (employeeId !== '') payload.employee_id = Number(employeeId);
        else payload.employee_id = null;
        await axios.put(`${API_URL}/users/${editingUser.id}`, payload);

        if (password) {
          await axios.put(`${API_URL}/users/${editingUser.id}/password`, {
            new_password: password,
          });
        }
      } else {
        const payload = {
          username,
          password,
          role,
        };
        if (employeeId !== '') payload.employee_id = Number(employeeId);
        await axios.post(`${API_URL}/users`, payload);
      }
      onSaved();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg).join(', '));
      } else {
        setError(detail || 'Failed to save user.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit User' : 'Create New User'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isEdit}
              required={!isEdit}
              placeholder="e.g. jan.kowalski"
            />
          </div>

          <div className="form-group">
            <label>{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required={!isEdit}
                placeholder={isEdit ? 'Leave blank to keep current' : 'Min 8 chars, upper+lower+number'}
                autoComplete="new-password"
              />
              <button type="button" className="btn-icon" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? '🙈' : '👁️'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleGenerate}>
                Generate
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select value={role} onChange={e => setRole(e.target.value)} required>
              {ROLES.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Link to Employee</label>
            <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              <option value="">— No link —</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} (#{emp.id})
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserModal;
