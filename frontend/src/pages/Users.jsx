import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import UserModal from '../components/UserModal';
import API_URL from '../config';
import './Users.css';

function Users() {
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data);
    } catch (err) {
      setError(t('users.failedLoad'));
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`);
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm(t('users.deleteConfirm'))) return;
    try {
      await axios.delete(`${API_URL}/users/${userId}`);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.detail || t('users.failedDelete');
      alert(msg);
    }
  };

  const handleSaved = () => {
    setModalOpen(false);
    setEditingUser(null);
    fetchUsers();
  };

  const openCreate = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setModalOpen(true);
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === '' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleBadgeClass = (role) => {
    if (role === 'admin') return 'badge badge-admin';
    if (role === 'manager') return 'badge badge-manager';
    return 'badge badge-employee';
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>{t('common.accessDenied')}</h2>
        <p>{t('common.accessDeniedAdmin')}</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>👤 {t('users.title')}</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          {t('users.addUser')}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="users-filters">
        <input
          type="text"
          placeholder={t('users.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="role-filter"
        >
          <option value="">{t('users.allRoles')}</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="col-hide-mobile">{t('users.columnId')}</th>
                  <th>{t('users.columnUsername')}</th>
                  <th>{t('users.columnRole')}</th>
                  <th>{t('users.columnEmployee')}</th>
                  <th className="col-hide-mobile">{t('users.columnCreated')}</th>
                  <th>{t('users.columnActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                      {t('users.noUsers')}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td className="col-hide-mobile">{u.id}</td>
                      <td>{u.username}</td>
                      <td>
                        <span className={roleBadgeClass(u.role)}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {u.employee
                          ? `${u.employee.first_name} ${u.employee.last_name}`
                          : '-'}
                      </td>
                      <td className="col-hide-mobile">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-secondary"
                            onClick={() => openEdit(u)}
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(u.id)}
                            disabled={u.id === currentUser?.id}
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <UserModal
          editingUser={editingUser}
          employees={employees}
          onSaved={handleSaved}
          onClose={() => { setModalOpen(false); setEditingUser(null); }}
        />
      )}
    </div>
  );
}

export default Users;
