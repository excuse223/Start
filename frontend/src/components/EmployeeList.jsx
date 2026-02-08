import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    department: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/employees/`);
      setEmployees(response.data);
    } catch (err) {
      setError('Failed to load employees. Please try again.');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/employees/`, formData);
      setShowAddForm(false);
      setFormData({ name: '', email: '', position: '', department: '' });
      fetchEmployees();
    } catch (err) {
      alert('Failed to add employee. Please try again.');
      console.error('Error adding employee:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/employees/${id}/`);
      fetchEmployees();
    } catch (err) {
      alert('Failed to delete employee. Please try again.');
      console.error('Error deleting employee:', err);
    }
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
      <div className="employee-header">
        <h1>Employees</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showAddForm && (
        <div className="card">
          <h2>Add New Employee</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
              />
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-success">
                Add Employee
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Position</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No employees found. Add your first employee to get started.
                  </td>
                </tr>
              ) : (
                employees.map(employee => (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{employee.email}</td>
                    <td>{employee.position || '-'}</td>
                    <td>{employee.department || '-'}</td>
                    <td>
                      <div className="btn-group">
                        <Link 
                          to={`/employees/${employee.id}`} 
                          className="btn btn-primary"
                        >
                          View
                        </Link>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDelete(employee.id)}
                        >
                          Delete
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
    </div>
  );
}

export default EmployeeList;
