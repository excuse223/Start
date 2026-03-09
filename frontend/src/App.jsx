import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ForcePasswordChange from './pages/ForcePasswordChange';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeDetails from './components/EmployeeDetails';
import Reports from './components/Reports';
import Users from './pages/Users';
import Assignments from './pages/Assignments';
import Projects from './pages/Projects';
import Backups from './pages/Backups';
import Calendar from './pages/Calendar';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import './App.css';
import './styles/themes.css';

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
            <Route path="/force-password-change" element={<ForcePasswordChange />} />

            {/* Protected routes using layout */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employees" element={<EmployeeList />} />
              <Route path="/employees/:id" element={<EmployeeDetails />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={<Users />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/backups" element={<Backups />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
