# User Guide - Work Hours Management System

## Table of Contents
1. [Getting Started & Login](#login)
2. [Dashboard](#dashboard)
3. [Managing Employees](#employees)
4. [Logging Work Hours](#work-logs)
5. [Using the Calendar](#calendar)
6. [Managing Projects](#projects)
7. [Viewing Reports](#reports)
8. [User Management (Admin)](#users)
9. [Manager Assignments (Admin)](#assignments)
10. [Configuring Backups (Admin)](#backups)
11. [System Settings (Admin)](#settings)

---

## 1. Getting Started & Login {#login}

1. Navigate to the application URL in your browser.
2. Enter your **username** and **password**.
3. Click **Login**.

Your role (admin / manager / employee) determines which features you can access.

---

## 2. Dashboard {#dashboard}

The Dashboard gives you a quick overview of:
- **Total hours** worked by all employees this month
- **Work / Overtime / Vacation / Sick Leave** breakdowns
- Interactive charts showing hour distributions and monthly trends

---

## 3. Managing Employees {#employees}

Navigate to **👥 Employees** in the sidebar.

### Adding an Employee
1. Click **+ Add Employee**.
2. Fill in First Name, Last Name, Email (optional), Hourly Rate, Overtime Rate.
3. Click **Add Employee**.

### Viewing Employee Details
Click **View** next to any employee to see their full work log history.

### Deleting an Employee
Click **Delete** next to an employee. This will also remove all their work logs.

---

## 4. Logging Work Hours {#work-logs}

From the Employee Details page:
1. Click **Add Work Log**.
2. Select the **date**, enter hours for each category (Work, Overtime, Vacation, Sick Leave, Other).
3. Add optional **notes**.
4. Click **Save**.

> ⚠️ You cannot enter more than 24 hours per day across all categories.

---

## 5. Using the Calendar {#calendar}

Navigate to **📅 Calendar** in the sidebar.

- View your work logs in a month grid.
- Color-coded days: **green** = full day worked, **yellow** = partial, **blue** = vacation, **red** = sick leave.
- Click a colored day to see the details.
- Use **‹ ›** arrows to navigate months.
- Admins and managers can switch between employees using the dropdown.

---

## 6. Managing Projects {#projects}

Navigate to **📁 Projects** in the sidebar (admin/manager only).

### Creating a Project
1. Click **+ New Project**.
2. Fill in Name, Client, Description, Budget, Deadline, Status.
3. Click **Create Project**.

### Project Statuses
- **Planning** - Project is being planned
- **Active** - Currently in progress
- **On Hold** - Temporarily paused
- **Completed** - Successfully finished
- **Cancelled** - Project cancelled

---

## 7. Viewing Reports {#reports}

Navigate to **📈 Reports** in the sidebar.

1. Select an **employee** (or leave blank for all).
2. Set the **date range** (start/end date).
3. Select **format** (JSON or PDF).
4. Click **Generate Report**.

Reports show total hours, cost breakdown, and individual work log entries.

---

## 8. User Management (Admin) {#users}

Navigate to **👤 Users** in the sidebar (admin only).

### Creating a User
1. Click **+ Add User**.
2. Enter username and password (use the password generator for a secure one).
3. Select a role: **admin**, **manager**, or **employee**.
4. Optionally link to an employee record.
5. Click **Create User**.

### Editing a User
Click **Edit** next to a user to modify their details (password is only changed if provided).

---

## 9. Manager Assignments (Admin) {#assignments}

Navigate to **👔 Assignments** in the sidebar.

1. Select a **manager** from the dropdown.
2. Click **+ Assign Employee** to assign employees to this manager.
3. Click **Remove** to remove an assignment.

Managers can only see and manage their assigned employees.

---

## 10. Configuring Backups (Admin) {#backups}

Navigate to **💾 Backups** in the sidebar.

### Creating a Manual Backup
Click **+ Create Backup Now** to immediately create a database backup.

### Viewing Backups
The table shows all backups with their date, size, type, location, and status.

### Restoring a Backup
Click **Restore** next to a completed backup. Confirm the warning dialog.

> ⚠️ Restoring overwrites current data. Make sure you have a recent backup before restoring.

---

## 11. System Settings (Admin) {#settings}

Navigate to **⚙️ Settings** in the sidebar.

Configure:
- **General**: Company name, logo, currency, timezone, date format
- **Work Hours**: Default hours/day, overtime threshold
- **Appearance**: Date format, currency display
- **Security**: Session timeout, password policy

Click **💾 Save Settings** to apply changes.

---

## Dark Mode

Click the **🌙** button at the bottom of the sidebar to switch to dark mode. Click **☀️** to switch back.

## Global Search

Press **Ctrl+K** (or **Cmd+K** on Mac) to open global search. Type to search for employees, projects, or users.
