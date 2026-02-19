-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    hourly_rate NUMERIC(10, 2),
    overtime_rate NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work logs table
CREATE TABLE IF NOT EXISTS work_logs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    work_hours NUMERIC(10, 2) DEFAULT 0.0,
    overtime_hours NUMERIC(10, 2) DEFAULT 0.0,
    vacation_hours NUMERIC(10, 2) DEFAULT 0.0,
    sick_leave_hours NUMERIC(10, 2) DEFAULT 0.0,
    absent_hours NUMERIC(10, 2) DEFAULT 0.0,
    other_hours NUMERIC(10, 2) DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, work_date)
);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Manager-Employee assignments (which employees can a manager see/manage)
CREATE TABLE IF NOT EXISTS manager_employee_assignments (
    id SERIAL PRIMARY KEY,
    manager_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manager_user_id, employee_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_manager_assignments_manager ON manager_employee_assignments(manager_user_id);
CREATE INDEX IF NOT EXISTS idx_manager_assignments_employee ON manager_employee_assignments(employee_id);
