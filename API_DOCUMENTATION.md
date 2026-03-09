# API Documentation - Work Hours Management System

## Base URL
```
http://localhost:8000
```

## Authentication
All protected endpoints require a Bearer token obtained from `/api/auth/login`.

```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST /api/auth/login
Login and obtain JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

---

## Employees Endpoints

### GET /api/employees
List all employees with last entry information.

**Auth:** Required  
**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "hourly_rate": 50.0,
    "overtime_rate": 75.0,
    "last_entry": {
      "date": "2026-03-05",
      "work_hours": 8.0
    }
  }
]
```

### POST /api/employees
Create a new employee.

**Auth:** Required  
**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "hourly_rate": 45.0,
  "overtime_rate": 67.5
}
```
**Response:** `201 Created`

### GET /api/employees/{id}
Get employee by ID.

**Auth:** Required  
**Response:** `200 OK` or `404 Not Found`

### PUT /api/employees/{id}
Update employee.

**Auth:** Required  
**Response:** `200 OK`

### DELETE /api/employees/{id}
Delete employee and all their work logs.

**Auth:** Required  
**Response:** `204 No Content`

---

## Work Logs Endpoints

### GET /api/work-logs
List work logs with optional filters.

**Auth:** Required  
**Query Params:** `employee_id`, `start_date`, `end_date`, `skip`, `limit`

### POST /api/work-logs
Create a work log entry.

**Auth:** Required  
**Request Body:**
```json
{
  "employee_id": 1,
  "work_date": "2026-03-05",
  "work_hours": 8.0,
  "overtime_hours": 0,
  "vacation_hours": 0,
  "sick_leave_hours": 0,
  "notes": "Regular day"
}
```

### PUT /api/work-logs/{id}
Update a work log entry.

### DELETE /api/work-logs/{id}
Delete a work log entry.

---

## Projects Endpoints

### GET /api/projects
List all projects.

**Auth:** Required  
**Query Params:** `status_filter` (planning/active/on_hold/completed/cancelled)

### POST /api/projects
Create a project. **Admin/Manager only.**

**Request Body:**
```json
{
  "name": "Website Redesign",
  "client": "ACME Corp",
  "description": "Redesign the company website",
  "budget": 50000.0,
  "deadline": "2026-06-30",
  "status": "planning"
}
```
**Response:** `201 Created`

### GET /api/projects/{id}
Get project details.

### PUT /api/projects/{id}
Update project. **Admin/Manager only.**

### DELETE /api/projects/{id}
Delete project. **Admin only.**

### GET /api/projects/{id}/employees
Get project team members.

### POST /api/projects/{id}/employees
Add employee to project team.

**Request Body:** `{"employee_id": 1}`

### DELETE /api/projects/{id}/employees/{employee_id}
Remove employee from project team.

---

## Backups Endpoints (Admin Only)

### GET /api/backups
List all backups.

### POST /api/backups
Create a new backup immediately.

**Response:** `201 Created`
```json
{
  "id": 1,
  "filename": "backup_20260305_020000.tar.gz",
  "file_size": 102400,
  "backup_type": "full",
  "storage_location": "local",
  "status": "completed",
  "checksum": "abc123...",
  "created_at": "2026-03-05T02:00:00"
}
```

### GET /api/backups/status
Get backup system status.

**Response:**
```json
{
  "last_backup": "2026-03-05T02:00:00",
  "last_status": "completed",
  "total_backups": 30,
  "next_scheduled": "Daily at 02:00 UTC"
}
```

### GET /api/backups/config
Get backup configuration.

### PUT /api/backups/config
Update backup configuration.

### POST /api/backups/{id}/restore
Restore from a backup (with confirmation).

### DELETE /api/backups/{id}
Delete a backup record and file.

---

## Calendar Endpoint

### GET /api/calendar
Get work logs grouped by day for a month.

**Auth:** Required  
**Query Params:** `year` (required), `month` (required, 1-12), `employee_id` (optional)

**Response:**
```json
{
  "year": 2026,
  "month": 3,
  "employee_id": 1,
  "days": [
    {
      "date": "2026-03-01",
      "work_hours": 8.0,
      "overtime_hours": 0,
      "vacation_hours": 0,
      "sick_leave_hours": 0,
      "notes": null
    }
  ]
}
```

---

## Notifications Endpoints

### GET /api/notifications
Get current user's notifications (last 50).

### POST /api/notifications/read/{id}
Mark notification as read.

### POST /api/notifications/read-all
Mark all notifications as read.

### DELETE /api/notifications/{id}
Delete a notification.

---

## Search Endpoint

### GET /api/search
Global search across employees, projects, users.

**Auth:** Required  
**Query Params:** `q` (search query, min 1 char)

**Response:**
```json
{
  "query": "john",
  "results": {
    "employees": [{"id": 1, "type": "employee", "title": "John Doe", "subtitle": "john@example.com"}],
    "projects": [],
    "users": [{"id": 1, "type": "user", "title": "johnadmin", "subtitle": "admin"}]
  }
}
```

---

## Audit Logs Endpoint (Admin Only)

### GET /api/audit
List audit log entries.

**Query Params:** `user_id`, `action`, `entity_type`, `limit` (max 500)

---

## Settings Endpoints (Admin Only)

### GET /api/settings
Get all settings.

**Response:**
```json
[
  {"key": "company_name", "value": "ACME Corp", "description": "Company name displayed in the system"},
  {"key": "currency", "value": "USD", "description": "Currency used for billing"}
]
```

### PUT /api/settings
Update settings.

**Request Body:**
```json
{
  "settings": {
    "company_name": "New Company Name",
    "currency": "EUR"
  }
}
```

---

## Users Endpoints (Admin Only)

### GET /api/users
List all users.

### POST /api/users
Create a user.

**Request Body:**
```json
{
  "username": "newuser",
  "password": "securepassword",
  "role": "employee",
  "employee_id": null
}
```

### PUT /api/users/{id}
Update a user.

### DELETE /api/users/{id}
Delete a user.

---

## Assignments Endpoints (Admin Only)

### GET /api/assignments
List all manager-employee assignments.

### GET /api/assignments/manager/{manager_id}
Get assignments for a specific manager.

### POST /api/assignments
Create an assignment.

**Request Body:**
```json
{
  "manager_user_id": 2,
  "employee_id": 5
}
```

### DELETE /api/assignments/{id}
Remove an assignment.

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 403 | Forbidden / Auth required |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 422 | Validation Error |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
